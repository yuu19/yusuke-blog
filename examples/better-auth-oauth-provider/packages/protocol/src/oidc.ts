import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose';

export type ValidatedIdToken = JWTPayload & {
  iss: string;
  sub: string;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export async function validateIdToken(input: {
  idToken: string;
  accessToken: string;
  issuer: string;
  clientId: string;
  nonce?: string;
  algorithms?: string[];
}): Promise<ValidatedIdToken> {
  const header = decodeProtectedHeader(input.idToken);
  const algorithms = input.algorithms ?? ['EdDSA'];
  if (!header.alg || !algorithms.includes(header.alg)) {
    throw new Error(`Unsupported ID Token alg: ${header.alg ?? 'missing'}`);
  }

  const { payload } = await jwtVerify(
    input.idToken,
    createRemoteJWKSet(new URL(`${input.issuer}/jwks`)),
    {
      issuer: input.issuer,
      audience: input.clientId,
      algorithms,
    },
  );
  if (typeof payload.sub !== 'string') throw new Error('ID Token sub is missing');
  if (input.nonce && payload.nonce !== input.nonce) throw new Error('ID Token nonce mismatch');

  if (typeof payload.at_hash === 'string') {
    const hashAlgorithm = header.alg === 'EdDSA' || header.alg.endsWith('512')
      ? 'SHA-512'
      : header.alg.endsWith('384')
        ? 'SHA-384'
        : 'SHA-256';
    const digest = new Uint8Array(await crypto.subtle.digest(
      hashAlgorithm,
      new TextEncoder().encode(input.accessToken),
    ));
    const expected = bytesToBase64Url(digest.slice(0, digest.length / 2));
    if (payload.at_hash !== expected) throw new Error('ID Token at_hash mismatch');
  }

  return payload as ValidatedIdToken;
}
