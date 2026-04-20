import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly url = '/register';

  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input#name');
    this.usernameInput = page.locator('input#username');
    this.emailInput = page.locator('input#email');
    this.passwordInput = page.locator('input#password');
    this.submitButton = page.locator('button:has-text("Criar conta")');
    this.loginLink = page.locator('.auth-footer a[href="/login"]');
    this.errorMessage = page.locator('.alert-error');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async register(name: string, username: string, email: string, password: string) {
    await this.nameInput.fill(name);
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async goToLogin() {
    await this.loginLink.click();
  }
}