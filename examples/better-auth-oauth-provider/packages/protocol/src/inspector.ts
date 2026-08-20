import { decodeJwt, decodeProtectedHeader } from 'jose';

export type SecretSummary = {
  kind: string;
  length: number;
  prefix: string;
  sha256: string;
};

export type JwtSummary = {
  kind: 'jwt';
  verified: boolean;
  header: Record<string, unknown>;
  claims: Record<string, unknown>;
  compact: SecretSummary;
};

export async function summarizeSecret(kind: string, value: string): Promise<SecretSummary> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return {
    kind,
    length: value.length,
    prefix: value.slice(0, Math.min(8, value.length)),
    sha256,
  };
}

export async function summarizeVerifiedJwt(token: string, claims: Record<string, unknown>): Promise<JwtSummary> {
  return {
    kind: 'jwt',
    verified: true,
    header: decodeProtectedHeader(token) as Record<string, unknown>,
    claims,
    compact: await summarizeSecret('signed-jwt', token),
  };
}

export async function summarizeUnverifiedJwt(token: string): Promise<JwtSummary> {
  return {
    kind: 'jwt',
    verified: false,
    header: decodeProtectedHeader(token) as Record<string, unknown>,
    claims: decodeJwt(token) as Record<string, unknown>,
    compact: await summarizeSecret('unverified-jwt', token),
  };
}

export function createTraceId(): string {
  return crypto.randomUUID();
}
