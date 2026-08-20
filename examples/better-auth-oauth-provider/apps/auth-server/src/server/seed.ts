import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { exportJWK, generateKeyPair, type JWK } from 'jose';
import {
  DEVICE_CODE_GRANT_TYPE,
  LAB_ORIGINS,
  NOTES_RESOURCE,
  SCOPES,
  type LabClientConfig,
} from '@oauth-lab/protocol';
import { LAB_CLIENTS_PATH, loadLabEnv, requireEnv } from '@oauth-lab/protocol/node';

loadLabEnv();
process.env.OAUTH_LAB_SEEDING = 'true';

const { auth } = await import('./auth');

const email = requireEnv('OAUTH_LAB_BOOTSTRAP_EMAIL');
const password = requireEnv('OAUTH_LAB_BOOTSTRAP_PASSWORD');

try {
  await auth.api.signUpEmail({ body: { email, password, name: 'OAuth Lab Reader' } });
} catch (error) {
  if (!(error instanceof Error) || !/exist|registered|user/i.test(error.message)) throw error;
}

const signIn = await auth.api.signInEmail({
  body: { email, password },
  returnHeaders: true,
});
const headers = new Headers();
headers.set(
  'cookie',
  signIn.headers.getSetCookie().map((cookie) => cookie.split(';', 1)[0]).join('; '),
);

const existingClients = await auth.api.getOAuthClients({ headers });
let savedClients: Partial<LabClientConfig> = {};
try {
  savedClients = JSON.parse(await readFile(LAB_CLIENTS_PATH, 'utf8')) as Partial<LabClientConfig>;
} catch {
  // First seed: client secrets will be captured below.
}

type ClientSpec = {
  key: keyof LabClientConfig;
  name: string;
  body: NonNullable<Parameters<typeof auth.api.adminCreateOAuthClient>[0]>['body'];
};

function hasPostgresCode(error: unknown, code: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth += 1) {
    if ('code' in current && current.code === code) return true;
    current = 'cause' in current ? current.cause : undefined;
  }
  return false;
}

const delegatedScopes = [
  SCOPES.notesRead,
  SCOPES.notesWrite,
  SCOPES.openid,
  SCOPES.profile,
  SCOPES.email,
  SCOPES.offlineAccess,
].join(' ');

const savedPrivateJwtClient = savedClients.privateJwtIndexer;
let privateJwtPrivateJwk: JWK;
let privateJwtPublicJwk: JWK;
if (savedPrivateJwtClient?.privateJwk) {
  privateJwtPrivateJwk = savedPrivateJwtClient.privateJwk as JWK;
  privateJwtPublicJwk = { ...privateJwtPrivateJwk };
  delete privateJwtPublicJwk.d;
} else {
  const keyPair = await generateKeyPair('ES256', { extractable: true });
  privateJwtPrivateJwk = await exportJWK(keyPair.privateKey);
  privateJwtPublicJwk = await exportJWK(keyPair.publicKey);
}

const specs: ClientSpec[] = [
  {
    key: 'publicClient',
    name: 'Cloud Notes React Public Client',
    body: {
      client_name: 'Cloud Notes React Public Client',
      token_endpoint_auth_method: 'none',
      // Better Auth only permits HTTP loopback redirects for native metadata.
      // The production HTTPS registration in Part 6 uses `web`.
      application_type: 'native',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      redirect_uris: [`${LAB_ORIGINS.publicClient}/callback`],
      scope: delegatedScopes,
      require_pkce: true,
    },
  },
  {
    key: 'deviceCli',
    name: 'Cloud Notes Device CLI',
    body: {
      client_name: 'Cloud Notes Device CLI',
      token_endpoint_auth_method: 'none',
      application_type: 'native',
      grant_types: [DEVICE_CODE_GRANT_TYPE, 'refresh_token'],
      scope: [SCOPES.notesRead, SCOPES.openid, SCOPES.profile, SCOPES.offlineAccess].join(' '),
    },
  },
  {
    key: 'indexer',
    name: 'Cloud Notes Indexer',
    body: {
      client_name: 'Cloud Notes Indexer',
      token_endpoint_auth_method: 'client_secret_basic',
      grant_types: ['client_credentials'],
      client_credentials_scopes: [SCOPES.notesIndex],
    },
  },
  {
    key: 'resourceApi',
    name: 'Cloud Notes Resource API',
    body: {
      client_name: 'Cloud Notes Resource API',
      token_endpoint_auth_method: 'client_secret_post',
      grant_types: ['client_credentials'],
      client_credentials_scopes: [SCOPES.notesIndex],
    },
  },
  {
    key: 'privateJwtIndexer',
    name: 'Cloud Notes Private Key JWT Indexer',
    body: {
      client_name: 'Cloud Notes Private Key JWT Indexer',
      token_endpoint_auth_method: 'private_key_jwt',
      jwks: { keys: [privateJwtPublicJwk as unknown as Record<string, unknown>] },
      grant_types: ['client_credentials'],
      client_credentials_scopes: [SCOPES.notesIndex],
    },
  },
  {
    key: 'bff',
    name: 'Cloud Notes Next BFF',
    body: {
      client_name: 'Cloud Notes Next BFF',
      token_endpoint_auth_method: 'client_secret_basic',
      // This is a local-transport registration. Production HTTPS uses `web`.
      application_type: 'native',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      redirect_uris: [`${LAB_ORIGINS.bffClient}/api/bff/callback`],
      scope: delegatedScopes,
      require_pkce: true,
    },
  },
];

for (const spec of specs) {
  const existing = existingClients?.find((client) => client.client_name === spec.name);
  let clientId = existing?.client_id;
  const savedClient = savedClients[spec.key];
  let clientSecret = savedClient && 'clientSecret' in savedClient
    ? savedClient.clientSecret
    : undefined;

  if (!clientId) {
    const created = await auth.api.adminCreateOAuthClient({ headers, body: spec.body });
    clientId = created.client_id;
    clientSecret = created.client_secret;
  }
  if (!clientId) throw new Error(`Unable to seed ${spec.name}`);

  try {
    await auth.api.adminLinkClientResource({
      headers,
      params: { identifier: NOTES_RESOURCE, client_id: clientId },
    });
  } catch (error) {
    // The plugin endpoint rejects an already-existing link instead of treating it
    // as an idempotent success. Only the unique-constraint case is safe to ignore.
    if (!hasPostgresCode(error, '23505')) throw error;
  }

  if (spec.key === 'publicClient' || spec.key === 'deviceCli') {
    savedClients[spec.key] = { clientId };
  } else if (spec.key === 'privateJwtIndexer') {
    if (existing && !savedPrivateJwtClient?.privateJwk) {
      throw new Error('Private key for the existing private_key_jwt client is missing. Reset the lab database.');
    }
    savedClients.privateJwtIndexer = { clientId, privateJwk: privateJwtPrivateJwk };
  } else {
    if (!clientSecret) {
      const rotated = await auth.api.rotateClientSecret({
        headers,
        body: { client_id: clientId },
      });
      clientSecret = rotated.client_secret;
    }
    if (!clientSecret) throw new Error(`Unable to obtain secret for ${spec.name}`);
    savedClients[spec.key] = { clientId, clientSecret };
  }
}

await mkdir(dirname(LAB_CLIENTS_PATH), { recursive: true, mode: 0o700 });
await writeFile(LAB_CLIENTS_PATH, `${JSON.stringify(savedClients, null, 2)}\n`, {
  encoding: 'utf8',
  mode: 0o600,
});
console.log(`Seeded user and OAuth clients. Client credentials are stored in ${LAB_CLIENTS_PATH}.`);
