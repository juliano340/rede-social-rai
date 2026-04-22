# 📋 Plano de Arquitetura - Melhoria RAI

## Visão Geral

Refatoração em **cascata com feedback loops**:

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: DIAGNÓSTICO & ESPECIFICAÇÃO (Semana 1)             │
├─────────────────────────────────────────────────────────────┤
│ ✓ Validar issues em dev                                    │
│ ✓ Mapear impacto de cada mudança                          │
│ ✓ Desenhar data models                                    │
│ ✓ Spec de APIs e testes                                  │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: IMPLEMENTAÇÃO CRÍTICA (Semana 2-3)                │
├─────────────────────────────────────────────────────────────┤
│ P0: Issue #1 (N+1 Likes)                                  │
│     ├─ Backend: Add isLiked to post response              │
│     ├─ Frontend: Remove separate like checks              │
│     └─ Tests: E2E para like flow                          │
│ P0: Issue #4 (Routes Cleanup)                            │
│     ├─ Remove GET /posts/:id/liked endpoint              │
│     ├─ Unify pagination (cursor only)                    │
│     └─ Tests: All pagination scenarios                   │
│ P1: Issue #2 (Replies Aggregation)                       │
│     ├─ Backend: Include replies in feed                  │
│     ├─ Frontend: Render aggregated replies               │
│     └─ Tests: Reply count accuracy                       │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 3: STATE MANAGEMENT & CACHING (Semana 4)            │
├─────────────────────────────────────────────────────────────┤
│ P1: Issue #3 (State Management)                          │
│     ├─ Implement BehaviorSubject cache                  │
│     ├─ Optimistic updates                               │
│     └─ Rollback on error                                │
│ P2: Issue #6 (Caching)                                  │
│     ├─ TTL-based cache for posts                        │
│     ├─ Cache invalidation on create/delete              │
│     └─ Tests: Cache hit/miss scenarios                  │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 4: POLISH & RELEASE (Semana 5)                      │
├─────────────────────────────────────────────────────────────┤
│ P3: Issue #5 (Reply Structure)                           │
│     ├─ Nested reply includes                            │
│     ├─ Recursive structure                              │
│     └─ Tests: Deep nesting scenarios                    │
│ P3: Performance Monitoring                              │
│     ├─ Metrics before/after                             │
│     ├─ Network waterfalls                               │
│     └─ Bundle size impact                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Dependências Entre Issues

```
Issue #1 (N+1 Likes)      ──┐
    ↓ (unblock)              │
Issue #4 (Routes)         ──┼─→ Issue #2 (Replies Agg)
    ↑ (dependency)            │
Issue #6 (Caching)        ──┘
    ↓
Issue #3 (State Mgmt)
    ↓
Issue #5 (Reply Structure)
```

**Path crítico**: #1 → #4 → #2 → #3 → #6 → #5

---

## 📐 Arquitetura Técnica

### **Backend Stack**
- **Framework**: NestJS (decorators, DI, guards)
- **ORM**: Prisma (relations, includes)
- **Database**: PostgreSQL (indexes, queries)
- **Auth**: JWT + PassportJS

### **Frontend Stack**
- **Framework**: Angular (standalone components)
- **Reactivity**: Signals + RxJS Observables
- **HTTP**: HttpClient + Interceptors
- **State**: BehaviorSubject (service-level cache)

### **Key Concepts to Implement**

#### 1. Cursor-Based Pagination
```
Request:  GET /posts?cursor=2024-01-15T10:30:00Z&limit=20
Response: { posts: [...], nextCursor: "...", hasMore: true }
```

#### 2. Aggregated Data in Response
```
POST response includes:
  - _count: { likes, replies }
  - isLiked: boolean (current user)
  - replies: [...] (top 3 with nested)
```

#### 3. Optimistic Updates
```
Click Like → UI updates immediately
  ↓ (parallel)
API call confirms
  ↓
If error: rollback to previous state
```

#### 4. Service-Level Cache
```
const cache = new Map<key, { data, timestamp }>();
On request: check cache TTL → return cached or fetch
On mutation: invalidate related cache entries
```

---

## 🗂️ Mudanças de Arquivo

### Backend Changes

**Primary files:**
- `backend/src/posts/posts.service.ts` (core logic)
- `backend/src/posts/posts.controller.ts` (routes)
- `backend/src/auth/guards/jwt-auth.guard.ts` (auth)

**Schema changes:**
- `backend/prisma/schema.prisma` (indexes, relations)

**Migration:**
- `backend/prisma/migrations/xxx_optimize_posts/migration.sql`

### Frontend Changes

**Primary files:**
- `frontend/src/app/services/posts.service.ts` (API + cache)
- `frontend/src/app/components/home/home.component.ts` (UI state)
- `frontend/src/app/components/post-edit/post-edit.service.ts` (mutations)

**Tests:**
- `frontend/src/app/services/posts.service.spec.ts`
- `frontend/src/app/components/home/home.component.spec.ts`

---

## ✅ Definição de Pronto (Definition of Done)

### Por Issue

- [ ] Backend implementation complete + tested
- [ ] Frontend integration done + tested
- [ ] E2E tests pass (happy path + edge cases)
- [ ] Code review passed
- [ ] Performance metrics validated
- [ ] Documentation updated

### Por Fase

- [ ] All P0 items merged to main
- [ ] All tests passing in CI
- [ ] No regressions in existing features
- [ ] Performance baseline established

### Before Release

- [ ] Manual QA on staging
- [ ] Load testing on new queries
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## 📊 Success Metrics

| Métrica | Baseline | Target | Issue |
|---------|----------|--------|-------|
| API calls (load feed) | 21 | 1 | #1, #4 |
| Feed load time | 2.5s | <1s | #1, #2, #6 |
| DB queries/feed | 20 | 1 | #1, #2, #5 |
| State update latency | 200ms | <50ms | #3 |
| Cache hit rate | 0% | >60% | #6 |
| Reply view time | 1.5s | <300ms | #2, #5 |

---

## ⚠️ Riscos & Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Data migration breaks | CRÍTICO | Run in staging first, rollback plan |
| Breaking API changes | ALTO | Version endpoints, gradual rollout |
| Performance regression | ALTO | Benchmark before/after on all metrics |
| State cache desync | MÉDIO | Add cache validation, error recovery |
| Nested replies too deep | BAIXO | Limit depth to 3, paginate at level 2 |

---

## 📆 Timeline

| Fase | Duration | Start | End | Deliverable |
|------|----------|-------|-----|-------------|
| 1 | 2-3 days | Today | +2d | ESPECIFICACOES/ + TESTES/ |
| 2 | 5-7 days | +3d | +10d | PR #1, #2, #4 merged |
| 3 | 4-5 days | +11d | +16d | PR #3, #6 merged |
| 4 | 3-4 days | +17d | +20d | PR #5 + polish merged |
| UAT | 2 days | +21d | +22d | Staging validation |
| Release | 1 day | +23d | +23d | Production deploy |

---

## 🔄 Feedback Loop

```
1. Cloud Code (Claude):
   ├─ Analisa issues
   ├─ Cria specs detalhadas
   ├─ Desenha arquitetura
   └─ Define testes

2. Você (Intermediário):
   ├─ Lê spec
   ├─ Passa pra Open Code Go
   └─ Traz resultado

3. Open Code Go:
   ├─ Implementa
   ├─ Testa localmente
   └─ Retorna com PR

4. Cloud Code Reavalia:
   ├─ Valida contra spec
   ├─ Testa qualidade
   ├─ Atualiza métricas
   └─ Define próximo passo
```

---

## 📚 Próximos Documentos

1. **ESPECIFICACOES/** - Detalhe técnico por issue
2. **TESTES/** - Test cases estruturados
3. **CHECKLIST/** - Validações antes de merge
4. **DASHBOARD/** - Progress tracking por iteração

Continuar lendo: [./ESPECIFICACOES/](./ESPECIFICACOES/)
