import { Page, Locator } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly url = '/profile';

  readonly profileUsername: Locator;
  readonly profileName: Locator;
  readonly followButton: Locator;
  readonly followersCount: Locator;
  readonly followingCount: Locator;
  readonly postsTab: Locator;
  readonly posts: Locator;

  constructor(page: Page) {
    this.page = page;
    this.profileUsername = page.locator('.username');
    this.profileName = page.locator('h1');
    this.followButton = page.locator('button.follow-btn');
    this.followersCount = page.locator('.stat-item:has-text("seguidores")');
    this.followingCount = page.locator('.stat-item:has-text("seguindo")');
    this.postsTab = page.locator('h2:has-text("Publicações")');
    this.posts = page.locator('.profile-posts article.post');
  }

  async goto(username: string) {
    await this.page.goto(`/profile/${username}`);
  }

  async openFollowers() {
    await this.followersCount.click();
    await this.page.waitForTimeout(500);
  }

  async openFollowing() {
    await this.followingCount.click();
    await this.page.waitForTimeout(500);
  }

  async follow() {
    await this.followButton.click();
    await this.page.waitForTimeout(500);
  }
}