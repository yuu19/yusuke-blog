export const LAB_ORIGINS = {
  authorizationServer: 'http://localhost:4100',
  authorizationServerInternal: 'http://127.0.0.1:4110',
  publicClient: 'http://127.0.0.1:4200',
  resourceApi: 'http://127.0.0.3:4300',
  bffClient: 'http://[::1]:4400',
} as const;

export const AUTH_BASE_PATH = '/api/auth';
export const AUTH_ISSUER = `${LAB_ORIGINS.authorizationServer}${AUTH_BASE_PATH}`;
export const NOTES_RESOURCE = LAB_ORIGINS.resourceApi;

export const SCOPES = {
  notesRead: 'notes:read',
  notesWrite: 'notes:write',
  notesIndex: 'notes:index',
  openid: 'openid',
  profile: 'profile',
  email: 'email',
  offlineAccess: 'offline_access',
} as const;

export const DEVICE_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';

export type LabClientConfig = {
  publicClient: { clientId: string };
  deviceCli: { clientId: string };
  indexer: { clientId: string; clientSecret: string };
  privateJwtIndexer: { clientId: string; privateJwk: JWK };
  resourceApi: { clientId: string; clientSecret: string };
  bff: { clientId: string; clientSecret: string };
};
import type { JWK } from 'jose';
