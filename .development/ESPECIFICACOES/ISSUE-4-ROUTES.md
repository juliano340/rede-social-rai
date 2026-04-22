# ISSUE #4: Controller Routes Mismatch API Calls

**Status:** CRITICAL (P0)  
**Impacto:** Unify pagination strategy, remove redundant endpoints  
**Esforço:** 1-2 dias  
**Dependência:** Pré-requisito: ISSUE #1 & #2

---

## 📋 Problema Atual

### Symptoma
1. **Mixed pagination**: Feed uses cursor (`?cursor=xxx&limit=20`), replies use page (`?page=1&limit=20`)
2. **Redundant endpoint**: `GET /posts/:id/liked` should be included in post response
3. **Inconsistent API contract**: Some endpoints include counts, others don't

### Current Routes
```
✓ GET /posts?cursor=xxx&limit=20       → Cursor pagination (correct)
✗ GET /posts/:id/likes                 → Separate like check (wrong)
✗ GET /posts/:id/replies?page=1&limit=20 → Page pagination (wrong)
```

### Why It's Wrong
- **Page-based pagination breaks** when posts are added/deleted
- **Like checks should be in post data**, not separate endpoint
- **Inconsistency** confuses frontend developers

---

## ✅ Solução

### Backend Changes

**File:** `backend/src/posts/posts.controller.ts`

```typescript
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  // GET /posts?cursor=xxx&limit=20
  @Get()
  @Public()
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId;  // Authenticated user
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    return this.postsService.findAll(cursor, parsedLimit, userId);
  }

  // GET /posts/:id
  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  // ❌ DELETE THIS - Use isLiked from post response instead
  // @Get(':id/liked')

  // GET /posts/:id/replies?cursor=xxx&limit=20
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

  // POST /posts/:id/reply
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  async createReply(
    @Param('id') postId: string,
    @Body() body: { content: string; parentId?: string },
    @Request() req: any,
  ) {
    return this.postsService.createReply(postId, req.user.userId, body.content, body.parentId);
  }

  // ✅ Keep other endpoints (create, update, delete, like toggle)
}
```

### Frontend Changes

**File:** `frontend/src/app/services/posts.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PostsService {
  constructor(private http: HttpClient) {}

  // ✅ KEEP: Cursor-based pagination
  getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .setIf(!!cursor, 'cursor', cursor!);

    return this.http.get<PostsResponse>(
      `${this.apiUrl}/posts`,
      { params, withCredentials: true }
    );
  }

  // ✅ UPDATE: Change to cursor pagination (from page-based)
  getReplies(postId: string, cursor?: string, limit = 20): Observable<RepliesResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .setIf(!!cursor, 'cursor', cursor!);

    return this.http.get<RepliesResponse>(
      `${this.apiUrl}/posts/${postId}/replies`,
      { params, withCredentials: true }
    );
  }

  // ❌ DELETE: No longer needed (isLiked comes from post)
  // isLiked(postId: string): Observable<boolean> { ... }

  // ✅ KEEP: Post operations
  createPost(content: string, mediaUrl?: string): Observable<Post> {
    return this.http.post<Post>(
      `${this.apiUrl}/posts`,
      { content, mediaUrl },
      { withCredentials: true }
    );
  }

  // Toggle like (endpoint stays, but like status comes from post)
  toggleLike(postId: string): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(
      `${this.apiUrl}/posts/${postId}/like`,
      {},
      { withCredentials: true }
    );
  }
}
```

---

## 🧪 Testes

### Backend Tests

```typescript
describe('PostsController Routes', () => {
  it('should use cursor pagination for posts', async () => {
    const result = await controller.findAll('cursor-value', '20');
    
    expect(result).toHaveProperty('nextCursor');
    expect(result).not.toHaveProperty('page');
    expect(result).not.toHaveProperty('totalPages');
  });

  it('should use cursor pagination for replies', async () => {
    const result = await controller.getReplies('post-id', 'cursor-value', '20');
    
    expect(result).toHaveProperty('nextCursor');
    expect(result).not.toHaveProperty('page');
  });

  it('should NOT have GET /:id/liked endpoint', async () => {
    const result = await controller.findOne('post-id');
    
    // Like status should come from post, not separate call
    expect(result).toHaveProperty('isLiked');
    expect(typeof result.isLiked).toBe('boolean');
  });
});
```

### Frontend Tests

```typescript
describe('PostsService - Route Consistency', () => {
  it('should use cursor pagination for all list endpoints', (done) => {
    // Both getPosts and getReplies should use cursor
    service.getPosts('cursor', 20).subscribe(response => {
      expect(response).toHaveProperty('nextCursor');
    });

    service.getReplies('post-id', 'cursor', 20).subscribe(response => {
      expect(response).toHaveProperty('nextCursor');
      done();
    });
  });

  it('should not call isLiked endpoint', (done) => {
    const requests: string[] = [];
    httpMock.onRequest = (req) => requests.push(req.url);

    service.getPosts().subscribe(() => {
      const hasLikedCall = requests.some(url => url.includes('/liked'));
      expect(hasLikedCall).toBe(false);
      done();
    });
  });
});
```

### E2E Tests

```typescript
describe('API Routes (Network Tab)', () => {
  it('should load feed with single /posts call (no /liked calls)', async () => {
    const requests: string[] = [];
    page.on('response', res => requests.push(res.url()));

    await page.goto('/home');
    await page.waitForSelector('[data-test="post-card"]');

    const postsRequests = requests.filter(u => u.includes('/posts'));
    const likedRequests = requests.filter(u => u.includes('/liked'));

    expect(postsRequests.length).toBeGreaterThan(0);
    expect(likedRequests.length).toBe(0);  // None!
  });
});
```

---

## 📝 Checklist

### Backend
- [ ] Remove `GET /posts/:id/liked` endpoint
- [ ] Update `getReplies` to use cursor pagination
- [ ] Update controller to pass userId to service
- [ ] Update error handling (400 for invalid cursor)
- [ ] Add tests for both pagination styles
- [ ] API docs updated

### Frontend
- [ ] Remove `isLiked()` service method
- [ ] Update `getReplies()` to use cursor params
- [ ] Update all components calling `getReplies`
- [ ] Remove any `postLikes` signal logic if simplifiable
- [ ] Tests passing

### E2E & QA
- [ ] Inspect Network tab - no /liked calls
- [ ] Cursor pagination works (next page)
- [ ] Invalid cursor returns 400
- [ ] Limit is capped at 50
- [ ] Anonymous users can fetch posts

---

## ✨ Critérios de Aceitação

- [ ] **AC1:** Both endpoints use cursor pagination
- [ ] **AC2:** No `GET /posts/:id/liked` endpoint exists
- [ ] **AC3:** Post response includes `isLiked: boolean`
- [ ] **AC4:** Invalid cursor returns 400 error
- [ ] **AC5:** Limit parameter capped at 50 max
- [ ] **AC6:** No breaking changes to existing routes

---

## 📚 Referências

- **ARCHITECTURE_REVIEW.md** - Section "ISSUE 4"
- **Cursor pagination best practices**: https://cxl.com/blog/pagination/
