import { createAuthClient } from 'better-auth/client';
import { oauthDeviceAuthorizationClient } from '@better-auth/oauth-provider/client';
import {
  AUTH_ISSUER,
  DEVICE_CODE_GRANT_TYPE,
  NOTES_RESOURCE,
  readOAuthResponse,
  SCOPES,
  summarizeSecret,
} from '@oauth-lab/protocol';
import { loadLabClients, loadLabEnv } from '@oauth-lab/protocol/node';

loadLabEnv();
const clients = await loadLabClients();
const authClient = createAuthClient({
  baseURL: AUTH_ISSUER,
  plugins: [oauthDeviceAuthorizationClient()],
});

const { data, error } = await authClient.device.code({
  client_id: clients.deviceCli.clientId,
  scope: [SCOPES.notesRead, SCOPES.openid, SCOPES.profile, SCOPES.offlineAccess].join(' '),
  resource: NOTES_RESOURCE,
});
if (error || !data) throw new Error(error?.error_description ?? 'Unable to start Device Authorization');

console.log(`ブラウザで ${data.verification_uri} を開いてください。`);
console.log(`ユーザーコード: ${data.user_code}`);

let intervalSeconds = data.interval ?? 5;
while (true) {
  await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
  const response = await fetch(`${AUTH_ISSUER}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: DEVICE_CODE_GRANT_TYPE,
      device_code: data.device_code,
      client_id: clients.deviceCli.clientId,
    }),
  });
  const body = await response.clone().json() as { error?: string };
  if (body.error === 'authorization_pending') continue;
  if (body.error === 'slow_down') {
    intervalSeconds += 5;
    continue;
  }
  if (body.error === 'access_denied' || body.error === 'expired_token') {
    throw new Error(body.error);
  }

  const tokens = await readOAuthResponse(response);
  console.log(await summarizeSecret('device-access-token', tokens.access_token));
  const notesResponse = await fetch(`${NOTES_RESOURCE}/notes`, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  console.log(await notesResponse.json());
  break;
}
