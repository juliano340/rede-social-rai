# Login Rate Limiting

## TL;DR

> **Quick Summary**: Implementar rate limiting no login: 5 tentativas por email, bloqueio de 15 minutos.
> 
> **Deliverables**:
> - Rate limiting no login no backend (auth.service.ts)
> - Mensagens de erro em português no frontend
> 
> **Estimated Effort**: Quick

---

## Context

### Decisões do Usuário
- Bloqueio por **email** (não por IP)
- **5 tentativas** antes de bloquear
- Bloqueio de **15 minutos**

---

## Work Objectives

### Core Objective
Impedir ataques de força bruta no login limitando tentativas falhas por email.

### Concrete Deliverables
- `rai/backend/src/auth/auth.service.ts` - Rate limiting no método login
- `rai/frontend/src/app/pages/login/login.component.ts` - Mostrar mensagem de bloqueio

---

## TODOs

- [ ] 1. Implementar rate limiting no backend

  **What to do**:
  - Adicionar mapa em memória `loginAttempts` no `auth.service.ts`
  - `MAX_ATTEMPTS = 5`, `LOCK_DURATION_MS = 15 * 60 * 1000`
  - No método `login()`:
    1. Chamar `checkLoginRateLimit(email)` ANTES de verificar credenciais
    2. Se credenciais inválidas → `recordFailedAttempt(email)`
    3. Se login bem-sucedido → `clearFailedAttempts(email)`
  - `checkLoginRateLimit`: se conta bloqueada, lançar `TooManyRequestsException` com mensagem em PT-BR e minutos restantes
  - `recordFailedAttempt`: incrementar contador, se >= MAX_ATTEMPTS → bloquear
  - `clearFailedAttempts`: remover entrada do mapa
  - Mensagem de erro: `Conta bloqueada por excesso de tentativas. Tente novamente em X minuto(s).`

  **Must NOT do**:
  - Não usar banco de dados (mapa em memória é suficiente)
  - Não adicionar rate limiting no registro

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/backend/src/auth/auth.service.ts` - Arquivo a modificar
  - `rai/backend/src/auth/auth.controller.ts` - Controller que chama o service

  **Acceptance Criteria**:
  - [ ] Após 5 tentativas falhas com o mesmo email, a 6ª retorna erro 429
  - [ ] Mensagem de erro em português com minutos restantes
  - [ ] Login bem-sucedido limpa o contador
  - [ ] Bloqueio expira após 15 minutos

  **QA Scenarios**:
  ```
  Scenario: 5 tentativas falhas bloqueia conta
    Tool: Bash (curl)
    Preconditions: Backend rodando
    Steps:
      1. curl POST /auth/login com email X e senha errada (5x)
      2. curl POST /auth/login com email X e senha correta
    Expected Result: 6ª requisição retorna 429 com mensagem em PT-BR
    Evidence: .sisyphus/evidence/task-1-rate-limit-block.txt

  Scenario: Login bem-sucedido limpa contador
    Tool: Bash (curl)
    Preconditions: Backend rodando, conta existente
    Steps:
      1. curl POST /auth/login com email X e senha errada (2x)
      2. curl POST /auth/login com email X e senha correta (1x)
      3. curl POST /auth/login com email X e senha errada (1x)
    Expected Result: Após login bem-sucedido, contador reseta. Não bloqueia após apenas 3 tentativas falhas.
    Evidence: .sisyphus/evidence/task-1-rate-limit-reset.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): add login rate limiting - 5 attempts per email, 15min lockout`
  - Files: `backend/src/auth/auth.service.ts`

- [ ] 2. Mostrar mensagem de bloqueio no frontend

  **What to do**:
  - No `login.component.ts`, quando receber erro 429, mostrar a mensagem do backend
  - O erro vem em `err.error?.message`

  **Must NOT do**:
  - Não alterar lógica de rate limiting no frontend

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-developer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `rai/frontend/src/app/pages/login/login.component.ts` - Arquivo a modificar

  **Acceptance Criteria**:
  - [ ] Mensagem de erro 429 aparece em português na tela de login
  - [ ] Mensagem inclui minutos restantes quando aplicável

  **QA Scenarios**:
  ```
  Scenario: Erro de rate limiting exibido no login
    Tool: Playwright
    Preconditions: Backend rodando, conta bloqueada por rate limit
    Steps:
      1. Navegar para /login
      2. Inserir email bloqueado
      3. Inserir senha qualquer
      4. Clicar em "Entrar"
    Expected Result: Mensagem "Conta bloqueada por excesso de tentativas" aparece
    Evidence: .sisyphus/evidence/task-2-rate-limit-frontend.txt
  ```

  **Commit**: YES
  - Message: `feat(login): show rate limit error message in PT-BR`
  - Files: `frontend/src/app/pages/login/login.component.ts`

---

## Commit Strategy

- Task 1: `feat(auth): add login rate limiting - 5 attempts per email, 15min lockout`
- Task 2: `feat(login): show rate limit error message in PT-BR`