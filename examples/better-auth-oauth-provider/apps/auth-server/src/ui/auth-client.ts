import { createAuthClient } from 'better-auth/react';
import {
  oauthDeviceAuthorizationClient,
  oauthProviderClient,
} from '@better-auth/oauth-provider/client';
import { LAB_ORIGINS } from '@oauth-lab/protocol';

export const authClient = createAuthClient({
  baseURL: LAB_ORIGINS.authorizationServer,
  plugins: [oauthProviderClient(), oauthDeviceAuthorizationClient()],
});
