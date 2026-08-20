import { describe, expect, it } from 'vitest';
import { app } from './app';

describe('resource API public endpoints', () => {
  it('serves protected-resource metadata', async () => {
    const response = await app.request('/.well-known/oauth-protected-resource');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      resource: 'http://127.0.0.3:4300',
    });
  });

  it('challenges a request without a token', async () => {
    const response = await app.request('/notes');
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain('resource_metadata');
  });
});
