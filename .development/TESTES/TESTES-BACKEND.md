# Testes Backend - RAI Project

## Estrutura de Testes

```
backend/
├── src/
│   ├── posts/
│   │   ├── posts.service.spec.ts        # Core service logic
│   │   ├── posts.controller.spec.ts     # Routes & HTTP
│   │   └── posts.integration.spec.ts    # E2E scenarios
│   ├── auth/
│   │   ├── jwt.strategy.spec.ts
│   │   └── auth.guard.spec.ts
│   └── replies/
│       ├── replies.service.spec.ts
│       └── replies.controller.spec.ts
```

---

## Unit Tests Checklist

### PostsService

#### Issue #1: N+1 Likes
- [ ] `findAll()` includes `isLiked` for authenticated user
- [ ] `findAll()` returns `isLiked: false` for anonymous user
- [ ] Response does NOT include raw `likes` array
- [ ] Single query to database (not N+1)

#### Issue #2: Replies Aggregation
- [ ] `findAll()` includes top 3 replies
- [ ] Nested replies (level 2-3) included
- [ ] `getReplies()` uses cursor pagination
- [ ] `_count.children` present for each reply

#### Issue #4: Routes
- [ ] `findAll()` accepts `userId` parameter
- [ ] `getReplies()` uses cursor, not page/limit
- [ ] Response has `nextCursor` (not `page`, `totalPages`)

#### Issue #5: Reply Structure
- [ ] `getReplies()` returns nested structure
- [ ] No flattened/grouped transformation needed
- [ ] Deep nesting (3 levels) supported

#### Issue #6: Caching
- [ ] `getReplies()` response is consistent (deterministic)
- [ ] Timestamps are consistent across calls

### RepliesService

- [ ] `createReply()` increments parent reply count
- [ ] `createReply()` increments post count
- [ ] `deleteReply()` decrements counts correctly
- [ ] `deleteReply()` removes from cache

### AuthGuard

- [ ] `JwtAuthGuard` validates JWT token
- [ ] `@Public()` decorator bypasses auth
- [ ] `userId` available in request.user
- [ ] Unauthenticated requests blocked on protected routes

---

## Integration Tests Checklist

### Like Flow
- [ ] Create post
- [ ] User A likes post
- [ ] User B loads feed → sees `isLiked: false`
- [ ] User A loads feed → sees `isLiked: true`
- [ ] Unlike toggles `isLiked: false`
- [ ] Like count updates correctly

### Reply Flow
- [ ] Create post
- [ ] Create reply (top-level)
- [ ] Create nested reply
- [ ] User can see all levels in feed
- [ ] `_count.replies` accurate
- [ ] Delete reply updates count

### Pagination
- [ ] Load feed page 1 (20 posts)
- [ ] Load feed page 2 using `nextCursor`
- [ ] No duplicate posts across pages
- [ ] Cursor invalid returns 400
- [ ] Limit > 50 capped to 50

### Cursor Correctness
- [ ] Adding new post shifts cursor correctly
- [ ] Deleting post maintains cursor pagination
- [ ] Multiple users can paginate independently

---

## Database Tests

### Indexes
- [ ] Index on `Post.createdAt` exists
- [ ] Index on `Reply.createdAt` exists
- [ ] Index on `Reply.postId` exists
- [ ] Index on `Reply.parentId` exists

### Migrations
- [ ] Migration runs without errors
- [ ] Rollback works cleanly
- [ ] No data loss during migration
- [ ] Schema matches Prisma model

---

## Performance Baseline Tests

### Query Count
- [ ] `findAll()` makes 1 query (not 20 for likes)
- [ ] `getReplies()` makes 1 query (not N+1 for nesting)
- [ ] Like toggle: 2 queries max
- [ ] Create reply: 3 queries max

### Query Time
- [ ] `findAll()` completes in < 100ms
- [ ] `getReplies()` completes in < 100ms
- [ ] Like toggle completes in < 50ms

---

## Error Handling

### 404 Responses
- [ ] GET /posts/invalid-id returns 404
- [ ] GET /posts/:id/replies with invalid post returns 404
- [ ] DELETE /posts/:id/reply/invalid-reply returns 404

### 400 Responses
- [ ] Invalid cursor returns 400 with message
- [ ] Missing required fields return 400

### 401/403 Responses
- [ ] Create post without auth returns 401
- [ ] Like/reply without auth returns 401
- [ ] Delete someone else's post returns 403

---

## Test Commands

```bash
# Run all backend tests
npm test

# Run specific suite
npm test -- posts.service.spec.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Coverage Goals

| Category | Target |
|----------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |
