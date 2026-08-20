import {
  AUTH_ISSUER,
  NOTES_RESOURCE,
  readOAuthResponse,
  SCOPES,
  summarizeSecret,
} from '@oauth-lab/protocol';
import { loadLabClients, loadLabEnv } from '@oauth-lab/protocol/node';
import { importJWK, SignJWT, type JWK } from 'jose';

loadLabEnv();
const clients = await loadLabClients();
const usePrivateKeyJwt = process.argv.includes('--private-key-jwt');
const tokenEndpoint = `${AUTH_ISSUER}/oauth2/token`;
const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' };
const body = new URLSearchParams({
  grant_type: 'client_credentials',
  scope: SCOPES.notesIndex,
  resource: NOTES_RESOURCE,
});

if (usePrivateKeyJwt) {
  const privateClient = clients.privateJwtIndexer;
  const privateKey = await importJWK(privateClient.privateJwk as JWK, 'ES256');
  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .setIssuer(privateClient.clientId)
    .setSubject(privateClient.clientId)
    .setAudience(tokenEndpoint)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  body.set('client_id', privateClient.clientId);
  body.set('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  body.set('client_assertion', assertion);
} else {
  const basicClient = clients.indexer;
  const credentials = Buffer.from(
    `${basicClient.clientId}:${basicClient.clientSecret}`,
    'utf8',
  ).toString('base64');
  headers.authorization = `Basic ${credentials}`;
}

const tokenResponse = await fetch(tokenEndpoint, {
  method: 'POST',
  headers,
  body,
});
const tokens = await readOAuthResponse(tokenResponse);
console.log(await summarizeSecret('m2m-access-token', tokens.access_token));

const indexResponse = await fetch(`${NOTES_RESOURCE}/index`, {
  method: 'POST',
  headers: { authorization: `Bearer ${tokens.access_token}` },
});
if (!indexResponse.ok) throw new Error(`Indexer failed: ${indexResponse.status}`);
console.log(await indexResponse.json());
