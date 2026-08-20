import {
  requestToResourceInput,
  verifyAccessTokenRequest,
  type VerifyAccessTokenRequestOptions,
} from 'better-auth/oauth2';
import { createResourceServerChallenge } from '@better-auth/oauth-provider';
import { AUTH_ISSUER, NOTES_RESOURCE } from '@oauth-lab/protocol';
import { loadLabClients } from '@oauth-lab/protocol/node';

let verifyOptionsPromise: Promise<Omit<VerifyAccessTokenRequestOptions, 'requiredScopes'>> | undefined;

function getVerifyOptions() {
  verifyOptionsPromise ??= loadLabClients().then((clients) => ({
    verifyOptions: {
      issuer: AUTH_ISSUER,
      audience: NOTES_RESOURCE,
    },
    jwksUrl: `${AUTH_ISSUER}/jwks`,
    remoteVerify: {
      introspectUrl: `${AUTH_ISSUER}/oauth2/introspect`,
      clientId: clients.resourceApi.clientId,
      clientSecret: clients.resourceApi.clientSecret,
      // Part 2 intentionally accepts opaque tokens issued without RFC 8707 `resource`.
      // The AS still limits introspection to a client linked to this resource.
      allowMissingAudience: true,
    },
    dpop: { signingAlgorithms: ['ES256'] },
  }));
  return verifyOptionsPromise;
}

export async function verifyRequest(request: Request, requiredScopes: string[]) {
  const verifyOptions = await getVerifyOptions();
  return verifyAccessTokenRequest(requestToResourceInput(request), {
    ...verifyOptions,
    requiredScopes,
  });
}

export function challengeFor(error: unknown, requiredScopes: string[]) {
  return createResourceServerChallenge(error, NOTES_RESOURCE, {
    challengeScopes: requiredScopes,
    dpopSigningAlgorithms: ['ES256'],
  });
}
