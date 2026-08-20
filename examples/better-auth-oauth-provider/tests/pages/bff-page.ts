import { expect, type Page } from '@playwright/test';

export class BffPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://[::1]:4400');
    await expect(this.page.getByRole('heading', { name: 'Cloud Notes BFF' })).toBeVisible();
  }

  async startDpopAuthorization() {
    const request = this.page.waitForRequest((candidate) =>
      candidate.url().startsWith('http://localhost:4100/api/auth/oauth2/authorize'));
    // The complete redirect chain can return to the same BFF URL when the AS
    // session and consent already exist, so wait for a main-frame navigation
    // event rather than requiring the final URL to differ.
    const navigation = this.page.waitForEvent('framenavigated', (frame) =>
      frame === this.page.mainFrame());
    await this.page.getByRole('link', { name: 'DPoPでログイン' }).click();
    const authorizationRequest = await request;
    await navigation;
    return new URL(authorizationRequest.url());
  }

  async expectDpopSessionAndReadNotes() {
    await expect(this.page).toHaveURL('http://[::1]:4400/');
    await expect(this.page.getByText('OAuth Tokenがブラウザへ返ったか:')).toContainText('no');
    await expect(this.page.getByText('Token type:')).toContainText('DPoP');
    await this.page.getByRole('button', { name: 'ノート一覧' }).click();
    await expect(this.page.getByText('Token type:')).toContainText('DPoP');
  }
}
