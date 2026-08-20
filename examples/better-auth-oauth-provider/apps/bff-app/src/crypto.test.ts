import { describe, expect, it } from 'vitest';
import { hashIdentifier, open, seal } from './crypto';

describe('BFF token envelope', () => {
  it('encrypts and authenticates the server-side token set', async () => {
    const sealed = await seal({ access_token: 'not-a-real-token' });
    expect(sealed).not.toContain('not-a-real-token');
    await expect(open(sealed)).resolves.toEqual({ access_token: 'not-a-real-token' });
  });

  it('stores only a one-way browser-session identifier', () => {
    expect(hashIdentifier('browser-secret')).not.toContain('browser-secret');
  });
});
