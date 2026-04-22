# ISSUE #3: Poor Reply State Management

**Status:** HIGH (P1)  
**Impacto:** Optimistic updates, eliminates refetches  
**Esforço:** 3-4 dias  
**Dependência:** Recomendado: ISSUE #1 & #2 primeiro

---

## 📋 Problema Atual

### Symptoma
1. **Manual state updates**: After reply creation, calls `getReplies` to refetch ALL replies
2. **Inconsistent patterns**: Sometimes refetch, sometimes manual update
3. **No optimistic updates**: UI waits for server response before updating
4. **Manual counts desync**: Manual increment `post._count.replies += 1` can desync from server
5. **Mixing reactive/non-reactive**: `replyContent` string, `editingReply` signal

### Current Broken Flow
```typescript
// post-edit.service.ts line 255
this.postsService.createReply(postId, content).subscribe({
  next: (reply) => {
    // ❌ Refetch ALL replies (wasteful!)
    this.postsService.getReplies(postId).subscribe({
      next: (data) => {
        postRepliesSignal.set(data.replies || []);
      }
    });
    // ❌ Manual count increment (can desync!)
    post._count.replies += 1;
  }
});
```

---

## ✅ Solução

### Unified State Management with RxJS

#### Backend Service Caching

**File:** `backend/src/posts/posts.service.ts`

```typescript
@Injectable()
export class PostsService {
  // Cache posts by ID
  private postsCache = new Map<string, BehaviorSubject<Post>>();
  
  // Get or create cached observable for a post
  getPost(postId: string): Observable<Post> {
    if (!this.postsCache.has(postId)) {
      this.postsCache.set(postId, new BehaviorSubject<Post>(null!));
      this.http.get<Post>(`${this.apiUrl}/posts/${postId}`)
        .subscribe(post => this.postsCache.get(postId)!.next(post));
    }
    return this.postsCache.get(postId)!.asObservable()
      .pipe(filter(p => !!p));
  }
}
```

#### Frontend Service with Optimistic Updates

**File:** `frontend/src/app/services/posts.service.ts`

```typescript
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PostsService {
  // Cache posts by ID
  private postCache = new Map<string, BehaviorSubject<Post>>();
  private repliesCache = new Map<string, BehaviorSubject<RepliesResponse>>();

  // Get cached post observable
  getPostCache(postId: string): Observable<Post> {
    if (!this.postCache.has(postId)) {
      this.postCache.set(postId, new BehaviorSubject<Post>(null!));
    }
    return this.postCache.get(postId)!.asObservable()
      .pipe(filter(p => !!p));
  }

  // Get cached replies observable
  getRepliesCache(postId: string): Observable<RepliesResponse> {
    if (!this.repliesCache.has(postId)) {
      this.repliesCache.set(postId, new BehaviorSubject<RepliesResponse>(null!));
    }
    return this.repliesCache.get(postId)!.asObservable()
      .pipe(filter(r => !!r));
  }

  // Optimistic like toggle
  likePost(postId: string, currentLikeStatus: boolean): Observable<void> {
    return this.http.post<{ liked: boolean }>(
      `${this.apiUrl}/posts/${postId}/like`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        const post$ = this.postCache.get(postId);
        if (post$) {
          const post = post$.value;
          post.isLiked = !post.isLiked;
          post._count.likes += currentLikeStatus ? -1 : 1;
          post$.next({ ...post });
        }
      }),
      // Rollback on error
      catchError(err => {
        const post$ = this.postCache.get(postId);
        if (post$) {
          const post = post$.value;
          post.isLiked = currentLikeStatus;
          post._count.likes += currentLikeStatus ? 1 : -1;
          post$.next({ ...post });
        }
        return throwError(() => err);
      })
    );
  }

  // Create reply with optimistic update
  createReply(postId: string, content: string, parentId?: string): Observable<Reply> {
    return this.http.post<Reply>(
      `${this.apiUrl}/posts/${postId}/reply`,
      { content, parentId },
      { withCredentials: true }
    ).pipe(
      tap((reply) => {
        // Update post count optimistically
        const post$ = this.postCache.get(postId);
        if (post$) {
          const post = post$.value;
          post._count.replies += 1;
          post$.next({ ...post });
        }

        // Add reply to cache optimistically
        const replies$ = this.repliesCache.get(postId);
        if (replies$ && !parentId) {
          const current = replies$.value;
          replies$.next({
            ...current,
            replies: [reply, ...current.replies],
          });
        }
      }),
      // Rollback on error
      catchError(err => {
        const post$ = this.postCache.get(postId);
        if (post$) {
          const post = post$.value;
          post._count.replies = Math.max(0, post._count.replies - 1);
          post$.next({ ...post });
        }
        return throwError(() => err);
      })
    );
  }

  // Delete reply with optimistic update
  deleteReply(postId: string, replyId: string): Observable<void> {
    return this.http.delete(
      `${this.apiUrl}/posts/${postId}/reply/${replyId}`,
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // Update count
        const post$ = this.postCache.get(postId);
        if (post$) {
          const post = post$.value;
          post._count.replies = Math.max(0, post._count.replies - 1);
          post$.next({ ...post });
        }

        // Remove from replies cache
        const replies$ = this.repliesCache.get(postId);
        if (replies$) {
          const current = replies$.value;
          replies$.next({
            ...current,
            replies: current.replies.filter(r => 
              r.id !== replyId && !r.children?.some(c => c.id === replyId)
            ),
          });
        }
      }),
      catchError(err => {
        const post$ = this.postCache.get(postId);
        if (post$) {
          const post = post$.value;
          post._count.replies += 1;
          post$.next({ ...post });
        }
        return throwError(() => err);
      })
    );
  }

  // Invalidate cache when needed
  invalidateCache(pattern?: string) {
    if (pattern) {
      Array.from(this.postCache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.postCache.delete(key));
    } else {
      this.postCache.clear();
      this.repliesCache.clear();
    }
  }
}
```

#### Simplified Component Logic

**File:** `frontend/src/app/components/post-edit/post-edit.component.ts`

```typescript
export class PostEditComponent {
  // UI state only - no data caching here
  replyContent = signal('');
  editingReply = signal<string | null>(null);
  isSubmitting = signal(false);

  constructor(private postsService: PostsService) {}

  createReply(postId: string) {
    const content = this.replyContent().trim();
    if (!content) return;

    this.isSubmitting.set(true);
    
    this.postsService.createReply(postId, content).subscribe({
      next: () => {
        this.replyContent.set('');
        this.isSubmitting.set(false);
        // ✅ NO refetch needed - cache is updated optimistically
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Failed to create reply', err);
      }
    });
  }

  deleteReply(postId: string, replyId: string) {
    if (!confirm('Delete this reply?')) return;

    this.postsService.deleteReply(postId, replyId).subscribe({
      error: (err) => console.error('Failed to delete', err)
      // ✅ Cache automatically updated (optimistic)
    });
  }
}
```

---

## 🧪 Testes

### Service Unit Tests

```typescript
describe('PostsService - State Management', () => {
  it('should update post count optimistically on reply creation', (done) => {
    const postId = 'post-123';
    const post: Post = { id: postId, _count: { replies: 5 } };
    service['postCache'].set(postId, new BehaviorSubject(post));

    service.createReply(postId, 'Test reply').subscribe(() => {
      service.getPostCache(postId).subscribe(updatedPost => {
        // Should be optimistically incremented
        expect(updatedPost._count.replies).toBe(6);
        done();
      });
    });
  });

  it('should rollback count on reply creation error', (done) => {
    // Mock error response
    httpMock.post().and.returnValue(
      throwError(() => new Error('Failed'))
    );

    const post: Post = { id: 'post-123', _count: { replies: 5 } };
    service['postCache'].set('post-123', new BehaviorSubject(post));

    service.createReply('post-123', 'Test').subscribe({
      error: () => {
        service.getPostCache('post-123').subscribe(rollbackPost => {
          expect(rollbackPost._count.replies).toBe(5);
          done();
        });
      }
    });
  });

  it('should not require refetch after reply creation', (done) => {
    service.createReply('post-123', 'Test reply').subscribe(() => {
      // No need to call getReplies again
      // Cache should be automatically updated
      expect(httpMock.match(req => req.url.includes('/replies'))).toEqual([]);
      done();
    });
  });
});
```

### Component Integration Tests

```typescript
describe('PostEditComponent - Reply Creation', () => {
  it('should submit reply and clear input', fakeAsync(() => {
    component.replyContent.set('Test reply');
    component.createReply('post-123');
    
    tick();
    
    expect(component.replyContent()).toBe('');
    expect(component.isSubmitting()).toBe(false);
  }));

  it('should handle reply creation error gracefully', fakeAsync(() => {
    httpMock.post().and.returnValue(throwError(() => new Error()));
    
    component.createReply('post-123');
    tick();
    
    expect(component.isSubmitting()).toBe(false);
    expect(component.replyContent()).toBe(''); // Not cleared on error
  }));
});
```

---

## 📝 Checklist

### Service Layer
- [ ] Implement `BehaviorSubject` caching for posts
- [ ] Implement `BehaviorSubject` caching for replies
- [ ] Add `getPostCache()` and `getRepliesCache()` methods
- [ ] Implement optimistic updates for like/reply/delete
- [ ] Add error rollback logic
- [ ] Add cache invalidation method
- [ ] Unit tests passing

### Component Layer
- [ ] Update all components to use cache-based observables
- [ ] Remove manual refetch calls
- [ ] Remove manual count updates
- [ ] Integration tests passing
- [ ] Component tests passing

### E2E & QA
- [ ] Verify optimistic like toggle
- [ ] Verify reply appears immediately before server confirms
- [ ] Verify rollback on error
- [ ] Verify no refetch after actions
- [ ] Check for state consistency

---

## ✨ Critérios de Aceitação

- [ ] **AC1:** Like toggle is optimistic (instant UI update)
- [ ] **AC2:** Reply creation doesn't trigger refetch
- [ ] **AC3:** Error rollback restores previous state
- [ ] **AC4:** No manual count increments needed
- [ ] **AC5:** Reply deletion optimistically removes from list
- [ ] **AC6:** Cache invalidates on logout/navigation

---

## 📚 Referências

- **ARCHITECTURE_REVIEW.md** - Section "ISSUE 3"
- **RxJS BehaviorSubject**: https://rxjs.dev/api/index/class/BehaviorSubject
- **RxJS tap operator**: https://rxjs.dev/api/operators/tap
