# Critérios de Aceitação por Issue

## ISSUE #1: N+1 Like Queries

### Functional
- [ ] Feed de 20 posts carrega com 1 chamada a `/posts` (não 21)
- [ ] Resposta inclui `isLiked: boolean` para cada post
- [ ] Usuários não-autenticados recebem `isLiked: false`
- [ ] Endpoint `GET /posts/:id/liked` foi removido
- [ ] Like count está correto em cada post

### Performance
- [ ] Feed load time < 1s (era 2.5s)
- [ ] Network waterfall reduzido em 95%
- [ ] DB queries reduzidas de 20 para 1
- [ ] Time to interactive < 1.2s

### Code Quality
- [ ] Backend tests passing (unit + integration)
- [ ] Frontend tests passing
- [ ] E2E tests para like flow passing

### Backward Compatibility
- [ ] Existing like functionality ainda funciona
- [ ] Existing feeds not broken

---

## ISSUE #2: Replies Aggregation

### Functional
- [ ] Feed exibe top 3 replies para cada post
- [ ] Nested replies (2-3 níveis) incluídos
- [ ] Endpoint `/posts/:id/replies` usa cursor pagination
- [ ] Full reply thread loads sem N+1 queries
- [ ] `_count.replies` acurado

### Performance
- [ ] Replies não causam waterfalling
- [ ] Single query para nested replies
- [ ] Feed load time mantido < 1s

### UX
- [ ] Replies preview visível no feed
- [ ] "Show all replies" button clicável
- [ ] Infinite scroll funciona para replies

---

## ISSUE #3: State Management

### Functional
- [ ] Like toggle é otimista (UI instant)
- [ ] Reply creation não dispara refetch
- [ ] Error rollback restaura estado
- [ ] Reply deletion optimistic

### State Consistency
- [ ] `_count.replies` never out-of-sync
- [ ] `isLiked` nunca diverge do servidor
- [ ] Cache invalidates on logout

### Performance
- [ ] Like response < 50ms (perception)
- [ ] Reply creation instant (UI)
- [ ] No redundant refetches

---

## ISSUE #4: Routes Cleanup

### API Contract
- [ ] `GET /posts` usa cursor pagination
- [ ] `GET /posts/:id/replies` usa cursor pagination
- [ ] `GET /posts/:id/liked` NÃO EXISTE
- [ ] Post response inclui `isLiked: boolean`
- [ ] All responses include `nextCursor`, `hasMore`

### Validation
- [ ] Invalid cursor returns 400
- [ ] Limit > 50 capped ou returns 400

---

## ISSUE #5: Reply Structure

### Data Structure
- [ ] Replies com nested children
- [ ] 3 níveis de nesting suportados
- [ ] Sem transformação client-side
- [ ] `_count.children` presente

### Query Efficiency
- [ ] Single query para tree inteiro
- [ ] Sem N+1 para nested replies

---

## ISSUE #6: Caching

### Cache Behavior
- [ ] Feed cached por 5 minutos
- [ ] Cache invalidated on create/delete
- [ ] Cache cleared on logout

### Performance
- [ ] Returning to feed instant (< 100ms)
- [ ] Tab switch < 100ms (com cache)
- [ ] Cache hit rate > 50%

### Correctness
- [ ] Fresh data after manual refresh
- [ ] No stale data when TTL expires

---

## Before Merge

- [ ] All tests passing
- [ ] Code coverage maintained
- [ ] No breaking changes
- [ ] Performance metrics met
- [ ] Documentation updated
- [ ] Code review approved
