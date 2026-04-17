# Onda 2: Performance Backend

## TL;DR

> **Quick Summary**: Melhorar performance do backend com paginação no feed, índices no banco e cache de perfis.
> 
> **Deliverables**:
> - Paginação cursor-based no feed de posts
> - Índices no Prisma para queries frequentes
> - Cache de perfis com TTL de 5 minutos
> 
> **Estimated Effort**: Quick

---

## Context

### Estado Atual
- Feed retorna TODOS os posts sem limite
- Sem índices explícitos no Prisma
- Sem cache - cada request vai ao banco
- Queries lentas em feeds com muitos posts

### Decisões
- Paginação: cursor-based (mais eficiente que offset)
- Cache: em memória com TTL (simples, sem Redis por enquanto)
- Índices: via Prisma migration

---

## Work Objectives

### Core Objective
Reduzir tempo de resposta do feed e perfis, e reduzir carga no banco.

### Concrete Deliverables
- `rai/backend/src/posts/posts.controller.ts` - endpoint com paginação
- `rai/backend/src/posts/posts.service.ts` - lógica de paginação
- `rai/backend/prisma/schema.prisma` - índices
- `rai/backend/src/users/users.service.ts` - cache de perfis

---

## TODOs

- [ ] 1. Índices no banco

  **What to do**:
  - Adicionar `@@index` no schema.prisma:
    - `Post.authorId`
    - `Post.createdAt`
    - `User.email` (unique já existe)
    - `User.username` (unique já existe)
    - `Reply.postId`
    - `Reply.parentReplyId`
  - Criar migration: `npx prisma migrate dev --name add_indexes`

  **Must NOT do**:
  - Não remover índices existentes
  - Não alterar tipos de colunas

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (pode rodar junto com Task 2)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/backend/prisma/schema.prisma`

  **Acceptance Criteria**:
  - [ ] Migration criada e aplicada
  - [ ] Índices visíveis no banco

  **QA Scenarios**:
  ```
  Scenario: Índices criados corretamente
    Tool: Bash
    Steps:
      1. Executar `npx prisma migrate dev --name add_indexes`
      2. Verificar migration criada
    Expected Result: Migration aplicada com sucesso
    Evidence: .sisyphus/evidence/task-1-migration.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add database indexes for performance`

- [ ] 2. Paginação no feed

  **What to do**:
  - Modificar `posts.controller.ts`:
    - Adicionar query params: `cursor` (string), `limit` (number, default 20, max 50)
    - Retornar: `{ posts: Post[], nextCursor: string | null, hasMore: boolean }`
  - Modificar `posts.service.ts`:
    - Usar `take: limit + 1` para detectar hasMore
    - Usar `cursor: { id: cursor }` se cursor fornecido
    - Ordenar por `createdAt desc`
    - Retornar `nextCursor` como último post.id se hasMore

  **Must NOT do**:
  - Não usar offset (ineficiente para datasets grandes)
  - Não retornar mais que 50 posts por página
  - Não quebrar compatibilidade com frontend existente

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (com Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/backend/src/posts/posts.controller.ts`
  - `rai/backend/src/posts/posts.service.ts`

  **Acceptance Criteria**:
  - [ ] GET /posts retorna max 20 posts por padrão
  - [ ] Suporta query param `cursor`
  - [ ] Suporta query param `limit` (max 50)
  - [ ] Retorna `nextCursor` e `hasMore`
  - [ ] Ordenação por createdAt desc mantida

  **QA Scenarios**:
  ```
  Scenario: Primeira página do feed
    Tool: Bash (curl)
    Steps:
      1. curl GET /posts
    Expected Result: Retorna 20 posts (ou menos se não houver), hasMore=true/false, nextCursor=null se não houver mais
    Evidence: .sisyphus/evidence/task-2-feed-page1.txt

  Scenario: Segunda página do feed
    Tool: Bash (curl)
    Steps:
      1. curl GET /posts?cursor=<cursor_da_pagina_anterior>
    Expected Result: Retorna próximos 20 posts, nextCursor atualizado
    Evidence: .sisyphus/evidence/task-2-feed-page2.txt

  Scenario: Limite customizado
    Tool: Bash (curl)
    Steps:
      1. curl GET /posts?limit=5
    Expected Result: Retorna max 5 posts
    Evidence: .sisyphus/evidence/task-2-feed-limit.txt
  ```

  **Commit**: YES
  - Message: `feat(posts): add cursor-based pagination to feed`

- [ ] 3. Cache de perfis

  **What to do**:
  - Instalar `cache-manager` e `@nestjs/cache-manager`
  - Configurar CacheModule no UsersModule
  - Adicionar decorator `@CacheTTL(300)` (5 minutos) no método `getProfile`
  - Invalidar cache ao atualizar perfil (usar `CacheService.del()`)

  **Must NOT do**:
  - Não usar Redis (manter em memória por enquanto)
  - Não cachear dados sensíveis (senha, email)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (com Tasks 1 e 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/backend/src/users/users.service.ts`
  - `rai/backend/src/users/users.controller.ts`
  - `rai/backend/src/users/users.module.ts`

  **Acceptance Criteria**:
  - [ ] Perfil cacheado por 5 minutos
  - [ ] Cache invalidado ao atualizar perfil
  - [ ] Segunda requisição ao mesmo perfil é mais rápida

  **QA Scenarios**:
  ```
  Scenario: Cache funciona
    Tool: Bash (curl)
    Steps:
      1. curl GET /users/:username (primeira vez)
      2. curl GET /users/:username (segunda vez)
    Expected Result: Segunda requisição retorna dados cacheados
    Evidence: .sisyphus/evidence/task-3-cache.txt
  ```

  **Commit**: YES
  - Message: `feat(cache): add profile caching with 5min TTL`

---

## Commit Strategy

- Task 1: `feat(db): add database indexes for performance`
- Task 2: `feat(posts): add cursor-based pagination to feed`
- Task 3: `feat(cache): add profile caching with 5min TTL`
