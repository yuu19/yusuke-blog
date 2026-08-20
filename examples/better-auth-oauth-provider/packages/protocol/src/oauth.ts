export type OAuthTokenResponse = {
  access_token: string;
  token_type: 'Bearer' | 'DPoP';
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

export type OAuthErrorResponse = {
  error: string;
  error_description?: string;
  error_uri?: string;
};

export function assertIssuer(received: string | null, expected: string): void {
  if (!received || received !== expected) {
    throw new Error(`Authorization response issuer mismatch: expected ${expected}`);
  }
}

export function hasScope(scope: string | undefined, required: string): boolean {
  return new Set((scope ?? '').split(/\s+/u).filter(Boolean)).has(required);
}

export async function readOAuthResponse(response: Response): Promise<OAuthTokenResponse> {
  const body = (await response.json()) as OAuthTokenResponse | OAuthErrorResponse;
  if (!response.ok || 'error' in body) {
    const error = body as OAuthErrorResponse;
    throw new Error(`${error.error}: ${error.error_description ?? 'OAuth request failed'}`);
  }
  return body;
}
