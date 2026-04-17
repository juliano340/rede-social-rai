# Onda UX: Melhorias de Experiência do Usuário

## TL;DR

> **Quick Summary**: Melhorar UX com toasts, skeleton loading, infinite scroll e completar Reactive Forms.
> 
> **Deliverables**:
> - Sistema de toast notifications
> - Skeleton loading states
> - Infinite scroll no feed
> - Completar migração Reactive Forms
> 
> **Estimated Effort**: Medium

---

## Context

### Estado Atual
- Usa `alert()` para erros
- Tela branca enquanto carrega
- Feed carrega tudo de uma vez
- Formulários mistos (ngModel + Reactive Forms)

### Decisões
- Toast: componente simples com CSS puro (sem biblioteca externa)
- Skeleton: CSS puro com animação
- Infinite scroll: IntersectionObserver nativo
- Reactive Forms: manter padrão já estabelecido

---

## Work Objectives

### Core Objective
Melhorar experiência do usuário com feedback visual, loading states e formulários consistentes.

### Concrete Deliverables
- `rai/frontend/src/app/shared/components/toast/` - Toast component
- `rai/frontend/src/app/shared/components/skeleton/` - Skeleton component
- `rai/frontend/src/app/pages/home/home.component.ts` - Infinite scroll
- `rai/frontend/src/app/pages/profile/profile.component.ts` - Reactive Forms completo

---

## TODOs

- [ ] 1. Toast notifications

  **What to do**:
  - Criar `ToastService` com métodos: `success()`, `error()`, `warning()`, `info()`
  - Criar `ToastComponent` com animação CSS
  - Adicionar no `app.component.ts` (global)
  - Substituir `alert()` por toast em: login, registro, posts, perfil
  - Auto-dismiss após 3 segundos
  - Máximo 3 toasts visíveis simultaneamente

  **Must NOT do**:
  - Não usar bibliotecas externas (ngx-toastr, etc.)
  - Não bloquear interação do usuário

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/frontend/src/app/pages/login/login.component.ts`
  - `rai/frontend/src/app/pages/register/register.component.ts`
  - `rai/frontend/src/app/pages/home/home.component.ts`

  **Acceptance Criteria**:
  - [ ] Toast aparece com animação
  - [ ] Auto-dismiss após 3s
  - [ ] 4 tipos: success, error, warning, info
  - [ ] Substitui alert() em login e registro

  **Commit**: YES
  - Message: `feat(ui): add toast notification system`

- [ ] 2. Skeleton loading

  **What to do**:
  - Criar `SkeletonComponent` com props: `type` ('text', 'avatar', 'card'), `width`, `height`
  - CSS com animação shimmer (gradiente animado)
  - Usar no feed (lista de posts)
  - Usar no perfil (info do usuário + posts)
  - Usar no search (resultados)

  **Must NOT do**:
  - Não usar bibliotecas externas
  - Não adicionar layout shift

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (com Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/frontend/src/app/pages/home/home.component.ts`
  - `rai/frontend/src/app/pages/profile/profile.component.ts`
  - `rai/frontend/src/app/pages/search/search.component.ts`

  **Acceptance Criteria**:
  - [ ] Skeleton no feed enquanto carrega
  - [ ] Skeleton no perfil enquanto carrega
  - [ ] Animação shimmer suave
  - [ ] Sem layout shift

  **Commit**: YES
  - Message: `feat(ui): add skeleton loading states`

- [ ] 3. Infinite scroll no feed

  **What to do**:
  - Adicionar IntersectionObserver no HomeComponent
  - Carregar mais posts ao chegar no final
  - Mostrar "Carregando..." no final
  - Mostrar "Fim do feed" quando não houver mais
  - Limitar a 20 posts por carga

  **Must NOT do**:
  - Não usar bibliotecas externas
  - Não carregar duplicados

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (com Tasks 1 e 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/frontend/src/app/pages/home/home.component.ts`
  - `rai/frontend/src/app/services/posts.service.ts`

  **Acceptance Criteria**:
  - [ ] Carrega 20 posts inicialmente
  - [ ] Carrega mais ao scrollar
  - [ ] Mostra "Carregando..."
  - [ ] Mostra "Fim do feed" quando acaba

  **Commit**: YES
  - Message: `feat(feed): add infinite scroll`

- [ ] 4. Completar Reactive Forms

  **What to do**:
  - Migrar formulários restantes de ngModel para Reactive Forms
  - Padronizar validações
  - Mensagens de erro consistentes em PT-BR
  - Verificar: login, search, reply flows

  **Must NOT do**:
  - Não mudar comportamento existente
  - Não adicionar validações que quebrem UX

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (com Tasks 1, 2 e 3)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/frontend/src/app/pages/login/login.component.ts`
  - `rai/frontend/src/app/pages/search/search.component.ts`
  - `rai/frontend/src/app/pages/home/home.component.ts`
  - `rai/frontend/src/app/pages/profile/profile.component.ts`

  **Acceptance Criteria**:
  - [ ] Todos os formulários usam Reactive Forms
  - [ ] Validações consistentes
  - [ ] Mensagens de erro em PT-BR
  - [ ] Build passa

  **Commit**: YES
  - Message: `feat(forms): complete Reactive Forms migration`

---

## Commit Strategy

- Task 1: `feat(ui): add toast notification system`
- Task 2: `feat(ui): add skeleton loading states`
- Task 3: `feat(feed): add infinite scroll`
- Task 4: `feat(forms): complete Reactive Forms migration`
