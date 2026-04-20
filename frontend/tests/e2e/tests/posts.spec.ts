import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';
import { HomePage } from '../pages/home.page';

const TEST_USER = {
  name: 'Test User',
  username: 'testuser',
  email: 'testuser@test.com',
  password: 'Senha123'
};

async function ensureTestUser(page: any) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  
  const isLoggedIn = await page.waitForURL(/.*\/home/, { timeout: 3000 }).then(() => true).catch(() => false);
  
  if (!isLoggedIn) {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(TEST_USER.name, TEST_USER.username, TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/.*\/home/, { timeout: 10000 });
  }
}

test.describe('Posts', () => {
  test.beforeEach(async ({ page }) => {
    await ensureTestUser(page);
    await page.waitForTimeout(500);
  });

  test('deve criar post apenas com texto', async ({ page }) => {
    const homePage = new HomePage(page);
    const postContent = `Teste de post apenas texto ${Date.now()}`;
    const initialCount = await homePage.getPostCount();

    await homePage.createPost(postContent);

    const newCount = await homePage.getPostCount();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('deve criar post com imagem', async ({ page }) => {
    const homePage = new HomePage(page);
    const postContent = `Teste de post com imagem ${Date.now()}`;
    const imageUrl = 'https://picsum.photos/400/300';

    await homePage.newPostTextarea.fill(postContent);
    await homePage.addImage(imageUrl);
    await homePage.publishButton.click();
    await page.waitForTimeout(1500);

    const latestPost = await homePage.getLatestPost();
    await expect(latestPost).toContainText(postContent);
    await expect(latestPost.locator('img').first()).toBeVisible();
  });

  test('deve criar post com YouTube', async ({ page }) => {
    const homePage = new HomePage(page);
    const postContent = `Teste de post com YouTube ${Date.now()}`;
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    await homePage.newPostTextarea.fill(postContent);
    await homePage.addYouTube(youtubeUrl);
    await homePage.publishButton.click();
    await page.waitForTimeout(1500);

    const latestPost = await homePage.getLatestPost();
    await expect(latestPost).toContainText(postContent);
  });

  test('deve criar post com link', async ({ page }) => {
    const homePage = new HomePage(page);
    const postContent = `Teste de post com link ${Date.now()}`;
    const linkUrl = 'https://www.google.com';

    await homePage.newPostTextarea.fill(postContent);
    await homePage.addLink(linkUrl);
    await homePage.publishButton.click();
    await page.waitForTimeout(1500);

    const latestPost = await homePage.getLatestPost();
    await expect(latestPost).toContainText(postContent);
    const linkElement = latestPost.locator('a').first();
    await expect(linkElement).toBeVisible();
  });

  test('deve validar limite de caracteres', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.newPostTextarea.fill('a'.repeat(280));
    
    await expect(homePage.charCount).toContainText('280/280');
  });

  test('deve criar post com texto mínimo', async ({ page }) => {
    const homePage = new HomePage(page);
    
    const button = homePage.publishButton;
    
    await homePage.newPostTextarea.fill('a');
    
    await expect(button).toBeEnabled();
  });

  test('deve excluir post cadastrado', async ({ page }) => {
    const homePage = new HomePage(page);
    const postContent = `Post para excluir ${Date.now()}`;
    
    await homePage.createPost(postContent);
    const initialCount = await homePage.getPostCount();
    
    const latestPost = homePage.posts.first();
    await latestPost.locator('button.action-btn.delete').click();
    
    await page.locator('button:has-text("Excluir")').click();
    await page.waitForTimeout(1000);
    
    const newCount = await homePage.getPostCount();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('deve cancelar exclusão do post', async ({ page }) => {
    const homePage = new HomePage(page);
    const postContent = `Post para cancelar exclusão ${Date.now()}`;
    
    await homePage.createPost(postContent);
    const initialCount = await homePage.getPostCount();
    
    const latestPost = homePage.posts.first();
    await latestPost.locator('button.action-btn.delete').click();
    
    await page.locator('button:has-text("Cancelar")').click();
    await page.waitForTimeout(500);
    
    const newCount = await homePage.getPostCount();
    expect(newCount).toBe(initialCount);
  });
});