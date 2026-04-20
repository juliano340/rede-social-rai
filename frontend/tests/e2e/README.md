# Testes E2E - JVerso

Este projeto utiliza **Playwright** para testes end-to-end.

## Estrutura

```
tests/e2e/
├── fixtures/           # Fixtures e helpers de autenticação
│   └── auth.fixture.ts
├── pages/              # Page Objects
│   ├── home.page.ts
│   ├── login.page.ts
│   ├── profile.page.ts
│   └── register.page.ts
├── tests/              # Testes
│   ├── auth.spec.ts
│   ├── navigation.spec.ts
│   ├── posts.spec.ts
│   └── profile.spec.ts
└── playwright.config.ts
```

## Pré-requisitos

1. Backend rodando na porta 3000
2. Frontend rodando na porta 4200

Ou usar o comando que inicia ambos automaticamente.

## Comandos

### Desenvolvimento (com hot-reload)
```bash
npm run test:e2e
```

### Modo UI (visual)
```bash
npm run test:e2e:ui
```

### Debug com headed browser
```bash
npm run test:e2e:headed
```

### Apenas Chromium
```bash
npm run test:e2e:chromium
```

### Ver relatório HTML
```bash
npm run test:e2e:report
```

### CI (sem webserver configurado)
```bash
npm run test:e2e:ci
```

## Executar com servers manuais

Se preferir iniciar os servers manualmente:

```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm start

# Terminal 3 - Tests (em modo headed)
npm run test:e2e:headed
```

## Escrevendo novos testes

1. Criar Page Objects em `pages/` se necessário
2. Criar fixture em `fixtures/` se precisar de autenticação
3. Criar spec em `tests/`

### Exemplo de teste autenticado

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('meu teste', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/home');
  await expect(authenticatedPage.locator('.posts')).toBeVisible();
});
```

### Exemplo de teste público

```typescript
import { test, expect } from '@playwright/test';

test('página de login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
```

## CI/CD

Os testes rodam automaticamente no GitHub Actions a cada push nas branches `main` e `develop`.

Ver: `.github/workflows/e2e-tests.yml`
