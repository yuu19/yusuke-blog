---
title: 'Better AuthのOAuth 2.1 Provider Pluginまとめ'
description: 'Better AuthでOAuth 2.1 Provider Pluginを使い、認可サーバーを構築する手順と運用ポイントを整理します。'
emoji: '🔐'
type: 'tech'
date: 2026-02-14
topics: ["better-auth", "authentication", "oauth", "oidc"]
blog_published: true
published: true
---

Better Auth の `OAuth 2.1 Provider Plugin` は、認証サーバーを OAuth 2.1 / OIDC 互換の Provider として動かすためのプラグインです。  
外部クライアント（Web / モバイル / MCP クライアント）に対して、認可・トークン発行・同意管理を提供できます。

公式ドキュメント: https://www.better-auth.com/docs/plugins/oauth-provider

> 注意: 公式ドキュメントでは、このプラグインは active development 中で本番利用に注意が必要とされています。

## 何ができる？

- OAuth 2.1 の認可サーバーとして動作
- OIDC 互換（`openid` scope、`userinfo`、`id_token`）
- `authorization_code` / `refresh_token` / `client_credentials` グラント
- RFC7591 準拠の Dynamic Client Registration
- RFC7662 Introspection、RFC7009 Revocation
- RP-Initiated Logout（設定した trusted client 向け）

## 最小セットアップ

### 1. パッケージを追加

```bash
pnpm add @better-auth/oauth-provider
```

### 2. サーバー側にプラグインを追加

```ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";

export const auth = betterAuth({
  disabledPaths: ["/token"],
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      // 必要に応じて selectAccount / postLogin / dynamic registration を設定
    }),
  ],
});
```

### 3. スキーマ反映（必須）

```bash
npx @better-auth/cli migrate
```

または

```bash
npx @better-auth/cli generate
```

### 4. `/.well-known` エンドポイントを追加

OAuth Provider の利用時は、issuer path に well-known を必ず配置します。

- OAuth Authorization Server Metadata
- OpenID Configuration（`openid` scope を使う場合）

例:

```ts
// /.well-known/oauth-authorization-server/[issuer-path]/route.ts
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";

export const GET = oauthProviderAuthServerMetadata(auth);
```

```ts
// [issuer-path]/.well-known/openid-configuration/route.ts
import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";

export const GET = oauthProviderOpenIdConfigMetadata(auth);
```

### 5. 最初の OAuth クライアントを作成

```ts
const client = await auth.api.createOAuthClient({
  headers,
  body: {
    redirect_uris: [redirectUri],
  },
});
```

public client として作る場合は `token_endpoint_auth_method: "none"` を使います。

## クライアント側プラグイン

### OAuth クライアント（Web/Mobile）

```ts
import { createAuthClient } from "better-auth/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

export const authClient = createAuthClient({
  plugins: [oauthProviderClient()],
});
```

### Resource サーバー側クライアント（API）

```ts
import { createAuthClient } from "better-auth/client";
import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";
import { auth } from "@/lib/auth";

export const serverClient = createAuthClient({
  plugins: [oauthProviderResourceClient(auth)],
});
```

## 主要フローの要点

### Authorization Endpoint

- `response_type="code"` のみサポート
- `state` は CSRF 対策として必須
- PKCE は `S256` 前提（`plain` は非対応）

### Token Endpoint

デフォルトで以下グラントをサポートします。

- `authorization_code`
- `refresh_token`（`offline_access` scope で refresh token を発行）
- `client_credentials`

### Consent / Continue

ログイン・同意・アカウント選択・post-login 画面の分岐は `loginPage` / `consentPage` / `selectAccount` / `postLogin` の設定で制御します。  
ユーザー操作後は `oauth2.consent` や `oauth2.continue` を呼んでフローを継続します。

## Dynamic Client Registration

RFC7591 準拠の登録を有効化できます。

```ts
oauthProvider({
  allowDynamicClientRegistration: true,
});
```

未認証クライアント登録まで許可する場合:

```ts
oauthProvider({
  allowDynamicClientRegistration: true,
  allowUnauthenticatedClientRegistration: true,
});
```

この `allowUnauthenticatedClientRegistration` は将来的に非推奨予定と明記されています。必要性を限定して使うのが安全です。

## APIサーバーでのトークン検証

`verifyAccessToken`（`better-auth/oauth2`）か `oauthProviderResourceClient` で検証します。

```ts
import { verifyAccessToken } from "better-auth/oauth2";

const payload = await verifyAccessToken(accessToken, {
  verifyOptions: {
    issuer: "https://auth.example.com",
    audience: "https://api.example.com",
  },
  scopes: ["read:post"],
});
```

実運用では、API で受け入れるトークン形式（JWT / opaque）を明確に決め、スコープ検証を各エンドポイントで統一するのが重要です。

## 実務での注意点

### 1. Dynamic registration はデフォルト無効で始める

公開 API でクライアント登録を解放すると攻撃面が増えます。まずは管理画面や管理 API のみで client 作成する運用が無難です。

### 2. trusted client の `skip_consent` は最小限にする

同意画面を省略するクライアントは、第一者アプリに限定するべきです。第三者連携で多用すると監査性が落ちます。

### 3. issuer path と well-known の整合を最優先で確認

OIDC クライアント連携トラブルの多くは discovery URL の不整合で発生します。`/.well-known/*` の配置と issuer の組み合わせを先に固定すると安定します。

### 4. OIDC Provider 既存運用からの移行時は差分を精査する

旧 OIDC Provider からの移行では、テーブル定義や項目名の変更点がドキュメントに記載されています。移行前に staging で検証してから切り替えるのが安全です。

## まとめ

Better Auth の `OAuth 2.1 Provider Plugin` は、認可サーバー機能を一通り揃えつつ、OIDC 互換と API 保護までまとめて扱える構成です。  
まずは `authorization_code + PKCE + well-known整備` を最小構成で確実に動かし、必要に応じて dynamic registration や organization 連携を段階的に追加するのがおすすめです。

参考:

- https://www.better-auth.com/docs/plugins/oauth-provider
- https://www.better-auth.com/docs/concepts/plugins
