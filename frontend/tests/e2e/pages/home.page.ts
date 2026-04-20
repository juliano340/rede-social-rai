import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly url = '/home';

  readonly newPostTextarea: Locator;
  readonly publishButton: Locator;
  readonly posts: Locator;
  readonly addMediaButton: Locator;
  readonly charCount: Locator;
  readonly deleteModalConfirm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newPostTextarea = page.locator('textarea[placeholder*="acontecendo"]');
    this.publishButton = page.getByRole('button', { name: 'Publicar' });
    this.posts = page.locator('article.post');
    this.addMediaButton = page.getByRole('button', { name: 'Adicionar mídia' });
    this.charCount = page.locator('.char-count');
    this.deleteModalConfirm = page.locator('button.modal-confirm:has-text("Excluir")');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async createPost(content: string) {
    await this.newPostTextarea.fill(content);
    await this.publishButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getPostCount(): Promise<number> {
    return this.posts.count();
  }

  async addImage(url: string) {
    await this.addMediaButton.click();
    await this.page.getByRole('button', { name: 'Imagem' }).click();
    await this.page.locator('input[placeholder*="URL da imagem"]').fill(url);
    await this.page.waitForTimeout(500);
  }

  async addYouTube(url: string) {
    await this.addMediaButton.click();
    await this.page.getByRole('button', { name: 'YouTube' }).click();
    await this.page.locator('input[placeholder*="URL do vídeo"]').fill(url);
    await this.page.waitForTimeout(500);
  }

  async addLink(url: string) {
    await this.addMediaButton.click();
    await this.page.getByRole('button', { name: 'Link' }).click();
    await this.page.locator('input[placeholder*="URL do link"]').fill(url);
    await this.page.waitForTimeout(500);
  }

  async getLatestPost(): Promise<Locator> {
    return this.posts.first();
  }

  async deletePost(postIndex: number = 0) {
    const post = this.posts.nth(postIndex);
    await post.locator('button.action-btn.delete').click();
    await this.deleteModalConfirm.click();
    await this.page.waitForTimeout(1000);
  }
}