# Iteração 2: Implementação Core (90% Completude)

**Status:** PRÓXIMA  
**Duração:** 5-7 dias  
**Foco:** P0 issues (N+1 Likes, Routes), P1 issues (Replies Agg)

---

## 🎯 Objetivos

- [ ] ISSUE #1 (N+1 Likes) - MERGED
- [ ] ISSUE #4 (Routes) - MERGED
- [ ] ISSUE #2 (Replies Agg) - MERGED
- [ ] 100% tests passing
- [ ] Performance improvement validated

---

## 📋 Prioridade

### P0 - CRÍTICO (Faz juntos, sem bloqueio)

#### ISSUE #1: N+1 Likes
- [ ] Backend: Add `isLiked` to findAll()
- [ ] Backend: Remove `GET /posts/:id/liked` endpoint
- [ ] Frontend: Remove `isLiked()` service method
- [ ] Frontend: Extract like status from response
- [ ] Tests: Unit + integration + E2E
- [ ] **PR Review & Merge**
- [ ] **Performance verification**

#### ISSUE #4: Routes Cleanup
- [ ] Backend: Unify pagination (cursor only)
- [ ] Backend: Update error handling
- [ ] Frontend: Update getReplies() params
- [ ] Tests: Cursor pagination scenarios
- [ ] **PR Review & Merge**

### P1 - ALTA (Next)

#### ISSUE #2: Replies Aggregation
- [ ] Backend: Add indexes to Reply table
- [ ] Backend: Include top 3 replies in findAll()
- [ ] Backend: Update getReplies() with nesting
- [ ] Frontend: Update DTOs
- [ ] Frontend: Render aggregated replies
- [ ] Tests: Nested structure + counts
- [ ] **PR Review & Merge**
- [ ] **UAT on staging**

---

## 🔄 Workflow

```
Cada Issue:
1. Abrir PR (branch feature)
2. Implementar backend
3. Implementar frontend
4. Escrever testes
5. Code review
6. Merge to main
7. Validate on staging
```

---

## 📊 Métricas Esperadas

| Métrica | Antes | Depois | Progresso |
|---------|-------|--------|-----------|
| API calls | 21 | 1 | 95% ✓ |
| Feed load | 2.5s | 1.0s | 60% ✓ |
| DB queries | 20 | 1 | 95% ✓ |
| Pagination | Mixed | Unified | 100% ✓ |

---

## 🧪 Tests Passing

- [ ] Backend unit tests (90%+ coverage)
- [ ] Backend integration tests
- [ ] Frontend unit tests (80%+ coverage)
- [ ] E2E critical path
- [ ] No regressions in existing features

---

## 📦 Deployment Readiness

- [ ] All PRs merged
- [ ] CI pipeline green
- [ ] Staging deployment successful
- [ ] Manual QA sign-off
- [ ] Load testing passed
- [ ] Rollback plan documented

---

## ✅ Definition of Done

- [ ] All P0 + P1 issues merged
- [ ] 90% completude (remaining: P2, P3)
- [ ] Ready for PHASE 3 (state management)
- [ ] Metrics improved as expected
- [ ] No regressions

---

## 🔗 Next: ITERACAO-3.md
