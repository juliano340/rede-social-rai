import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';

test.describe('Autenticação', () => {
  test('deve mostrar a página de login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.locator('h1')).toContainText('Entrar no JVerso');
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('deve registrar novo usuário', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const timestamp = Date.now();
    
    await registerPage.goto();
    await registerPage.register(
      'Novo Usuário',
      `novouser${timestamp}`,
      `teste${timestamp}@test.com`,
      'Senha123'
    );

    // Se registro for sucesso, redireciona para /home
    await expect(page).toHaveURL(/.*\/home/, { timeout: 10000 });
  });

  test('deve fazer login com usuário recém-criado', async ({ page }) => {
    // Primeiro cria o usuário
    const registerPage = new RegisterPage(page);
    const timestamp = Date.now();
    const email = `logintest${timestamp}@test.com`;
    const password = 'Senha123';
    
    await registerPage.goto();
    await registerPage.register('Login Test', `logintest${timestamp}`, email, password);
    await page.waitForURL(/.*\/home/, { timeout: 10000 });

    // Limpa sessão e vai para login
    await page.context().clearCookies();
    await page.goto('/login');

    // Faz login com usuário criado
    const loginPage = new LoginPage(page);
    await loginPage.login(email, password);

    // Verifica que está na home
    await expect(page).toHaveURL(/.*\/home/, { timeout: 10000 });
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('inexistente@test.com', 'senhaincorreta');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('deve navegar para registro a partir do login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.cadastreSeLink.click();

    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('h1')).toContainText('Criar conta');
  });

  test('deve navegar para login a partir do registro', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.loginLink.click();

    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Entrar no JVerso');
  });
});