import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { AuthorizationServerPage } from '../pages/authorization-server-page';
import { BffPage } from '../pages/bff-page';
import { PublicClientPage } from '../pages/public-client-page';

const tokenEndpoint = 'http://localhost:4100/api/auth/oauth2/token';

function isTokenExchange(response: { url(): string; request(): { method(): string } }) {
  return response.url() === tokenEndpoint && response.request().method() === 'POST';
}

async function expectTokenError(
  request: APIRequestContext,
  body: URLSearchParams,
  expected: { status: number; error: 'invalid_grant' | 'invalid_request' },
) {
  const response = await request.post(tokenEndpoint, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: body.toString(),
  });
  expect(response.status()).toBe(expected.status);
  expect(await response.json()).toMatchObject({ error: expected.error });
  await response.dispose();
}

async function waitForTokenRequest(page: Page) {
  return page.waitForRequest((request) =>
    request.url() === tokenEndpoint && request.method() === 'POST');
}

function expectScopes(url: URL, expectedScopes: string[]) {
  const scopes = new Set((url.searchParams.get('scope') ?? '').split(/\s+/u).filter(Boolean));
  for (const scope of expectedScopes) expect(scopes).toContain(scope);
}

test.describe('OAuth lab browser flows', () => {
  test.describe.configure({ mode: 'serial' });
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // Keep the Authorization Server session in memory across cases. This avoids
    // persisting an auth cookie and also exercises reuse of a matching consent.
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('validates OIDC + JWT after Authorization Code + PKCE', async () => {
    const page = await context.newPage();
    const client = new PublicClientPage(page);
    const authorizationServer = new AuthorizationServerPage(page);

    await client.goto();
    const authorizationUrl = await client.startOidcJwtAuthorization();
    expectScopes(authorizationUrl, ['openid', 'profile', 'email', 'notes:read']);
    await authorizationServer.signInAndConsent();
    await client.expectValidatedTokenAndReadNotes();
    await page.close();
  });

  test('rejects a wrong PKCE verifier and authorization-code replay', async ({ request }) => {
    const page = await context.newPage();
    const client = new PublicClientPage(page);
    const authorizationServer = new AuthorizationServerPage(page);
    let negativeVerifierChecked = false;

    await page.route(tokenEndpoint, async (route) => {
      const body = new URLSearchParams(route.request().postData() ?? '');
      if (body.get('grant_type') === 'authorization_code' && !negativeVerifierChecked) {
        const wrongVerifierBody = new URLSearchParams(body);
        wrongVerifierBody.set('code_verifier', 'x'.repeat(43));
        const response = await request.post(tokenEndpoint, {
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          data: wrongVerifierBody.toString(),
        });
        const responseBody = await response.json();
        expect(response.status()).toBe(401);
        expect(responseBody).toMatchObject({ error: 'invalid_request' });
        negativeVerifierChecked = true;
        await route.fulfill({
          status: response.status(),
          headers: response.headers(),
          body: JSON.stringify(responseBody),
        });
        await response.dispose();
        return;
      }
      await route.continue();
    });

    await client.goto();
    const authorizationUrl = await client.startOidcJwtAuthorization();
    expectScopes(authorizationUrl, ['openid', 'profile', 'email', 'notes:read']);
    await authorizationServer.signInAndConsent();
    await client.expectTokenError('invalid_request');
    expect(negativeVerifierChecked).toBe(true);

    await client.goto();
    const successfulRequest = waitForTokenRequest(page);
    const retryAuthorizationUrl = await client.startOidcJwtAuthorization();
    expectScopes(retryAuthorizationUrl, ['openid', 'profile', 'email', 'notes:read']);
    await authorizationServer.signInAndConsent();
    const successfulExchangeBody = new URLSearchParams((await successfulRequest).postData() ?? '');
    await client.expectValidatedTokenAndReadNotes();

    await expectTokenError(request, successfulExchangeBody, {
      status: 400,
      error: 'invalid_grant',
    });
    await page.close();
  });

  test('rotates a refresh token and rejects reuse', async ({ request }) => {
    const page = await context.newPage();
    const client = new PublicClientPage(page);
    const authorizationServer = new AuthorizationServerPage(page);

    await client.goto();
    const firstTokenRequest = waitForTokenRequest(page);
    const firstTokenResponse = page.waitForResponse(isTokenExchange);
    const authorizationUrl = await client.startOfflineAuthorization();
    expectScopes(authorizationUrl, ['notes:read', 'offline_access']);
    await authorizationServer.signInAndConsent();
    const initialRequestBody = new URLSearchParams((await firstTokenRequest).postData() ?? '');
    const initialTokens = await (await firstTokenResponse).json() as {
      refresh_token?: string;
    };
    expect(initialTokens.refresh_token).toBeTruthy();

    const refreshResponse = page.waitForResponse(isTokenExchange);
    await client.refresh();
    const rotatedTokens = await (await refreshResponse).json() as {
      refresh_token?: string;
    };
    expect(rotatedTokens.refresh_token).toBeTruthy();
    expect(rotatedTokens.refresh_token).not.toBe(initialTokens.refresh_token);

    await expectTokenError(
      request,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: initialTokens.refresh_token!,
        client_id: initialRequestBody.get('client_id')!,
      }),
      { status: 400, error: 'invalid_grant' },
    );
    await page.close();
  });

  test('keeps a DPoP-bound token inside the BFF', async ({ page }) => {
    const bff = new BffPage(page);
    const authorizationServer = new AuthorizationServerPage(page);

    await bff.goto();
    const authorizationUrl = await bff.startDpopAuthorization();
    expectScopes(authorizationUrl, [
      'openid',
      'profile',
      'email',
      'notes:read',
      'notes:write',
      'offline_access',
    ]);
    await authorizationServer.signInAndConsent();
    await bff.expectDpopSessionAndReadNotes();
  });
});
