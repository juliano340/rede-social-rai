# ISSUE #1: Redundant N+1 Like Queries

**Status:** CRITICAL (P0)  
**Impacto:** 95% redução em API calls  
**Esforço:** 2-3 dias  
**Dependência:** Nenhuma (pode ser feito primeiro)

---

## 📋 Problema Atual

### Symptoma
- Loading 20 posts triggers 21 API calls (1 feed + 20 like checks)
- Each like check is sequential (no batching/debouncing)
- Network waterfall: requests are not parallelized

### Root Cause
**File:** `frontend/src/app/components/home/home.component.ts` (lines 1618-1626)

```typescript
// ❌ WRONG - Makes 1 call per post
if (this.authService.isLoggedIn()) {
  response.posts.forEach((post: any) => {
    this.postsService.isLiked(post.id).subscribe({
      next: (liked: any) => {
        this.postLikes.update(likes => ({ ...likes, [post.id]: liked }));
      },
    });
  });
}
```

### Impact on Database
- **Backend querying**: 20 separate SQL queries instead of 1 aggregated query
- **Server load**: Linear growth with post count
- **User experience**: Page appears loaded but interactions are slow

---

## ✅ Solução

### Escopo de Mudanças

#### Backend (`backend/src/posts/posts.service.ts`)

**Mudança 1:** Incluir status de like na resposta do POST

```typescript
async findAll(cursor?: string, limit = 20, userId?: string) {
  const take = limit + 1;
  const where = cursor ? { createdAt: { lt: await this.getCursorDate(cursor) } } : {};

  const posts = await this.prisma.post.findMany({
    where,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: COUNT_SELECT },
      // NEW: Include current user's like status
      likes: userId 
        ? { where: { userId }, select: { id: true } } 
        : false,
    },
  });

  // Map to isLiked boolean
  return this.buildCursorPagination(
    posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes.length > 0 : false,
      likes: undefined,  // Remove raw array from response
    })),
    limit
  );
}
```

**Mudança 2:** Atualizar response DTO

```typescript
// posts/dto/post-response.dto.ts
export class PostResponseDto {
  id: string;
  content: string;
  author: UserDto;
  mediaUrl?: string;
  mediaType?: string;
  linkUrl?: string;
  createdAt: string;
  
  // Agregação de contadores
  _count: {
    likes: number;
    replies: number;
  };
  
  // NEW: Current user's interaction status
  isLiked: boolean;
}
```

#### Frontend (`frontend/src/app/services/posts.service.ts`)

**Mudança:** Remover `isLiked()` method

```typescript
// ❌ DELETE THIS METHOD
// isLiked(postId: string): Observable<boolean> {
//   return this.http.get<{ liked: boolean }>(
//     `${this.apiUrl}/posts/${postId}/liked`,
//     { withCredentials: true }
//   ).pipe(map(res => res.liked));
// }

// ✅ KEEP THIS - Now returns isLiked in post object
getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
  let params = new HttpParams().set('limit', limit.toString());
  if (cursor) {
    params = params.set('cursor', cursor);
  }
  return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, { params, withCredentials: true });
}
```

#### Frontend (`frontend/src/app/components/home/home.component.ts`)

**Mudança:** Extract like status from response, not separate API calls

```typescript
loadPosts() {
  this.isLoading.set(true);
  this.loadError.set(null);
  
  const feed = this.feedType();
  const request = feed === 'following'
    ? this.postsService.getFollowingPosts()
    : this.postsService.getPosts();
  
  request.subscribe({
    next: (response) => {
      this.posts.set(response.posts);
      
      // ✅ NEW: Extract like status from response directly
      if (this.authService.isLoggedIn()) {
        const likes: Record<string, boolean> = {};
        response.posts.forEach(post => {
          // isLiked now comes from API response, not separate call
          likes[post.id] = post.isLiked || false;
        });
        this.postLikes.set(likes);
      }
      
      this.isLoading.set(false);
    },
    error: (err) => {
      this.loadError.set('Não foi possível carregar as publicações.');
      this.isLoading.set(false);
    }
  });
}
```

---

## 🧪 Testes

### Unit Tests (Backend)

**File:** `backend/src/posts/posts.service.spec.ts`

```typescript
describe('PostsService.findAll()', () => {
  it('should include isLiked=true when user has liked post', async () => {
    // Setup: create post, user, and like
    const user = await createUser();
    const post = await createPost();
    await createLike(user.id, post.id);
    
    // Execute
    const result = await service.findAll(undefined, 20, user.id);
    
    // Assert
    expect(result.posts[0].isLiked).toBe(true);
  });

  it('should include isLiked=false when user has NOT liked post', async () => {
    const user = await createUser();
    const post = await createPost();
    // No like created
    
    const result = await service.findAll(undefined, 20, user.id);
    
    expect(result.posts[0].isLiked).toBe(false);
  });

  it('should NOT include likes array in response', async () => {
    const result = await service.findAll();
    
    // isLiked should be boolean, not array
    expect(typeof result.posts[0].isLiked).toBe('boolean');
    expect(result.posts[0].likes).toBeUndefined();
  });

  it('should return isLiked=false for unauthenticated users', async () => {
    const post = await createPost();
    
    const result = await service.findAll(undefined, 20, undefined); // No userId
    
    expect(result.posts[0].isLiked).toBe(false);
  });
});
```

### Integration Tests (Frontend)

**File:** `frontend/src/app/services/posts.service.spec.ts`

```typescript
describe('PostsService (Like Status)', () => {
  it('should fetch posts with isLiked status in single call', (done) => {
    service.getPosts().subscribe(response => {
      // Should get posts WITH like status
      expect(response.posts.length).toBeGreaterThan(0);
      expect(response.posts[0]).toHaveProperty('isLiked');
      expect(typeof response.posts[0].isLiked).toBe('boolean');
      done();
    });
  });
});
```

### E2E Tests

**File:** `e2e/like-flow.spec.ts`

```typescript
describe('Like Flow (No N+1)', () => {
  it('should load 20 posts with 1 API call', async () => {
    // Clear network monitoring
    const requests = [];
    page.on('response', req => requests.push(req.url()));
    
    // Load feed
    await page.goto('/home');
    await page.waitForSelector('[data-test="post-card"]');
    
    // Should be only 1 request to /posts endpoint
    const postRequests = requests.filter(u => u.includes('/posts') && !u.includes('/'));
    expect(postRequests.length).toBe(1);
    
    // Posts should have like status
    const posts = await page.locator('[data-test="post-card"]');
    expect(await posts.count()).toBeGreaterThan(0);
  });
});
```

---

## 📝 Checklist de Implementação

### Backend
- [ ] Atualizar `posts.service.ts` - add `isLiked` logic
- [ ] Atualizar `posts.controller.ts` - pass userId to service
- [ ] Criar/atualizar DTO com `isLiked: boolean`
- [ ] Migration: add indexes se necessário (já existem?)
- [ ] Unit tests passing
- [ ] Integration tests passing

### Frontend
- [ ] Atualizar `posts.service.ts` - remove `isLiked()` method
- [ ] Atualizar `home.component.ts` - extract from response
- [ ] Remove `postLikes` signal se não mais necessário
- [ ] Update types (PostResponse DTO)
- [ ] Unit tests passing
- [ ] Integration tests passing

### E2E & QA
- [ ] Network waterfall inspection
- [ ] Verify 1 call per feed load (21 → 1)
- [ ] Test with logged-in user
- [ ] Test with anonymous user
- [ ] Test with empty feed
- [ ] Test with 100+ posts

---

## ✨ Critérios de Aceitação

- [ ] **AC1:** Feed de 20 posts usa 1 chamada /posts endpoint (não 21)
- [ ] **AC2:** Resposta incluí `isLiked: boolean` para cada post
- [ ] **AC3:** `GET /posts/:id/liked` endpoint não é mais chamado
- [ ] **AC4:** Usuarios não-autenticados recebem `isLiked: false`
- [ ] **AC5:** Performance: feed loads em <1s (vs 2.5s antes)
- [ ] **AC6:** Sem quebra em features existentes (likes, posts, etc)

---

## 🔄 Rollback Plan

Se algo quebrar em produção:

1. **Rollback código**: `git revert <commit-hash>`
2. **DB migration**: Nenhuma mudança no schema necessária
3. **Cache clear**: Limpar browser cache dos clientes
4. **Monitoring**: Verificar se todas as métricas voltam ao baseline

---

## 📊 Before/After Metrics

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| API calls (feed) | 21 | 1 | 95% ↓ |
| DB queries | 20 | 1 | 95% ↓ |
| Feed load time | 2.5s | ~1s | 60% ↓ |
| Time to interactive | 2.8s | ~1.2s | 57% ↓ |

---

## 📚 Referências

- **ARCHITECTURE_REVIEW.md** - Section "ISSUE 1"
- **Backend Prisma docs**: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries
- **Angular types**: `PostResponse` interface in types.ts
