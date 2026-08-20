import { describe, expect, it } from 'vitest';
import { assertIssuer, consumeTransaction, createPkce, createTransaction, storeTransaction, summarizeSecret } from './index';

class MemoryStorage implements Storage {
  #data = new Map<string, string>();
  get length() { return this.#data.size; }
  clear() { this.#data.clear(); }
  getItem(key: string) { return this.#data.get(key) ?? null; }
  key(index: number) { return [...this.#data.keys()][index] ?? null; }
  removeItem(key: string) { this.#data.delete(key); }
  setItem(key: string, value: string) { this.#data.set(key, value); }
}

describe('OAuth protocol helpers', () => {
  it('creates an S256 PKCE pair', async () => {
    const pkce = await createPkce();
    expect(pkce.verifier.length).toBeGreaterThanOrEqual(43);
    expect(pkce.challenge).not.toBe(pkce.verifier);
    expect(pkce.challenge).toMatch(/^[A-Za-z0-9_-]+$/u);
  });

  it('consumes state and transaction exactly once', () => {
    const storage = new MemoryStorage();
    const transaction = createTransaction({
      codeVerifier: 'verifier',
      issuer: 'https://issuer.example',
      redirectUri: 'https://client.example/callback',
    });
    storeTransaction(storage, transaction);
    expect(consumeTransaction(storage, transaction.state)).toEqual(transaction);
    expect(() => consumeTransaction(storage, transaction.state)).toThrow(/already consumed/u);
  });

  it('fails closed on an authorization response issuer mismatch', () => {
    expect(() => assertIssuer('https://attacker.example', 'https://issuer.example')).toThrow(/mismatch/u);
  });

  it('summarizes a secret without returning the secret', async () => {
    const value = 'secret-value-that-must-not-be-logged';
    const summary = await summarizeSecret('access-token', value);
    expect(JSON.stringify(summary)).not.toContain(value);
    expect(summary.length).toBe(value.length);
    expect(summary.sha256).toHaveLength(64);
  });
});
