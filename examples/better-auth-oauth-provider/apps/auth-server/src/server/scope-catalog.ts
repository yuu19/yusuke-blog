import { SCOPES } from '@oauth-lab/protocol';

export const SCOPE_CATALOG = {
  [SCOPES.notesRead]: { label: 'ノートの閲覧', risk: 'low', optional: false },
  [SCOPES.notesWrite]: { label: 'ノートの作成・更新', risk: 'medium', optional: true },
  [SCOPES.notesIndex]: { label: '検索インデックスの更新', risk: 'service', optional: false },
  [SCOPES.openid]: { label: 'ユーザー識別子', risk: 'identity', optional: false },
  [SCOPES.profile]: { label: 'プロフィール', risk: 'identity', optional: true },
  [SCOPES.email]: { label: 'メールアドレス', risk: 'identity', optional: true },
  [SCOPES.offlineAccess]: { label: '継続アクセス', risk: 'high', optional: true },
} as const;

export const SUPPORTED_SCOPES = Object.keys(SCOPE_CATALOG) as Array<keyof typeof SCOPE_CATALOG>;

// Better Auth v1.7.1 applies a resource allowlist to the complete effective
// grant. OIDC and refresh scopes must remain in this list when a single request
// combines identity, offline access, and the Notes resource indicator.
export const NOTES_RESOURCE_ALLOWED_SCOPES = [
  SCOPES.notesRead,
  SCOPES.notesWrite,
  SCOPES.notesIndex,
  SCOPES.openid,
  SCOPES.profile,
  SCOPES.email,
  SCOPES.offlineAccess,
] as const;
