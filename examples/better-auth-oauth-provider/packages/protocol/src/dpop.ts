import {
  calculateJwkThumbprint,
  exportJWK,
  generateKeyPair,
  importJWK,
  SignJWT,
  type JWK,
} from 'jose';
import { sha256Base64Url } from './pkce';

export type DpopKey = {
  privateKey: CryptoKey;
  privateJwk: JWK;
  publicJwk: JWK;
  thumbprint: string;
};

export async function createDpopKey(): Promise<DpopKey> {
  const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  return {
    privateKey,
    privateJwk,
    publicJwk,
    thumbprint: await calculateJwkThumbprint(publicJwk),
  };
}

export async function importDpopKey(privateJwk: JWK, publicJwk: JWK): Promise<DpopKey> {
  const privateKey = await importJWK(privateJwk, 'ES256');
  if (privateKey instanceof Uint8Array) throw new Error('DPoP ES256 JWK did not produce a CryptoKey');
  return {
    privateKey,
    privateJwk,
    publicJwk,
    thumbprint: await calculateJwkThumbprint(publicJwk),
  };
}

export async function createDpopProof(input: {
  key: DpopKey;
  method: string;
  url: string;
  accessToken?: string;
  nonce?: string;
}): Promise<string> {
  const claims: Record<string, string | number> = {
    htm: input.method.toUpperCase(),
    htu: new URL(input.url).href,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  };
  if (input.accessToken) claims.ath = await sha256Base64Url(input.accessToken);
  if (input.nonce) claims.nonce = input.nonce;

  return new SignJWT(claims)
    .setProtectedHeader({ typ: 'dpop+jwt', alg: 'ES256', jwk: input.key.publicJwk })
    .sign(input.key.privateKey);
}
