# Iteração 1: Diagnóstico & Design (50% Completude)

**Status:** PLANEJADA  
**Duração:** 2-3 dias  
**Foco:** Validar issues, desenhar solução, preparar testes

---

## 🎯 Objetivos

- [ ] Validar todos os 6 issues em dev environment
- [ ] Mapear impacto exato de cada mudança
- [ ] Desenhar data models finais
- [ ] Specification completa para cada issue
- [ ] Test plan estruturado

---

## 📋 Tarefas

### Phase 1.1: Validação (Dia 1)

**Backend Setup**
- [ ] Ambiente dev rodando (`npm run start:dev`)
- [ ] Database populado com dados de teste
- [ ] Logs habilitados para análise de queries

**Diagnóstico de Issues**
- [ ] ISSUE #1: Confirmar N+1 likes com profiler
- [ ] ISSUE #2: Confirmar replies sem agregação
- [ ] ISSUE #3: Confirmar refetches desnecessários
- [ ] ISSUE #4: Confirmar mixed pagination
- [ ] ISSUE #5: Confirmar flat replies
- [ ] ISSUE #6: Confirmar zero cache

**Network Profiling**
- [ ] Chrome DevTools Network Tab
- [ ] Request waterfall diagram
- [ ] Query count by action
- [ ] Load time baselines

### Phase 1.2: Design (Dia 2-3)

**Architecture Decision**
- [ ] Review proposed solutions from ARCHITECTURE_REVIEW.md
- [ ] Validate backward compatibility
- [ ] Design migration strategy
- [ ] Identify potential blockers

**Specifications**
- [ ] API contracts drafted
- [ ] DTOs updated
- [ ] Database schema reviewed
- [ ] Component structure designed

**Test Plan**
- [ ] Unit test structure mapped
- [ ] Integration test scenarios
- [ ] E2E test cases
- [ ] Performance benchmarks

---

## 📊 Métricas Iniciais (Baseline)

| Métrica | Valor | Alvo |
|---------|-------|------|
| API calls (feed) | 21 | 1 |
| Feed load time | 2.5s | <1s |
| Like check pattern | Waterfall | Aggregated |
| Reply structure | Flat | Nested |
| Pagination | Mixed | Unified cursor |
| Cache hits | 0% | >60% |
| DB queries (feed) | 20 | 1 |

---

## 📚 Deliverables

- [ ] **Baseline metrics** (`BASELINE-METRICS.json`)
- [ ] **Architecture review** (validated)
- [ ] **Specifications** (all 6 issues)
- [ ] **Test plan** (detail level)
- [ ] **Migration strategy** (document)
- [ ] **Risk assessment** (document)

---

## ✅ Definition of Done

- [ ] All issues validated with actual data
- [ ] Specifications reviewed by team
- [ ] Test cases documented
- [ ] No unknowns remain
- [ ] Ready for PHASE 2 implementation

---

## 🔗 Next: ITERACAO-2.md
