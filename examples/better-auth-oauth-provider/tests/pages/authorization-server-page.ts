import { expect, type Page } from '@playwright/test';

export class AuthorizationServerPage {
  constructor(private readonly page: Page) {}

  async signInAndConsent() {
    const signInButton = this.page.getByRole('button', { name: 'サインインして認可を続ける' });
    const consentButton = this.page.getByRole('button', { name: '選択した権限を許可' });
    await expect.poll(async () => {
      if (await signInButton.isVisible()) return 'sign-in';
      if (await consentButton.isVisible()) return 'consent';
      return this.page.url().startsWith('http://localhost:4100') ? 'loading' : 'redirected';
    }).not.toBe('loading');

    if (await signInButton.isVisible()) {
      const password = process.env.OAUTH_LAB_BOOTSTRAP_PASSWORD;
      if (!password) throw new Error('OAUTH_LAB_BOOTSTRAP_PASSWORD is missing');

      await this.page.getByLabel('メールアドレス').fill('reader@example.test');
      await this.page.getByLabel('パスワード').fill(password);
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const signInResponse = this.page.waitForResponse((response) =>
          response.url().endsWith('/api/auth/sign-in/email'));
        await signInButton.click();
        const response = await signInResponse;
        if (response.status() !== 429) break;
        if (attempt === 1) throw new Error('Authorization Server sign-in remained rate limited');

        const retryAfterSeconds = Number(response.headers()['retry-after'] ?? '10');
        await this.page.waitForTimeout(Math.min(30, Math.max(1, retryAfterSeconds)) * 1_000 + 100);
      }
    }

    await expect.poll(async () => {
      if (await consentButton.isVisible()) return 'consent';
      return this.page.url().startsWith('http://localhost:4100') ? 'authorizing' : 'redirected';
    }).not.toBe('authorizing');
    if (await consentButton.isVisible()) await consentButton.click();
  }
}
