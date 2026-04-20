import { test as base, Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';

const TEST_USERS = [
  { email: 'user1@test.com', password: 'Test123!', name: 'User One', username: 'user1' },
  { email: 'user2@test.com', password: 'Test123!', name: 'User Two', username: 'user2' },
];

export type TestUser = typeof TEST_USERS[number];

export const test = base.extend<{
  loginPage: LoginPage;
  registerPage: RegisterPage;
  authenticatedPage: Page;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  authenticatedPage: async ({ page }, use, testInfo) => {
    const userIndex = testInfo.workerIndex % TEST_USERS.length;
    const user = TEST_USERS[userIndex];

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL('**/home', { timeout: 15000 });
    
    await use(page);
  },
});