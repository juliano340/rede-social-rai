# Plano de Melhorias RAI

## TL;DR

> **Quick Summary**: Plano abrangente de melhorias para o projeto RAI cobrindo segurança, performance, UX, funcionalidades e infraestrutura.
> 
> **Deliverables**: 6 ondas de melhorias com ~30 tarefas
> 
> **Estimated Effort**: 4-6 semanas

---

## Context

### Estado Atual do Projeto
- **Frontend**: Angular 17+ com Reactive Forms (parcial), template-driven (parcial)
- **Backend**: NestJS + Prisma + PostgreSQL
- **Autenticação**: JWT com rate limiting por IP
- **Funcionalidades**: Login, registro, posts, comentários, perfis, busca
- **Problemas conhecidos**:
  - Rate limiting em memória (perde ao reiniciar)
  - Sem paginação em feeds
  - Sem cache
  - Sem testes automatizados
  - Sem CI/CD
  - Sem logs estruturados
  - Sem variáveis de ambiente
  - Formulários mistos (ngModel + Reactive Forms)

---

## Work Objectives

### Core Objective
Evoluir o projeto RAI de MVP para produção com segurança, performance e qualidade.

### Concrete Deliverables
- ~30 tarefas organizadas em 6 ondas
- Cada onda entrega valor incremental
- Prioridade: segurança > performance > UX > features

---

## TODOs

### Onda 1: Segurança e Infraestrutura (Crítico)

- [ ] 1.1. Rate limiting persistente

  **What to do**:
  - Mover rate limiting de Map em memória para Redis ou tabela no banco
  - Manter 5 tentativas por IP, 15 min de bloqueio
  - Expirar automaticamente

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] Rate limit persiste após restart do backend
  - [ ] IP bloqueado continua bloqueado após restart

  **Commit**: YES
  - Message: `feat(auth): persistent rate limiting via database`

- [ ] 1.2. Variáveis de ambiente

  **What to do**:
  - Criar `.env.example` com todas as variáveis necessárias
  - Usar `@nestjs/config` para carregar variáveis
  - JWT_SECRET, DATABASE_URL, PORT, NODE_ENV
  - Adicionar `.env` ao `.gitignore`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] `.env.example` existe com todas as variáveis
  - [ ] `.env` está no `.gitignore`
  - [ ] App não quebra sem `.env` (usa defaults)

  **Commit**: YES
  - Message: `feat(config): add environment variables management`

- [ ] 1.3. CORS configurável

  **What to do**:
  - Mover origem CORS de hardcoded para variável de ambiente
  - Suportar múltiplas origens
  - Configurar credentials

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] CORS configurado via variável de ambiente
  - [ ] Suporta múltiplas origens

  **Commit**: YES
  - Message: `feat(cors): configurable CORS origins`

- [ ] 1.4. Helmet e segurança HTTP

  **What to do**:
  - Instalar `@nestjs/helmet`
  - Adicionar headers de segurança (X-Content-Type-Options, X-Frame-Options, etc.)
  - Configurar CSP básico

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] Headers de segurança presentes nas respostas
  - [ ] No vulnerabilidades óbvias

  **Commit**: YES
  - Message: `feat(security): add helmet and security headers`

### Onda 2: Performance Backend

- [ ] 2.1. Paginação no feed

  **What to do**:
  - Adicionar paginação cursor-based ou offset no endpoint de posts
  - Limitar a 20 posts por página
  - Retornar `hasMore` e `nextCursor`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] Endpoint retorna max 20 posts
  - [ ] Suporta paginação com cursor ou offset
  - [ ] Frontend carrega mais posts ao scrollar

  **Commit**: YES
  - Message: `feat(posts): add pagination to feed endpoint`

- [ ] 2.2. Índices no banco

  **What to do**:
  - Adicionar índices em: `User.email`, `User.username`, `Post.authorId`, `Post.createdAt`
  - Criar migration Prisma

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] Índices criados via Prisma migration
  - [ ] Queries de feed e perfil mais rápidas

  **Commit**: YES
  - Message: `feat(db): add database indexes for performance`

- [ ] 2.3. Cache de perfis

  **What to do**:
  - Cache de perfis em memória com TTL de 5 minutos
  - Invalidar cache ao atualizar perfil
  - Usar `cache-manager` do NestJS

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] Perfis cacheados por 5 min
  - [ ] Cache invalidado ao atualizar

  **Commit**: YES
  - Message: `feat(cache): add profile caching`

### Onda 3: Qualidade de Código

- [ ] 3.1. Testes unitários backend

  **What to do**:
  - Configurar Jest no backend
  - Testar AuthService (login, register, rate limiting)
  - Testar PostsService (CRUD básico)
  - Cobertura mínima de 60%

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`qa-tester`, `backend-developer`]

  **Acceptance Criteria**:
  - [ ] Testes unitários para AuthService
  - [ ] Testes unitários para PostsService
  - [ ] Cobertura >= 60%

  **Commit**: YES
  - Message: `test: add unit tests for auth and posts services`

- [ ] 3.2. Testes E2E backend

  **What to do**:
  - Configurar testes E2E com Supertest
  - Testar fluxo completo: register → login → create post
  - Testar rate limiting

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`qa-tester`, `backend-developer`]

  **Acceptance Criteria**:
  - [ ] Testes E2E para auth flow
  - [ ] Testes E2E para posts CRUD
  - [ ] Teste de rate limiting

  **Commit**: YES
  - Message: `test: add E2E tests for auth and posts`

- [ ] 3.3. Linting e formatação

  **What to do**:
  - Configurar ESLint + Prettier no backend
  - Configurar no frontend (já deve ter)
  - Adicionar script `npm run lint` e `npm run format`
  - Adicionar pre-commit hook com Husky

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`, `frontend-developer`]

  **Acceptance Criteria**:
  - [ ] ESLint + Prettier configurados
  - [ ] Husky com pre-commit hook
  - [ ] CI passa com lint

  **Commit**: YES
  - Message: `chore: add ESLint, Prettier and Husky`

### Onda 4: UX e Frontend

- [ ] 4.1. Completar migração Reactive Forms

  **What to do**:
  - Migrar formulários restantes de ngModel para Reactive Forms
  - Adicionar validações consistentes em todos os formulários
  - Padronizar mensagens de erro

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Acceptance Criteria**:
  - [ ] Todos os formulários usam Reactive Forms
  - [ ] Validações consistentes
  - [ ] Mensagens de erro em PT-BR

  **Commit**: YES
  - Message: `feat(forms): complete Reactive Forms migration`

- [ ] 4.2. Loading states e skeletons

  **What to do**:
  - Adicionar skeleton loading no feed
  - Adicionar loading no perfil
  - Adicionar loading no search
  - Usar `@angular/cdk/skeleton` ou CSS puro

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Acceptance Criteria**:
  - [ ] Skeleton loading no feed
  - [ ] Skeleton loading no perfil
  - [ ] Sem layout shift ao carregar

  **Commit**: YES
  - Message: `feat(ui): add skeleton loading states`

- [ ] 4.3. Toast notifications

  **What to do**:
  - Implementar sistema de toast notifications
  - Substituir alerts por toasts
  - Tipos: success, error, warning, info
  - Auto-dismiss após 3 segundos

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Acceptance Criteria**:
  - [ ] Toast component criado
  - [ ] Usado em login, registro, posts
  - [ ] Auto-dismiss funciona

  **Commit**: YES
  - Message: `feat(ui): add toast notification system`

- [ ] 4.4. Infinite scroll no feed

  **What to do**:
  - Implementar infinite scroll com IntersectionObserver
  - Carregar mais posts ao chegar no final
  - Mostrar "Carregando..." e "Fim do feed"

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-developer`]

  **Acceptance Criteria**:
  - [ ] Infinite scroll funciona
  - [ ] Carrega mais posts automaticamente
  - [ ] Mostra estado de loading

  **Commit**: YES
  - Message: `feat(feed): add infinite scroll`

### Onda 5: Funcionalidades

- [ ] 5.1. Upload de avatar

  **What to do**:
  - Endpoint para upload de imagem (multer)
  - Salvar em disco ou S3
  - Validar tipo e tamanho (max 2MB, jpg/png)
  - Redimensionar para 256x256

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`backend-developer`, `frontend-developer`]

  **Acceptance Criteria**:
  - [ ] Upload de avatar funciona
  - [ ] Validação de tipo e tamanho
  - [ ] Avatar aparece no perfil

  **Commit**: YES
  - Message: `feat(profile): add avatar upload`

- [ ] 5.2. Notificações

  **What to do**:
  - Tabela de notificações no banco
  - Notificar quando: alguém curte, comenta, segue
  - Endpoint para listar notificações não lidas
  - Badge no frontend

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`backend-developer`, `frontend-developer`]

  **Acceptance Criteria**:
  - [ ] Notificações criadas automaticamente
  - [ ] Endpoint de notificações funciona
  - [ ] Badge mostra contagem

  **Commit**: YES
  - Message: `feat(notifications): add notification system`

- [ ] 5.3. Editar/deletar posts

  **What to do**:
  - Endpoint PUT para editar post
  - Endpoint DELETE para deletar post
  - UI para editar/deletar no frontend
  - Só dono pode editar/deletar

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`, `frontend-developer`]

  **Acceptance Criteria**:
  - [ ] Editar post funciona
  - [ ] Deletar post funciona
  - [ ] Só dono pode editar/deletar

  **Commit**: YES
  - Message: `feat(posts): add edit and delete post`

### Onda 6: Infraestrutura e Deploy

- [ ] 6.1. Docker

  **What to do**:
  - Dockerfile para backend
  - Dockerfile para frontend
  - docker-compose.yml com app + postgres
  - .dockerignore

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] `docker-compose up` sobe tudo
  - [ ] Backend acessível em localhost:3000
  - [ ] Frontend acessível em localhost:4200

  **Commit**: YES
  - Message: `feat(infra): add Docker support`

- [ ] 6.2. CI/CD com GitHub Actions

  **What to do**:
  - Workflow para build e test no push
  - Workflow para deploy (opcional)
  - Cache de dependências
  - Fail fast em erros

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] CI roda no push
  - [ ] Tests passam no CI
  - [ ] Build passa no CI

  **Commit**: YES
  - Message: `ci: add GitHub Actions workflow`

- [ ] 6.3. Logs estruturados

  **What to do**:
  - Instalar `pino` ou `winston` no backend
  - Logs em JSON com timestamp, level, message, context
  - Log de requests HTTP
  - Log de erros com stack trace

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`backend-developer`]

  **Acceptance Criteria**:
  - [ ] Logs em JSON
  - [ ] Request logging
  - [ ] Error logging com stack

  **Commit**: YES
  - Message: `feat(logging): add structured logging`

---

## Priorização

| Onda | Prioridade | Esforço | Impacto |
|------|-----------|---------|---------|
| 1. Segurança | 🔴 Crítico | Baixo | Alto |
| 2. Performance | 🟡 Alto | Médio | Alto |
| 3. Qualidade | 🟡 Alto | Médio | Médio |
| 4. UX | 🟢 Médio | Médio | Alto |
| 5. Features | 🟢 Médio | Alto | Médio |
| 6. Infra | 🟢 Médio | Baixo | Alto |

---

## Commit Strategy

Cada tarefa tem seu próprio commit. Commits seguem Conventional Commits:
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `test:` testes
- `chore:` configurações
- `ci:` CI/CD
- `docs:` documentação
