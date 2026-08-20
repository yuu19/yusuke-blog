import { createHash, randomBytes, webcrypto } from 'node:crypto';
import { loadLabEnv, requireEnv } from '@oauth-lab/protocol/node';

loadLabEnv();

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

async function encryptionKey() {
  const digest = await webcrypto.subtle.digest(
    'SHA-256',
    encoder.encode(requireEnv('BFF_TOKEN_ENCRYPTION_KEY')),
  );
  return webcrypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export function randomOpaqueId(): string {
  return randomBytes(32).toString('base64url');
}

export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

export async function seal(value: unknown): Promise<string> {
  const iv = randomBytes(12);
  const ciphertext = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(),
    encoder.encode(JSON.stringify(value)),
  );
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

export async function open<T>(sealed: string): Promise<T> {
  const [version, encodedIv, encodedCiphertext] = sealed.split('.');
  if (version !== 'v1' || !encodedIv || !encodedCiphertext) throw new Error('Invalid token envelope');
  const plaintext = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Buffer.from(encodedIv, 'base64url') },
    await encryptionKey(),
    Buffer.from(encodedCiphertext, 'base64url'),
  );
  return JSON.parse(decoder.decode(plaintext)) as T;
}
