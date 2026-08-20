import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { jwt } from 'better-auth/plugins/jwt';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { oauthDeviceAuthorization, oauthProvider } from '@better-auth/oauth-provider';
import {
  AUTH_ISSUER,
  LAB_ORIGINS,
  NOTES_RESOURCE,
} from '@oauth-lab/protocol';
import { loadLabEnv, requireEnv } from '@oauth-lab/protocol/node';
import { db } from './db';
import * as schema from './db/schema';
import { NOTES_RESOURCE_ALLOWED_SCOPES, SUPPORTED_SCOPES } from './scope-catalog';

loadLabEnv();

const bootstrapEmail = requireEnv('OAUTH_LAB_BOOTSTRAP_EMAIL');

export const auth = betterAuth({
  appName: 'Cloud Notes Authorization Server',
  baseURL: LAB_ORIGINS.authorizationServer,
  basePath: '/api/auth',
  secret: requireEnv('BETTER_AUTH_SECRET'),
  database: process.env.OAUTH_LAB_SCHEMA_GENERATION === 'true'
    ? memoryAdapter({})
    : drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.OAUTH_LAB_SEEDING !== 'true',
  },
  trustedOrigins: [
    LAB_ORIGINS.authorizationServer,
    LAB_ORIGINS.publicClient,
    LAB_ORIGINS.bffClient,
  ],
  advanced: {
    useSecureCookies: false,
    crossSubDomainCookies: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'database',
  },
  plugins: [
    jwt({ jwt: { issuer: AUTH_ISSUER } }),
    oauthProvider({
      loginPage: '/sign-in',
      consentPage: '/consent',
      scopes: SUPPORTED_SCOPES,
      resources: process.env.OAUTH_LAB_SCHEMA_GENERATION === 'true' ? [] : [
        {
          identifier: NOTES_RESOURCE,
          name: 'Cloud Notes API',
          allowedScopes: [...NOTES_RESOURCE_ALLOWED_SCOPES],
        },
      ],
      resourceSeedMode: 'overwrite',
      enforcePerClientResources: true,
      allowPublicClientPrelogin: true,
      allowDynamicClientRegistration: false,
      refreshTokenReuseInterval: 0,
      clientPrivileges: ({ user }) => user?.email === bootstrapEmail,
      resourcePrivileges: ({ user }) => user?.email === bootstrapEmail,
      customAccessTokenClaims: ({ user }) => ({
        'https://oauth-lab.example/principal_type': user ? 'user' : 'service',
      }),
      dpop: {
        proofMaxAgeSeconds: 300,
        signingAlgorithms: ['ES256'],
      },
    }),
    oauthDeviceAuthorization({ verificationUri: '/device' }),
  ],
});
