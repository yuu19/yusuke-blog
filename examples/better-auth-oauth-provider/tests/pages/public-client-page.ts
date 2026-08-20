import { expect, type Page } from '@playwright/test';

export class PublicClientPage {
  constructor(private readonly page: Page) {}

  private async clickAuthorizationButton(name: '閲覧権限で認可' | '編集権限へstep-up') {
    const startingUrl = this.page.url();
    const request = this.page.waitForRequest((candidate) =>
      candidate.url().startsWith('http://localhost:4100/api/auth/oauth2/authorize'));
    const navigation = this.page.waitForURL((url) => url.toString() !== startingUrl);
    await this.page.getByRole('button', { name }).click();
    const authorizationRequest = await request;
    await navigation;
    return new URL(authorizationRequest.url());
  }

  async goto() {
    await this.page.goto('http://127.0.0.1:4200');
    await expect(this.page.getByRole('heading', { name: 'Cloud Notes' })).toBeVisible();
  }

  async startOidcJwtAuthorization() {
    await this.page.getByLabel('OIDC identity scopes').check();
    await this.page.getByLabel('Notes APIをresourceに指定してJWT Access Tokenを要求').check();
    return this.clickAuthorizationButton('閲覧権限で認可');
  }

  async startOfflineAuthorization() {
    await this.page.getByLabel('継続アクセス（offline_access）').check();
    return this.clickAuthorizationButton('閲覧権限で認可');
  }

  async refresh() {
    await this.page.getByRole('button', { name: 'Refresh' }).click();
    await expect(this.page.getByRole('status')).toContainText('Refresh Tokenをローテーションしました');
  }

  async expectTokenError(error: 'invalid_grant' | 'invalid_request') {
    await expect(this.page.getByRole('status')).toContainText(error);
  }

  async expectValidatedTokenAndReadNotes() {
    await expect(this.page).toHaveURL('http://127.0.0.1:4200/');
    await expect(this.page.getByRole('status')).toContainText('CodeをTokenへ交換しました');
    await expect(this.page.locator('pre')).toContainText('"verified": true');
    await this.page.getByRole('button', { name: 'ノート一覧' }).click();
    await expect(this.page.getByRole('button', { name: 'ノート一覧' })).toBeEnabled();
  }
}
