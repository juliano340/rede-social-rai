# Reactive Forms Migration (Smooth / No Regression)

## TL;DR

> Migrate Angular forms from template-driven (`ngModel`) to Reactive Forms in controlled waves, starting from low-risk screens, preserving UX/validation/API payload behavior, and keeping rollback easy (small PRs by flow).

**Deliverables**
- Unified Reactive Forms pattern (typed forms + validators + submit state)
- Migrated forms: login, register, profile edit modal, search input, home/profile comment flows
- Regression checklist + evidence logs for each migrated flow

**Estimated Effort**: Medium
**Parallel Execution**: YES (4 waves)
**Critical Path**: Standards → Low-risk forms → Medium forms → Complex comment flows

---

## Context

### Original Request
Create an execution-control plan for AI agent to migrate forms to Reactive Forms with smooth rollout and no breakage.

### Interview Summary
- Priority: speed + control for execution agent
- Constraint: migration must preserve behavior
- Preferred output: actionable checklist per file/flow

### Research Findings (condensed)
- Template-driven forms identified in:
  - `src/app/pages/login/login.component.ts`
  - `src/app/pages/register/register.component.ts`
  - `src/app/pages/search/search.component.ts`
  - `src/app/pages/home/home.component.ts`
  - `src/app/pages/profile/profile.component.ts`
- No existing Reactive Forms baseline pattern in code.
- Test infra is partial (deps present), but no robust automated suite configured.

---

## Work Objectives

### Core Objective
Migrate all targeted UI forms to Reactive Forms safely, preserving current user behavior and API contracts.

### Definition of Done
- [ ] No target flow uses `[(ngModel)]`
- [ ] Each migrated flow uses `FormGroup/FormControl` + validators
- [ ] Frontend build passes
- [ ] Behavior parity verified by agent QA scenarios

### Must Have
- Typed reactive forms pattern
- Small, reversible PR chunks
- One flow migration per task in high-risk screens

### Must NOT Have (Guardrails)
- No backend contract changes unrelated to forms
- No UX redesign during migration
- No “big-bang” migration in one PR

---

## Verification Strategy

- **Automated tests**: If unavailable, keep migration gated by deterministic agent QA scenarios per task.
- **Primary verification**:
  - Frontend build (`npm run build`)
  - Flow-by-flow behavioral parity checks
  - API payload parity checks in browser network panel equivalent via scripted assertions/logs

Evidence path: `.sisyphus/evidence/reactive-forms/task-{N}-{scenario}.md`

---

## Execution Strategy

### Wave 1 — Foundation (parallel)
1. Define migration standard + helper utilities
2. Add ReactiveFormsModule imports on target components (without behavior changes)
3. Add shared validation helpers (e.g. URL validator used in profile)

### Wave 2 — Low-risk forms (parallel)
4. Migrate Login form
5. Migrate Register form
6. Migrate Search input behavior to reactive stream (`valueChanges`)

### Wave 3 — Medium-risk forms
7. Migrate Profile edit modal (name/bio/bioLink)
8. Preserve existing error messages + disable states

### Wave 4 — High-risk comment flows (sequential by flow)
9. Home: new post composer
10. Home: reply to post
11. Home: edit reply + nested reply
12. Profile: reply/edit/nested reply flows

### Final Verification Wave
13. Global grep check for remaining `ngModel` in migrated scopes
14. Build + parity pass report

---

## TODOs (for execution agent)

- [x] 1. **Create Reactive Forms Standard Doc (internal)**
  - Define typed form model style, submit lifecycle, error rendering, disabled policy.
  - Acceptance: standard applied in all migrated tasks.

- [x] 2. **Wire base utilities**
  - Add reusable validators and form helpers.
  - Acceptance: profile link validator reusable and unit-like checks documented.

- [x] 3. **Login migration** (`login.component.ts`)
  - Replace `ngModel/ngSubmit` with `FormGroup`.
  - Preserve button disabled + loading + error text behavior.

- [x] 4. **Register migration** (`register.component.ts`)
  - Replace template-driven logic with reactive validators.
  - Preserve min-length and existing UX.

- [x] 5. **Search migration** (`search.component.ts`)
  - Reactive control + debounce + enter behavior parity.

- [ ] 6. **Profile edit modal migration** (`profile.component.ts`)
  - Migrate name/bio/bioLink controls.
  - Preserve URL normalization + public-link validation behavior.

- [ ] 7. **Home post composer migration** (`home.component.ts`)
  - Preserve char count, trim checks, submit disable logic.

- [ ] 8. **Home reply flow migration** (`home.component.ts`)
  - Preserve open/close rules and submit path.

- [ ] 9. **Home nested reply/edit migration** (`home.component.ts`)
  - Preserve edge behavior for editing nested replies.

- [ ] 10. **Profile reply/edit/nested migration** (`profile.component.ts`)
  - Mirror home behavior parity.

- [ ] 11. **Global cleanup**
  - Remove obsolete form-state strings no longer needed.
  - Keep only reactive form state for migrated flows.

- [ ] 12. **Regression verification report**
  - Build + flow matrix pass/fail + evidence links.

---

## QA Scenarios (mandatory pattern per task)

For EACH migrated task, run at least:

1. **Happy path**
   - Fill valid fields
   - Submit
   - Assert expected API call and UI success state

2. **Invalid path**
   - Enter invalid values (or blank)
   - Assert submit blocked + error shown

3. **Loading path**
   - Simulate in-flight submit
   - Assert button/controls disabled per policy

4. **Parity check**
   - Compare old expected behavior checklist vs new implementation

### Task-Specific QA Matrix (Executable)

> Ferramentas padrão: browser + DevTools Network para payload/endpoint, e `npm run build` para validação de compilação.

- **Task 3 — Login migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Abrir `/login`, deixar campos vazios.
    2. Verificar botão submit desabilitado (ou submit bloqueado).
    3. Preencher `email` e `password` válidos e enviar.
    4. Conferir request `POST /auth/login` com payload `{ email, password }`.
  - Expected:
    - Estado de loading durante envio.
    - Em erro: mensagem de erro atual preservada.
    - Em sucesso: navegação/comportamento atual preservado.

- **Task 4 — Register migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Abrir `/register` com campos inválidos (senha curta).
    2. Confirmar validação visual e bloqueio de submit.
    3. Preencher válido e enviar.
    4. Conferir `POST /auth/register` com payload `{ username, email, password, name }`.
  - Expected:
    - Regras de minlength/required iguais ao comportamento atual.
    - Mensagens e loading preservados.

- **Task 5 — Search migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Digitar termo no campo de busca.
    2. Verificar debounce (sem spam de requests por tecla).
    3. Pressionar Enter para busca imediata.
  - Expected:
    - Request `GET /users/search?q={term}&page=1&limit=20` acionado com query correta.
    - Quando termo vazio/curto, comportamento de sugestão preservado via `GET /users/suggested?limit=10` (quando aplicável no fluxo atual).
    - Lista renderizada igual ao comportamento anterior.

- **Task 6 — Profile edit modal migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Abrir modal de editar perfil.
    2. Inserir `name`, `bio`, `bioLink` válidos e salvar.
    3. Conferir `PATCH /users/me` com payload `{ name?, bio?, bioLink? }`.
    4. Testar link inválido/localhost e confirmar bloqueio com erro.
  - Expected:
    - Botão salvar respeita `invalid || loading`.
    - Mensagem de erro inline preservada para link inválido.

- **Task 7 — Home post composer migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Tentar submit com texto vazio/whitespace.
    2. Enviar post válido.
    3. Conferir `POST /posts` com payload `{ content }`.
  - Expected:
    - Char count e regras de bloqueio preservadas.
    - Feedback de sucesso/erro igual ao atual.

- **Task 8 — Home reply flow migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Abrir comentários via ícone.
    2. Abrir formulário via “💬 Comentar”.
    3. Enviar comentário válido.
    4. Conferir `POST /posts/{postId}/reply` com payload `{ content }`.
  - Expected:
    - Regras de abrir/fechar mantidas.
    - Lista atualiza sem regressão visual.

- **Task 9 — Home nested reply/edit migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Responder um comentário existente (nested).
    2. Conferir `POST /posts/{postId}/reply` com payload `{ content, parentId }`.
    2. Editar resposta aninhada e salvar.
    3. Validar `PUT /posts/{postId}/reply/{replyId}` com payload `{ content }`.
  - Expected:
    - Fluxo nested continua funcionando sem perder replies.
    - Estados de edição/loading preservados.

- **Task 10 — Profile reply/edit/nested migration**
  - Tool: Browser + DevTools Network
  - Steps:
    1. Repetir cenários de reply/edit/nested na tela de profile.
    2. Validar os mesmos contratos de rede da Home:
       - `POST /posts/{postId}/reply` `{ content }`
       - `POST /posts/{postId}/reply` `{ content, parentId }` (nested)
       - `PUT /posts/{postId}/reply/{replyId}` `{ content }`
    2. Comparar comportamento com Home para paridade.
  - Expected:
    - Mesmas regras funcionais da Home.
    - Sem quebra de layout/estados no profile.

- **Task 12 — Regression verification report**
  - Tool: Terminal
  - Steps:
    1. Rodar `npm run build` no frontend.
    2. Registrar checklist de paridade por fluxo.
  - Expected:
    - Build verde.
    - Evidências documentadas em `.sisyphus/evidence/reactive-forms/`.

---

## Commit Strategy

- One commit per migrated flow (small and reversible)
- Commit message pattern:
  - `refactor(forms): migrate login to reactive forms`
  - `refactor(forms): migrate register to reactive forms`
  - etc.

---

## Success Criteria

- [ ] All planned flows migrated
- [ ] No regression in validation/submit/error/disable behavior
- [ ] Build passing
- [ ] Clear evidence report for each flow
