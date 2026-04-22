# ISSUE #5: Inefficient Reply Structure

**Status:** MEDIUM (P2)  
**Impacto:** Single query para nested replies, no client-side grouping  
**Esforço:** 2-3 dias  
**Dependência:** Recomendado: ISSUE #2 primeiro

---

## 📋 Problema Atual

### Symptoma
- Replies are returned flat with optional `parentId`
- Client must group/organize replies to build nested structure
- Recursive traversal needed to find children
- Deep nesting requires N+1 queries

### Current Issue
```typescript
// Returns flat array
[
  { id: '1', content: 'Main', parentId: null },
  { id: '2', content: 'Nested 1', parentId: '1' },
  { id: '3', content: 'Nested 2', parentId: '2' },
]

// Client must transform to:
[
  { 
    id: '1', 
    content: 'Main',
    children: [
      {
        id: '2',
        content: 'Nested 1',
        children: [
          { id: '3', content: 'Nested 2', children: [] }
        ]
      }
    ]
  }
]
```

---

## ✅ Solução

### Backend - Nested Includes

**File:** `backend/src/posts/posts.service.ts`

```typescript
// ISSUE #2 already updated findAll(), ensure nested includes work
async findAll(cursor?: string, limit = 20, userId?: string) {
  const posts = await this.prisma.post.findMany({
    // ... where, orderBy, take ...
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: COUNT_SELECT },
      likes: userId ? { where: { userId }, select: { id: true } } : false,
      replies: {
        where: { parentId: null },  // Only top-level
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { children: true } },
          children: {  // 1st level nesting
            take: 2,
            orderBy: { createdAt: 'desc' },
            include: {
              author: { select: AUTHOR_SELECT },
              _count: { select: { children: true } },
              children: {  // 2nd level nesting
                take: 5,
                orderBy: { createdAt: 'asc' },
                include: { author: { select: AUTHOR_SELECT } },
              },
            },
          },
        },
      },
    },
  });

  return this.buildCursorPagination(posts.map(...), limit);
}

// For full reply thread (when user clicks "show all")
async getReplies(postId: string, cursor?: string, limit = 20) {
  const replies = await this.prisma.reply.findMany({
    where: {
      postId,
      parentId: null,  // Only top-level
      createdAt: cursor ? { lt: new Date(cursor) } : undefined,
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { children: true } },
      children: {  // Nested replies
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { children: true } },
          children: {  // 2nd level
            take: 10,
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

### Frontend - Simple Recursive Rendering

**File:** `frontend/src/app/components/reply/reply-list.component.ts`

```typescript
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-reply-list',
  template: `
    @for (reply of replies; track reply.id) {
      <div class="reply" [attr.data-test]="'reply-item'">
        <app-reply-header [reply]="reply" />
        <p>{{ reply.content }}</p>

        @if (reply.children && reply.children.length > 0) {
          <div class="reply-children">
            <app-reply-list [replies]="reply.children" />
          </div>
        }

        @if (reply._count?.children > reply.children?.length) {
          <button (click)="loadMoreNested(reply)">
            Load {{ reply._count.children - reply.children!.length }} more replies
          </button>
        }
      </div>
    }
  `,
})
export class ReplyListComponent {
  @Input() replies: Reply[] = [];

  loadMoreNested(reply: Reply) {
    // Fetch next level of nested replies if needed
    // (Already includes in initial load, but can be extended)
  }
}
```

---

## 🧪 Testes

### Backend Tests

```typescript
describe('PostsService - Nested Reply Includes', () => {
  it('should return replies with nested structure (3 levels)', async () => {
    const post = await createPost();
    const r1 = await createReply(post.id, 'Level 1');
    const r2 = await createReply(post.id, 'Level 2', r1.id);
    const r3 = await createReply(post.id, 'Level 3', r2.id);

    const result = await service.findAll();

    // Check structure is pre-built
    expect(result.posts[0].replies[0].children).toBeDefined();
    expect(result.posts[0].replies[0].children[0].children).toBeDefined();
    expect(result.posts[0].replies[0].children[0].children[0].id).toBe(r3.id);
  });

  it('should limit nested replies to avoid N+1', async () => {
    const post = await createPost();
    const r1 = await createReply(post.id, 'Main');
    
    // Create 100 level-2 replies
    for (let i = 0; i < 100; i++) {
      await createReply(post.id, `Nested ${i}`, r1.id);
    }

    const result = await service.findAll();

    // Should only include first 2, not all 100
    expect(result.posts[0].replies[0].children.length).toBeLessThanOrEqual(2);
  });

  it('should include _count.children for pagination', async () => {
    const post = await createPost();
    const r1 = await createReply(post.id, 'Main');
    
    for (let i = 0; i < 50; i++) {
      await createReply(post.id, `Nested ${i}`, r1.id);
    }

    const result = await service.findAll();

    expect(result.posts[0].replies[0]._count.children).toBe(50);
    expect(result.posts[0].replies[0].children.length).toBeLessThan(50);
  });
});
```

### Frontend Tests

```typescript
describe('ReplyListComponent - Recursive Rendering', () => {
  it('should render nested replies recursively', () => {
    const replies = [
      {
        id: '1',
        content: 'Level 1',
        children: [
          { id: '2', content: 'Level 2', children: [] },
        ],
      },
    ];

    component.replies = replies;
    fixture.detectChanges();

    const nested = fixture.debugElement.queryAll(By.css('.reply-children'));
    expect(nested.length).toBeGreaterThan(0);
  });

  it('should show "load more" button if _count > children.length', () => {
    const replies = [
      {
        id: '1',
        content: 'Level 1',
        _count: { children: 50 },
        children: [{ id: '2' }],  // Only 1 loaded
      },
    ];

    component.replies = replies;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.textContent).toContain('49 more');
  });
});
```

---

## 📝 Checklist

### Backend
- [ ] Ensure nested includes in `findAll()` (3 levels deep)
- [ ] Ensure `getReplies()` returns nested structure
- [ ] Add `_count.children` for pagination awareness
- [ ] Limit nested children (take: 2, 5, 10)
- [ ] Tests passing

### Frontend
- [ ] Create recursive `ReplyListComponent`
- [ ] Remove any manual flattening/grouping logic
- [ ] Add "load more nested" button when needed
- [ ] Integration tests passing

### E2E & QA
- [ ] Nested replies render correctly
- [ ] Deep nesting (3+ levels) displays properly
- [ ] "Load more" works for large nested threads
- [ ] No N+1 queries in network tab

---

## ✨ Critérios de Aceitação

- [ ] **AC1:** Replies returned with nested structure (children array)
- [ ] **AC2:** 3 levels of nesting included in response
- [ ] **AC3:** No client-side flattening/grouping needed
- [ ] **AC4:** `_count.children` present for load-more awareness
- [ ] **AC5:** Single query returns entire nested tree (no N+1)
- [ ] **AC6:** Deep nesting paginated correctly

---

## 📚 Referências

- **ARCHITECTURE_REVIEW.md** - Section "ISSUE 5"
- **Prisma nested includes**: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#nested-include
