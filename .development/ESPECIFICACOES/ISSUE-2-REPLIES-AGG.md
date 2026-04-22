# ISSUE #2: Replies Fetched Separately (Should Be Aggregated)

**Status:** HIGH (P1)  
**Impacto:** Replies included in feed load, no waterfall  
**Esforço:** 4-5 dias  
**Dependência:** Recomendado: ISSUE #1 & #4 primeiro

---

## 📋 Problema Atual

### Symptoma
- Feed returns posts WITHOUT their replies
- User clicks "replies" button → separate API call (`getReplies`)
- Creating new reply → refetch ALL replies (inefficient)
- Nested replies require recursion (N+1 problem)

### Current Flow (Broken)
```
1. GET /posts → returns posts (no replies)
2. User clicks "replies" button
3. GET /posts/:id/replies → fetches replies
4. User writes reply
5. POST /posts/:id/reply → submit
6. GET /posts/:id/replies → refetch ALL (wasteful)
```

### Why It's Wrong
1. **Incomplete data model**: Post without replies is incomplete
2. **Waterfalling**: Can't load replies until post detail is opened
3. **Offset pagination**: Uses page/limit instead of cursor
4. **Redundant refetch**: Creating a reply triggers full refetch
5. **N+1 nested**: Getting nested replies requires multiple queries

---

## ✅ Solução

### Escopo de Mudanças

#### Backend - Schema Update

**File:** `backend/prisma/schema.prisma`

```prisma
model Reply {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  postId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // Support nested replies (reply to reply)
  parentId String?
  parent   Reply?  @relation("ReplyToReply", fields: [parentId], references: [id], onDelete: Cascade)
  children Reply[] @relation("ReplyToReply")

  // Add index for cursor pagination
  @@index([postId])
  @@index([parentId])
  @@index([createdAt])
}
```

**Migration:** `backend/prisma/migrations/xxx_add_reply_indexes/migration.sql`

```sql
-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS "Reply_createdAt_idx" ON "Reply"("createdAt");
CREATE INDEX IF NOT EXISTS "Reply_parentId_idx" ON "Reply"("parentId");
CREATE INDEX IF NOT EXISTS "Reply_postId_createdAt_idx" ON "Reply"("postId", "createdAt");
```

#### Backend - Service Layer

**File:** `backend/src/posts/posts.service.ts`

```typescript
// Updated response structure with aggregated replies
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
      likes: userId ? { where: { userId }, select: { id: true } } : false,
      // NEW: Aggregate top replies in feed
      replies: {
        where: { parentId: null },  // Only top-level replies
        take: 3,  // Top 3 replies to preview in feed
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { children: true } },
          children: {
            take: 2,  // Top 2 nested replies under each
            orderBy: { createdAt: 'desc' },
            include: { author: { select: AUTHOR_SELECT } },
          },
        },
      },
    },
  });

  return this.buildCursorPagination(
    posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes.length > 0 : false,
      likes: undefined,
    })),
    limit
  );
}

// Fetch full reply thread with cursor pagination (when user clicks "show all replies")
async getReplies(postId: string, cursor?: string, limit = 20) {
  const take = limit + 1;
  const where: { postId: string; parentId: null; createdAt?: { lt: Date } } = {
    postId,
    parentId: null,  // Only top-level replies
  };

  if (cursor) {
    where.createdAt = { lt: await this.getCursorDate(cursor) };
  }

  const replies = await this.prisma.reply.findMany({
    where,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { children: true } },
      children: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { children: true } },
          // 3rd level if needed
          children: {
            take: 5,
            include: { author: { select: AUTHOR_SELECT } },
          },
        },
      },
    },
  });

  const hasMore = replies.length > limit;
  const results = hasMore ? replies.slice(0, limit) : replies;
  const nextCursor = hasMore && results.length > 0
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return { replies: results, nextCursor, hasMore };
}
```

#### Backend - Controller

**File:** `backend/src/posts/posts.controller.ts`

```typescript
@Get(':id/replies')
@Public()
async getReplies(
  @Param('id') postId: string,
  @Query('cursor') cursor?: string,
  @Query('limit') limit?: string,
) {
  const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
  return this.postsService.getReplies(postId, cursor, parsedLimit);
}
```

#### Frontend - Service Update

**File:** `frontend/src/app/services/posts.service.ts`

```typescript
// Returns posts with aggregated replies
getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
  let params = new HttpParams().set('limit', limit.toString());
  if (cursor) {
    params = params.set('cursor', cursor);
  }
  return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, { params, withCredentials: true });
}

// Fetch full reply thread (cursor-based, not page-based!)
getReplies(postId: string, cursor?: string, limit = 20): Observable<RepliesResponse> {
  const params = new HttpParams()
    .set('limit', limit.toString())
    .setIf(!!cursor, 'cursor', cursor!);

  return this.http.get<RepliesResponse>(`${this.apiUrl}/posts/${postId}/replies`, { params, withCredentials: true });
}
```

#### Frontend - DTOs

```typescript
// posts/dto/post-response.dto.ts
export class ReplyDto {
  id: string;
  content: string;
  author: UserDto;
  createdAt: string;
  _count: { children: number };
  children?: ReplyDto[];  // Nested replies
}

export class PostResponseDto {
  id: string;
  content: string;
  author: UserDto;
  createdAt: string;
  _count: { likes: number; replies: number };
  isLiked: boolean;
  replies?: ReplyDto[];  // Aggregated in feed
}

export class PostsResponseDto {
  posts: PostResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class RepliesResponseDto {
  replies: ReplyDto[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

---

## 🧪 Testes

### Backend Unit Tests

```typescript
describe('PostsService - Replies Aggregation', () => {
  it('should include top 3 replies in feed response', async () => {
    const post = await createPost();
    await createReply(post.id, 'Reply 1');
    await createReply(post.id, 'Reply 2');
    await createReply(post.id, 'Reply 3');
    await createReply(post.id, 'Reply 4');
    
    const result = await service.findAll();
    
    // Only top 3 included in feed
    expect(result.posts[0].replies).toHaveLength(3);
  });

  it('should include nested replies up to 2 levels', async () => {
    const post = await createPost();
    const reply1 = await createReply(post.id, 'Main reply');
    const reply2 = await createReply(post.id, 'Nested 1', reply1.id);
    const reply3 = await createReply(post.id, 'Nested 2', reply2.id);
    
    const result = await service.findAll();
    
    // Check structure
    expect(result.posts[0].replies[0].children).toBeDefined();
    expect(result.posts[0].replies[0].children[0].children).toBeDefined();
  });

  it('should use cursor pagination for getReplies()', async () => {
    const post = await createPost();
    for (let i = 0; i < 50; i++) {
      await createReply(post.id, `Reply ${i}`);
    }
    
    const page1 = await service.getReplies(post.id, undefined, 20);
    
    expect(page1.replies).toHaveLength(20);
    expect(page1.nextCursor).toBeDefined();
    expect(page1.hasMore).toBe(true);
    
    // Fetch next page with cursor
    const page2 = await service.getReplies(post.id, page1.nextCursor, 20);
    expect(page2.replies[0].id).not.toEqual(page1.replies[page1.replies.length - 1].id);
  });

  it('should NOT use offset-based pagination', async () => {
    // This test ensures we're using cursor, not page/limit
    const result = await service.getReplies('post-id');
    
    expect(result).toHaveProperty('nextCursor');
    expect(result).not.toHaveProperty('page');
    expect(result).not.toHaveProperty('totalPages');
  });
});
```

### Frontend Integration Tests

```typescript
describe('PostsService - getReplies', () => {
  it('should fetch full reply thread with cursor pagination', (done) => {
    service.getReplies('post-id').subscribe(response => {
      expect(response.replies).toBeDefined();
      expect(response.nextCursor).toBeDefined();
      expect(response.hasMore).toBeDefined();
      done();
    });
  });
});
```

### E2E Tests

```typescript
describe('Replies Flow (Aggregated)', () => {
  it('should show replies preview in feed without additional calls', async () => {
    const requests = [];
    page.on('response', req => requests.push(req.url()));
    
    await page.goto('/home');
    await page.waitForSelector('[data-test="post-card"]');
    
    // Should only be /posts call, no /replies calls yet
    const replyRequests = requests.filter(u => u.includes('/replies'));
    expect(replyRequests).toHaveLength(0);
    
    // Replies should be visible in feed preview
    const repliesPreview = await page.locator('[data-test="replies-preview"]');
    expect(await repliesPreview.count()).toBeGreaterThan(0);
  });

  it('should load full reply thread on demand', async () => {
    await page.goto('/home');
    await page.click('[data-test="show-all-replies"]');
    
    const replies = await page.locator('[data-test="reply-item"]');
    expect(await replies.count()).toBeGreaterThan(3);
  });
});
```

---

## 📝 Checklist

### Backend
- [ ] Add indexes to `Reply` table (migration)
- [ ] Update `findAll()` to include top 3 replies
- [ ] Update `getReplies()` with cursor pagination
- [ ] Update DTOs with new structure
- [ ] Unit tests passing
- [ ] Integration tests passing

### Frontend
- [ ] Update `posts.service.ts` - cursor pagination
- [ ] Update DTOs/interfaces
- [ ] Component rendering of aggregated replies
- [ ] Infinite scroll for full reply thread
- [ ] Unit tests passing

### E2E & QA
- [ ] Verify replies show in feed preview
- [ ] Test "show all replies" flow
- [ ] Test nested reply rendering
- [ ] Test cursor pagination (next page works)
- [ ] Verify no N+1 queries

---

## ✨ Critérios de Aceitação

- [ ] **AC1:** Feed includes top 3 replies for each post
- [ ] **AC2:** Nested replies (2 levels) are included in feed
- [ ] **AC3:** "Show all replies" uses cursor pagination (not page/limit)
- [ ] **AC4:** Full reply thread loads without separate N+1 queries
- [ ] **AC5:** Infinite scroll works for reply threads
- [ ] **AC6:** No breaking changes to existing reply functionality

---

## 🔄 Migration Strategy

1. **Deploy backend** with new schema + indexes first
2. **Gradual frontend rollout** - feature flag to enable aggregated replies
3. **Monitor metrics** - API calls, query times, error rates
4. **Remove feature flag** after 24h validation
5. **Optimize further** - add caching if needed

---

## 📚 Referências

- **ARCHITECTURE_REVIEW.md** - Section "ISSUE 2"
- **Prisma nested includes**: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#nested-writes
- **Cursor pagination**: https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination
