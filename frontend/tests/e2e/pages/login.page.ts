import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly url = '/login';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly cadastreSeLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[formcontrolname="email"]');
    this.passwordInput = page.locator('input[type="password"], input[formcontrolname="password"]');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
    this.registerLink = page.locator('a:has-text("Cadastre-se")');
    this.cadastreSeLink = page.locator('a:has-text("Cadastre-se")');
    this.errorMessage = page.locator('.alert-error, [role="alert"]');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async goToRegister() {
    await this.registerLink.click();
  }
}
