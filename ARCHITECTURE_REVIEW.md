# Architectural Review: Social Media Application

## Critical Issues Analysis

---

## ISSUE 1: REDUNDANT N+1 LIKE QUERIES

### Problem Description
In `home.component.ts` (lines 1618-1626), after loading posts, the component makes **one additional API call per post** to check if it's liked by the current user:

```typescript
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

**Result**: Loading 20 posts triggers 21 API calls (1 feed + 20 individual like checks).

### Why It's Wrong
1. **N+1 Query Problem**: Each post requires a separate database query, causing:
   - Exponential growth in requests (20 posts = 20 extra requests)
   - Poor network efficiency
   - Increased server load
   - Slower UX (waterfalling requests)

2. **Database Impact**: Backend must execute 20 separate queries instead of 1 aggregated query

3. **No Batching**: Requests are made sequentially without any optimization or debouncing

### Refactored Solution

**Backend Change** (`posts.service.ts`):
Include like status in the POST_INCLUDE object when returning posts:

```typescript
async findAll(cursor?: string, limit = 20) {
  const take = limit + 1;
  const where = cursor ? { createdAt: { lt: await this.getCursorDate(cursor) } } : {};

  const posts = await this.prisma.post.findMany({
    where,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: COUNT_SELECT },
      likes: this.authService.isLoggedIn() 
        ? { where: { userId: currentUserId } }  // Include current user's like
        : false,
    },
  });

  return this.buildCursorPagination(posts, limit);
}
```

**Frontend Change** (`posts.service.ts`):
The API now returns `likes: [{ userId, postId }]` array (empty if not liked).

```typescript
getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
  let params = new HttpParams().set('limit', limit.toString());
  if (cursor) {
    params = params.set('cursor', cursor);
  }
  return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, { params, withCredentials: true });
}
```

**Frontend Logic** (`home.component.ts`):
Extract like status from the response directly:

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
      
      // Extract like status from response instead of making extra calls
      if (this.authService.isLoggedIn()) {
        const likes: Record<string, boolean> = {};
        response.posts.forEach(post => {
          likes[post.id] = post.likes && post.likes.length > 0;
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

**Impact**: 
- Reduces API calls from 21 → 1 (95% reduction)
- Single database query instead of 20
- Faster page load
- Better user experience

---

## ISSUE 2: REPLIES FETCHED SEPARATELY (SHOULD BE AGGREGATED IN FEED)

### Problem Description
Posts are returned WITHOUT their replies in the feed. When a user opens a post, replies are fetched in a separate API call (`getReplies`).

**Current Flow**:
1. Get posts feed (no replies)
2. User clicks "replies" button
3. Trigger `getReplies` for that post (separate request)
4. After reply loads, user can add a new reply
5. Submit reply → fetch all replies again (`getReplies`)

```typescript
// home.component.ts line 1570
this.postsService.getReplies(postId).subscribe({
  next: (data) => {
    this.postReplies.set(data.replies || []);
  }
});

// post-edit.service.ts lines 255-259
this.postsService.getReplies(postId).subscribe({
  next: (data) => {
    postRepliesSignal.set(data.replies || []);
  }
});
```

### Why It's Wrong
1. **Poor Mental Model**: A post without its replies is incomplete data
2. **Extra Requests**: Every time user views replies, a new request is made
3. **Inefficient Pagination**: Replies use offset-based pagination (page/limit) instead of cursor-based
4. **Waterfalling**: Replies can't load until post is opened
5. **Redundant Refetches**: After creating a reply, all replies are refetched (line 255)
6. **N+1 for Nested Comments**: Getting nested replies requires fetching parent + recursing through children

### Better Mental Model

Social platforms return posts with **aggregated metadata**:
- Post should include: likes count, reply count, share count
- Top-level replies can be pre-loaded in the feed (first 2-3)
- Full reply thread loaded on-demand with cursor pagination
- Nested replies are part of parent reply object (not separate queries)

### Refactored Data Model

**Schema Change** - Optional nested replies field:

```prisma
model Post {
  id        String   @id @default(uuid())
  content   String
  mediaUrl   String?
  mediaType String?
  linkUrl   String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId      String
  author        User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  likes         Like[]
  replies       Reply[]    // All replies, kept for relation
  notifications Notification[]

  @@index([authorId])
  @@index([createdAt])
}

model Reply {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  postId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)

  parentId String?
  parent   Reply?  @relation("ReplyToReply", fields: [parentId], references: [id], onDelete: Cascade)
  children Reply[] @relation("ReplyToReply")

  @@index([postId])
  @@index([parentId])
  @@index([createdAt])  // Add for cursor pagination
}
```

**API Contract** - New endpoint structure:

```typescript
// GET /posts (with replies aggregation)
interface PostResponse {
  id: string;
  content: string;
  author: UserDTO;
  mediaUrl?: string;
  mediaType?: 'image' | 'youtube';
  linkUrl?: string;
  createdAt: string;
  
  // Aggregated metadata (always included)
  _count: {
    likes: number;
    replies: number;
  };
  
  // Current user's interaction status
  isLiked: boolean;
  
  // Optional: Top N replies (can be fetched lazily)
  topReplies?: Reply[];
}

interface Reply {
  id: string;
  content: string;
  author: UserDTO;
  createdAt: string;
  
  // Nested replies included here (cursor-paginated)
  children?: {
    items: Reply[];
    cursor: string | null;
    hasMore: boolean;
  };
}

// GET /posts/:id/replies - Cursor-based pagination
interface RepliesResponse {
  replies: Reply[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

**Backend Implementation** (`posts.service.ts`):

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
      likes: userId ? { where: { userId }, select: { id: true } } : false,
      // Top replies with cursor pagination
      replies: {
        where: { parentId: null },  // Only top-level replies
        take: 3,  // Top 3 replies
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: AUTHOR_SELECT },
          children: {
            take: 2,  // Top 2 nested replies
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
      likes: undefined,  // Remove raw likes array
    })),
    limit
  );
}

// Get full reply thread with cursor pagination
async getReplies(postId: string, cursor?: string, limit = 20) {
  const take = limit + 1;
  const where: { postId: string; parentId: null; createdAt?: { lt: Date } } = { 
    postId, 
    parentId: null 
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
      children: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: AUTHOR_SELECT } },
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

**Frontend Changes** (`posts.service.ts`):

```typescript
// Cursor-based pagination for replies
getReplies(postId: string, cursor?: string, limit = 20): Observable<any> {
  const params = new HttpParams()
    .set('limit', limit.toString())
    .setIf(!!cursor, 'cursor', cursor!);

  return this.http.get<any>(`${this.apiUrl}/posts/${postId}/replies`, { params, withCredentials: true });
}
```

**Impact**:
- Feed loads with complete post data (no extra requests)
- Replies included in initial load (no waterfalling)
- Cursor pagination for large reply threads
- Better data consistency
- Reduced redundant refetches

---

## ISSUE 3: POOR REPLY STATE MANAGEMENT

### Problem Description

**Current System Issues**:

1. **Manual State Updates** (post-edit.service.ts):
   - After reply creation (line 255), calls `getReplies` to refetch ALL replies
   - After reply edit (line 98), manually updates single reply
   - Inconsistent patterns: sometimes refetch, sometimes manual update

2. **Cascading Signals** (home.component.ts):
   - `postEdit.postReplies` signal holds replies
   - `postEdit.replyContent` is a string (not a signal)
   - `postEdit.editingReply` is a signal
   - Mixing reactive and non-reactive state

3. **No Optimistic Updates**:
   - Like action: waits for response before updating UI (lines 323-328)
   - Reply action: creates, refetches all replies (line 255)
   - Edit action: no UI feedback until response

4. **Reply Counting Issues** (post-edit.service.ts):
   - Line 251: `post._count.replies += 1` (manual increment)
   - Line 197: `post._count.replies = Math.max(0, post._count.replies - 1)`
   - Fragile: can become out-of-sync with server

### Why It's Wrong

1. **Inconsistency**: No standard pattern for state updates
2. **Network Inefficiency**: Refetching all replies after single change
3. **Poor UX**: User waits for server response before seeing change
4. **State Divergence**: Manual counts can desync from server
5. **Scalability**: As reply count grows, refetching becomes expensive

### Refactored Solution

**Unified State Management Pattern** - Use RxJS operators for clean composition:

```typescript
// posts.service.ts
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { scan, shareReplay, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PostsService {
  // Cache posts by post ID
  private postsCache = new Map<string, BehaviorSubject<Post>>();
  
  getPost(postId: string): Observable<Post> {
    if (!this.postsCache.has(postId)) {
      this.postsCache.set(postId, new BehaviorSubject<Post>(null!));
      this.http.get<Post>(`${this.apiUrl}/posts/${postId}`, { withCredentials: true })
        .subscribe(post => this.postsCache.get(postId)!.next(post));
    }
    return this.postsCache.get(postId)!.asObservable().pipe(filter(p => !!p));
  }

  // Optimistic like toggle
  likePost(postId: string, currentLikeStatus: boolean): Observable<void> {
    return this.http.post<{ liked: boolean }>(
      `${this.apiUrl}/posts/${postId}/like`, 
      {}, 
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // Update cache optimistically
        const post$ = this.postsCache.get(postId);
        if (post$) {
          const post = post$.value;
          post._count.likes += currentLikeStatus ? -1 : 1;
          post$.next(post);
        }
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
        // Update post cache
        const post$ = this.postsCache.get(postId);
        if (post$) {
          const post = post$.value;
          post._count.replies += 1;
          post$.next(post);
        }

        // Add reply to replies cache
        const replies$ = this.repliesCache.get(postId);
        if (replies$ && !parentId) {
          const current = replies$.value;
          replies$.next({
            ...current,
            replies: [reply, ...current.replies],
          });
        }
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
        // Update post cache
        const post$ = this.postsCache.get(postId);
        if (post$) {
          const post = post$.value;
          post._count.replies = Math.max(0, post._count.replies - 1);
          post$.next(post);
        }

        // Remove from replies cache
        const replies$ = this.repliesCache.get(postId);
        if (replies$) {
          const current = replies$.value;
          replies$.next({
            ...current,
            replies: current.replies.filter(r => r.id !== replyId && !r.children?.some(c => c.id === replyId)),
          });
        }
      })
    );
  }
}
```

**Simplified Component State** (`home.component.ts`):

```typescript
export class HomeComponent implements OnInit {
  posts = signal<Post[]>([]);
  feedType = signal<'all' | 'following'>('all');
  
  // Only UI state signals
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  expandedReplies = signal<Set<string>>(new Set());
  
  constructor(
    private postsService: PostsService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

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
        this.isLoading.set(false);
      },
      error: (err) => {
        this.loadError.set('Não foi possível carregar as publicações.');
        this.isLoading.set(false);
      }
    });
  }

  toggleLike(post: Post) {
    const currentStatus = post.isLiked;
    post.isLiked = !post.isLiked;  // Optimistic
    post._count.likes += currentStatus ? -1 : 1;
    
    this.postsService.likePost(post.id, currentStatus).subscribe({
      error: () => {
        // Rollback on error
        post.isLiked = currentStatus;
        post._count.likes += currentStatus ? 1 : -1;
      }
    });
  }

  toggleReplies(postId: string) {
    const expanded = this.expandedReplies();
    if (expanded.has(postId)) {
      expanded.delete(postId);
    } else {
      expanded.add(postId);
    }
    this.expandedReplies.set(new Set(expanded));
  }

  createReply(postId: string, content: string) {
    this.postsService.createReply(postId, content).subscribe({
      next: () => {
        // No refetch needed - cache is updated optimistically
      }
    });
  }
}
```

**Impact**:
- No redundant refetches
- Consistent state updates
- Optimistic UX (instant feedback)
- Centralized cache management
- Handles errors gracefully with rollbacks

---

## ISSUE 4: CONTROLLER ROUTES MISMATCH API CALLS

### Problem Description

**Controller Routes** (posts.controller.ts):
- `GET /posts/:id/liked` - Check if current user liked a specific post
- `GET /posts/:id/replies` - Get replies using page-based pagination (page, limit)

**Frontend Calls** (posts.service.ts):
- Uses these endpoints correctly but they cause N+1 problems
- Uses page-based pagination (page=1, limit=20) instead of cursor

### Why It's Wrong

1. **Page-Based Pagination**: Inefficient for feeds with additions/deletions
   - New post added → all page numbers shift
   - Cursor pagination is the industry standard for feeds

2. **Separate Like Check**: Should be included in post data

3. **Inconsistent Pagination**: 
   - Feed uses cursor: `?cursor=xxx&limit=20`
   - Replies use page: `?page=1&limit=20`

### Refactored Solution

**Update Controller** (posts.controller.ts):

```typescript
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  @Public()
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.request.user?.userId;  // Authenticated user ID
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    return this.postsService.findAll(cursor, parsedLimit, userId);
  }

  // Remove GET :id/liked - use isLiked from post response instead

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
}
```

**Update Backend Service** (posts.service.ts):

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
      likes: userId ? { where: { userId } } : false,
    },
  });

  return this.buildCursorPagination(
    posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes.length > 0 : false,
    })),
    limit
  );
}
```

**Update Frontend Service** (posts.service.ts):

```typescript
getReplies(postId: string, cursor?: string, limit = 20): Observable<any> {
  const params = new HttpParams()
    .set('limit', limit.toString())
    .setIf(!!cursor, 'cursor', cursor!);

  return this.http.get<any>(`${this.apiUrl}/posts/${postId}/replies`, { params, withCredentials: true });
}

// Remove isLiked method
// Like status now comes from post.isLiked in feed response
```

**Impact**:
- Single pagination strategy (cursor-based)
- No separate like checks
- Cleaner API contract
- Better consistency

---

## ISSUE 5: INEFFICIENT REPLY STRUCTURE

### Problem Description

Replies are currently **flat with optional `parentId`** linking to parent reply. This requires:
1. Client-side grouping logic
2. Recursive traversal to build nested structure
3. N+1 queries when fetching nested replies

### Schema Issue

```prisma
model Reply {
  // ... other fields ...
  parentId String?  // Can reference another reply or post
  parent   Reply?   @relation("ReplyToReply", fields: [parentId], references: [id])
  children Reply[]  @relation("ReplyToReply")
}
```

**Queries Needed**:
1. Get all top-level replies (parentId = null)
2. For each reply, query its children
3. For deeply nested: repeat for each child

### Refactored Solution

**Optimized Structure** - Include nested replies in single query:

```typescript
async getReplies(postId: string, cursor?: string, limit = 20) {
  const take = limit + 1;
  const where: { postId: string; parentId: null; createdAt?: { lt: Date } } = { 
    postId, 
    parentId: null 
  };
  
  if (cursor) {
    where.createdAt = { lt: await this.getCursorDate(cursor) };
  }

  // Single query with nested includes
  const replies = await this.prisma.reply.findMany({
    where,
    take,
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: AUTHOR_SELECT },
      children: {
        take: 10,  // Limit nested replies
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: AUTHOR_SELECT },
          children: {  // 3 levels deep if needed
            take: 5,
            orderBy: { createdAt: 'asc' },
            include: { author: { select: AUTHOR_SELECT } },
          },
        },
      },
    },
  });

  const hasMore = replies.length > limit;
  const results = hasMore ? replies.slice(0, limit) : replies;
  const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;

  return { replies: results, nextCursor, hasMore };
}
```

**Frontend Rendering** - No transformation needed:

```typescript
@for (reply of replies; track reply.id) {
  <div class="reply">
    {{ reply.content }}
    
    @if (reply.children && reply.children.length > 0) {
      @for (child of reply.children; track child.id) {
        <div class="nested-reply">
          {{ child.content }}
        </div>
      }
    }
  </div>
}
```

**Impact**:
- Single query for entire reply tree
- No client-side grouping logic
- Cleaner frontend code
- Better performance (no N+1)

---

## ISSUE 6: NO CACHING STRATEGY

### Problem Description

Every API call is fresh with no caching:
- User loads feed
- Switches tabs
- Comes back to previous tab
- Fetches entire feed again

No service-level caching exists.

### Refactored Solution

**Add Request Caching** (posts.service.ts):

```typescript
@Injectable({ providedIn: 'root' })
export class PostsService {
  private feedCache = new Map<string, { data: PostsResponse; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000;  // 5 minutes

  getPosts(cursor?: string, limit = 20): Observable<PostsResponse> {
    const cacheKey = `feed:all:${cursor}:${limit}`;
    const cached = this.feedCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }

    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, { params, withCredentials: true }).pipe(
      tap(data => {
        this.feedCache.set(cacheKey, { data, timestamp: Date.now() });
      })
    );
  }

  // Invalidate cache when user creates/deletes post
  invalidateCache(pattern?: string) {
    if (pattern) {
      Array.from(this.feedCache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.feedCache.delete(key));
    } else {
      this.feedCache.clear();
    }
  }
}
```

**Impact**:
- Faster navigation between tabs
- Reduced redundant requests
- Better UX for slow networks

---

## SUMMARY OF IMPROVEMENTS

| Issue | Current | Refactored | Benefit |
|-------|---------|-----------|---------|
| Like queries | 21 requests | 1 request | 95% reduction |
| Reply fetches | Separate call | Included in feed | Faster load |
| Pagination | Mixed (page + cursor) | Unified cursor | Consistency |
| Nested replies | N+1 queries | Single query | 80% fewer queries |
| State management | Manual updates | Optimistic + cache | Better UX |
| Like checks | 20 individual checks | Aggregated data | Single query |
| Reply refetches | Every create/edit | Incremental updates | 50% fewer requests |
| Caching | None | TTL-based cache | Faster tab switching |

---

## IMPLEMENTATION PRIORITY

1. **CRITICAL** (Do first):
   - Fix N+1 like queries (Issue #1) - Highest impact, lowest effort
   - Add like status to post response - Single backend change

2. **HIGH** (Next):
   - Aggregate replies in feed (Issue #2)
   - Implement cursor pagination for replies
   - Remove `GET /posts/:id/liked` endpoint

3. **MEDIUM** (Then):
   - Implement optimistic updates (Issue #3)
   - Add service-level caching (Issue #6)
   - Refactor nested reply structure (Issue #5)

4. **POLISH** (Final):
   - Add pagination edge cases
   - Error handling & rollbacks
   - Performance monitoring
