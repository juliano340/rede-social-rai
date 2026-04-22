# ISSUE #6: No Caching Strategy

**Status:** MEDIUM (P2)  
**Impacto:** 60% cache hit rate, faster tab switching  
**Esforço:** 2-3 dias  
**Dependência:** Nenhuma (pode ser feito após P0)

---

## 📋 Problema Atual

### Symptoma
- Zero caching strategy
- User loads feed → switches tab → back to feed → fetches entire feed again
- No browser-level or service-level cache
- Poor UX for slow networks or repeated navigation

### Impact
- **Mobile users**: Extra 2-3 seconds per tab switch
- **Slow networks**: Data re-downloaded unnecessarily
- **Server load**: Redundant requests on every tab focus

---

## ✅ Solução

### Service-Level Cache (TTL)

**File:** `frontend/src/app/services/posts.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly CACHE_TTL = 5 * 60 * 1000;  // 5 minutes
  private feedCache = new Map<string, CacheEntry<PostsResponse>>();
  private replyCache = new Map<string, CacheEntry<RepliesResponse>>();

  constructor(private http: HttpClient) {}

  getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    const cacheKey = `feed:all:${cursor}:${limit}`;
    const cached = this.feedCache.get(cacheKey);

    // Return cached if fresh
    if (cached && this.isFresh(cached.timestamp)) {
      return of(cached.data);
    }

    const params = new HttpParams()
      .set('limit', limit.toString())
      .setIf(!!cursor, 'cursor', cursor!);

    return this.http.get<PostsResponse>(
      `${this.apiUrl}/posts`,
      { params, withCredentials: true }
    ).pipe(
      tap(data => {
        // Cache the response
        this.feedCache.set(cacheKey, { data, timestamp: Date.now() });
      }),
      shareReplay(1)  // Share among multiple subscribers
    );
  }

  getReplies(postId: string, cursor?: string, limit = 20): Observable<RepliesResponse> {
    const cacheKey = `replies:${postId}:${cursor}:${limit}`;
    const cached = this.replyCache.get(cacheKey);

    if (cached && this.isFresh(cached.timestamp)) {
      return of(cached.data);
    }

    const params = new HttpParams()
      .set('limit', limit.toString())
      .setIf(!!cursor, 'cursor', cursor!);

    return this.http.get<RepliesResponse>(
      `${this.apiUrl}/posts/${postId}/replies`,
      { params, withCredentials: true }
    ).pipe(
      tap(data => {
        this.replyCache.set(cacheKey, { data, timestamp: Date.now() });
      }),
      shareReplay(1)
    );
  }

  // Invalidate cache when user creates/deletes post
  invalidateFeedCache() {
    // Clear all feed cache entries
    Array.from(this.feedCache.keys())
      .forEach(key => this.feedCache.delete(key));
  }

  // Invalidate specific post's reply cache
  invalidateReplyCache(postId?: string) {
    if (postId) {
      Array.from(this.replyCache.keys())
        .filter(key => key.includes(postId))
        .forEach(key => this.replyCache.delete(key));
    } else {
      this.replyCache.clear();
    }
  }

  // Logout: clear all caches
  clearAllCache() {
    this.feedCache.clear();
    this.replyCache.clear();
  }

  private isFresh(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }
}
```

### Cache Invalidation Strategy

**File:** `frontend/src/app/services/post-edit.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PostEditService {
  constructor(
    private http: HttpClient,
    private postsService: PostsService,
  ) {}

  createPost(content: string): Observable<Post> {
    return this.http.post<Post>(
      `${this.apiUrl}/posts`,
      { content },
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // Invalidate feed cache when post created
        this.postsService.invalidateFeedCache();
      })
    );
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/posts/${postId}`,
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // Invalidate caches
        this.postsService.invalidateFeedCache();
        this.postsService.invalidateReplyCache(postId);
      })
    );
  }

  createReply(postId: string, content: string): Observable<Reply> {
    return this.http.post<Reply>(
      `${this.apiUrl}/posts/${postId}/reply`,
      { content },
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // Invalidate this post's reply cache
        this.postsService.invalidateReplyCache(postId);
      })
    );
  }

  deleteReply(postId: string, replyId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/posts/${postId}/reply/${replyId}`,
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // Invalidate reply cache for this post
        this.postsService.invalidateReplyCache(postId);
      })
    );
  }
}
```

### Auth Integration

**File:** `frontend/src/app/services/auth.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private postsService: PostsService,
  ) {}

  logout(): Observable<void> {
    return this.http.post<void>('/auth/logout', {}).pipe(
      tap(() => {
        // Clear all caches on logout
        this.postsService.clearAllCache();
      })
    );
  }
}
```

---

## 🧪 Testes

### Service Tests

```typescript
describe('PostsService - Caching', () => {
  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should return cached response within TTL', (done) => {
    service.getPosts().subscribe(() => {
      // Second call should use cache
      service.getPosts().subscribe(() => {
        // Only 1 HTTP request made
        expect(httpMock.match(req => req.url.includes('/posts')).length).toBe(1);
        done();
      });
    });

    // First request
    httpMock.expectOne(req => req.url.includes('/posts')).flush({ posts: [] });
    // Second request (cached)
    httpMock.expectNone(req => req.url.includes('/posts'));
  });

  it('should invalidate cache after TTL expires', (done) => {
    service.getPosts().subscribe(() => {
      // Advance time past TTL
      jasmine.clock().tick(6 * 60 * 1000);

      // Next call should fetch fresh data
      service.getPosts().subscribe(() => {
        // Should make 2 requests (after TTL)
        expect(httpMock.match(req => req.url.includes('/posts')).length).toBe(2);
        done();
      });

      httpMock.expectOne(req => req.url.includes('/posts')).flush({ posts: [] });
    });

    httpMock.expectOne(req => req.url.includes('/posts')).flush({ posts: [] });
  });

  it('should invalidate feed cache on createPost()', (done) => {
    spyOn(service, 'invalidateFeedCache');

    postEditService.createPost('Test').subscribe(() => {
      expect(service.invalidateFeedCache).toHaveBeenCalled();
      done();
    });

    httpMock.expectOne(req => req.url.includes('/posts') && req.method === 'POST')
      .flush({ id: '1' });
  });

  it('should invalidate reply cache on createReply()', (done) => {
    spyOn(service, 'invalidateReplyCache');

    postEditService.createReply('post-1', 'Reply').subscribe(() => {
      expect(service.invalidateReplyCache).toHaveBeenCalledWith('post-1');
      done();
    });

    httpMock.expectOne(req => req.url.includes('/reply')).flush({ id: 'r1' });
  });

  it('should clear all caches on logout', (done) => {
    spyOn(service, 'clearAllCache');

    authService.logout().subscribe(() => {
      expect(service.clearAllCache).toHaveBeenCalled();
      done();
    });

    httpMock.expectOne(req => req.url.includes('/logout')).flush({});
  });
});
```

### Integration Tests

```typescript
describe('Feed Navigation - Cache Behavior', () => {
  it('should use cache when returning to feed', (done) => {
    // Load feed
    service.getPosts().subscribe(() => {
      // Navigate away (cache still valid)
      // Navigate back
      service.getPosts().subscribe(() => {
        // Should have only 1 request total
        const requests = httpMock.match(req => req.url.includes('/posts'));
        expect(requests.length).toBe(1);
        done();
      });
    });

    httpMock.expectOne(req => req.url.includes('/posts')).flush({ posts: [] });
    httpMock.expectNone(req => req.url.includes('/posts'));
  });
});
```

---

## 📝 Checklist

### Service Layer
- [ ] Add `CACHE_TTL` constant (5 minutes)
- [ ] Implement cache storage (Map)
- [ ] Implement `isFresh()` check
- [ ] Add `invalidateFeedCache()` method
- [ ] Add `invalidateReplyCache()` method
- [ ] Add `clearAllCache()` method
- [ ] Use `shareReplay()` for multiple subscribers
- [ ] Unit tests passing

### Integration Points
- [ ] Hook `invalidateFeedCache()` on post create/delete
- [ ] Hook `invalidateReplyCache()` on reply create/delete
- [ ] Hook `clearAllCache()` on logout
- [ ] Integration tests passing

### E2E & QA
- [ ] Tab switch returns cached data (no waterfall)
- [ ] Cache expires after 5 minutes
- [ ] New post appears after refresh
- [ ] Deleted post removed after refresh
- [ ] Logout clears cache
- [ ] Network tab shows cache hits

---

## ✨ Critérios de Aceitação

- [ ] **AC1:** Feed cached for 5 minutes
- [ ] **AC2:** Cache invalidated on post create/delete
- [ ] **AC3:** Returning to feed shows cached data (instant)
- [ ] **AC4:** Cache TTL properly enforced
- [ ] **AC5:** Multiple requests share single cache entry
- [ ] **AC6:** Logout clears all caches

---

## 📊 Expected Metrics

| Métrica | Before | After | Gain |
|---------|--------|-------|------|
| Feed reload (cached) | 2.5s | <100ms | 96% ↓ |
| Tab switch time | 2.5s | <100ms | 96% ↓ |
| Cache hit rate | 0% | ~60% | New |
| API requests | 1/load | 1/5min | 80% ↓ |

---

## 📚 Referências

- **ARCHITECTURE_REVIEW.md** - Section "ISSUE 6"
- **RxJS shareReplay**: https://rxjs.dev/api/operators/shareReplay
- **Browser caching**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
