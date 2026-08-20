import { randomBase64Url } from './pkce';

export type AuthorizationTransaction = {
  id: string;
  state: string;
  codeVerifier: string;
  nonce?: string;
  issuer: string;
  redirectUri: string;
  startedAt: number;
};

const PREFIX = 'oauth-lab:transaction:';
const MAX_AGE_MS = 10 * 60 * 1000;

export function createTransaction(input: Omit<AuthorizationTransaction, 'id' | 'state' | 'startedAt'>): AuthorizationTransaction {
  return {
    ...input,
    id: randomBase64Url(18),
    state: randomBase64Url(32),
    startedAt: Date.now(),
  };
}

export function storeTransaction(storage: Storage, transaction: AuthorizationTransaction): void {
  storage.setItem(`${PREFIX}${transaction.id}`, JSON.stringify(transaction));
  storage.setItem(`${PREFIX}state:${transaction.state}`, transaction.id);
}

export function consumeTransaction(storage: Storage, state: string, now = Date.now()): AuthorizationTransaction {
  const stateKey = `${PREFIX}state:${state}`;
  const transactionId = storage.getItem(stateKey);
  storage.removeItem(stateKey);
  if (!transactionId) throw new Error('Unknown or already consumed OAuth state');

  const transactionKey = `${PREFIX}${transactionId}`;
  const encoded = storage.getItem(transactionKey);
  storage.removeItem(transactionKey);
  if (!encoded) throw new Error('OAuth transaction is missing');

  const transaction = JSON.parse(encoded) as AuthorizationTransaction;
  if (transaction.state !== state) throw new Error('OAuth state mismatch');
  if (now - transaction.startedAt > MAX_AGE_MS) throw new Error('OAuth transaction expired');
  return transaction;
}
