---
title: 'パスキー認証の仕組みとBetter Authでの実装（SvelteKit）'
description: 'WebAuthn/Passkeyの仕組みを整理し、Better Auth + SvelteKitで実装する最小構成と運用ポイントを解説します。'
emoji: '🔐'
type: 'tech'
date: 2026-02-21
topics: ["passkey", "webauthn", "better-auth", "sveltekit", "authentication"]
blog_published: false
published: false
---

パスワード認証は、漏えい・使い回し・フィッシングのリスクが常につきまといます。  
その代替として普及が進んでいるのが、公開鍵暗号ベースの `Passkey`（WebAuthn）です。

この記事では、まず仕組みを押さえたうえで、`Better Auth + SvelteKit` での実装例を示します。  
中級者向けに、実装で詰まりやすいポイント（`rpID` / `origin` / Conditional UI）まで扱います。

## なぜ今パスキーか

パスキー認証の利点は、単に「便利」だけではありません。

- サーバーに平文/ハッシュ済みパスワードを持たない構造にできる
- 認証はチャレンジ署名ベースなのでフィッシング耐性が高い
- 生体認証や端末PINでUXを維持しつつ強い本人性を確保できる
- パスワードリセット運用（メール到達性・サポート工数）を減らせる

特に B2C サービスでは、ログイン離脱率とアカウント乗っ取り耐性を同時に改善できるのが大きなメリットです。

## パスキー認証の仕組み（公開鍵暗号・WebAuthn・RP/Origin）

パスキーは、端末内に保持される秘密鍵と、サーバーに保存される公開鍵のペアで成立します。

- 秘密鍵: ユーザー端末内に保存され、外部へ出ない
- 公開鍵: サーバーに登録して照合に使う
- `RP (Relying Party)`: 認証を提供するサービス側（あなたのアプリ）
- `rpID`: RPのドメイン識別子
- `origin`: 実際に認証が走るオリジン（`https://example.com` など）

認証の本質は以下です。

1. サーバーが一度限りの `challenge` を発行する
2. 端末が秘密鍵で `challenge` に署名する
3. サーバーが公開鍵で検証する

`challenge` が毎回変わるため、リプレイ攻撃に強い構造になります。

## 登録フローとログインフロー（チャレンジと署名検証）

### 登録（add passkey）

1. ログイン済みユーザーが「パスキー追加」を実行
2. サーバーが登録用 `challenge` を返す
3. ブラウザ/OS が認証器（Touch ID, Windows Hello, セキュリティキー等）を起動
4. 生成された公開鍵クレデンシャルをサーバーに送信
5. サーバーが検証後、`credentialID` / `publicKey` / `counter` などを保存

### ログイン（sign in with passkey）

1. サーバーが認証用 `challenge` を返す
2. 端末が秘密鍵で署名
3. サーバーが公開鍵で照合
4. 成功時にセッション発行

このとき、`rpID` と `origin` が一致条件を満たしていないと、ブラウザ側で認証が始まりません。

## Better Authでの実装方針（サーバー/クライアント責務）

Better Auth では、Passkeyをプラグインとして追加します。

- サーバー側: `@better-auth/passkey` の `passkey()` を登録
- クライアント側: `@better-auth/passkey/client` の `passkeyClient()` を登録
- SvelteKit連携: `svelteKitHandler` で `hooks.server.ts` に統合

責務分離の基本は次の通りです。

- サーバー: challenge発行、署名検証、セッション確立
- クライアント: ブラウザのWebAuthn API呼び出し、UI制御

## SvelteKit実装例（主要ファイル別）

以下は最小実装の形です。実際のプロジェクトでは既存のDB/セッション設定に合わせて調整してください。

### `src/lib/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    passkey({
      rpID: env.PASSKEY_RP_ID ?? "localhost",
      rpName: env.PASSKEY_RP_NAME ?? "My App",
      origin: env.BETTER_AUTH_URL,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    }),
    // SvelteKitのServer ActionsでCookieを正しく扱うため最後に置く
    sveltekitCookies(getRequestEvent),
  ],
});
```

ポイント:

- `rpID` は本番ドメイン設計と一致させる
- `origin` は末尾スラッシュなしの完全一致で管理する
- `sveltekitCookies` は docs 推奨どおり最後のプラグインに置く

### `src/lib/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/svelte";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});
```

### `src/hooks.server.ts`

```ts
import type { Handle } from "@sveltejs/kit";
import { building } from "$app/environment";
import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
```

### `src/routes/login/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { authClient } from "$lib/auth-client";

  let busy = false;
  let errorMessage = "";

  onMount(() => {
    if (!("PublicKeyCredential" in window)) return;

    const conditionalUiSupported =
      typeof PublicKeyCredential.isConditionalMediationAvailable === "function";

    if (!conditionalUiSupported) return;

    // Conditional UIを先に起動しておく
    void authClient.signIn.passkey({ autoFill: true });
  });

  async function signInWithPasskey() {
    busy = true;
    errorMessage = "";

    const { error } = await authClient.signIn.passkey({
      autoFill: false,
      fetchOptions: {
        onSuccess() {
          window.location.href = "/dashboard";
        },
      },
    });

    if (error) {
      errorMessage = error.message;
    }

    busy = false;
  }
</script>

<form>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="username webauthn" />

  <button type="button" on:click={signInWithPasskey} disabled={busy}>
    {busy ? "認証中..." : "パスキーでログイン"}
  </button>

  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
</form>
```

### `src/routes/settings/security/+page.svelte`

```svelte
<script lang="ts">
  import { authClient } from "$lib/auth-client";

  let registering = false;
  let registerError = "";

  async function addPasskey() {
    registering = true;
    registerError = "";

    const { error } = await authClient.passkey.addPasskey({
      name: "main-device",
      authenticatorAttachment: "platform",
    });

    if (error) {
      registerError = error.message;
    }

    registering = false;
  }
</script>

<section>
  <h1>Security</h1>
  <button type="button" on:click={addPasskey} disabled={registering}>
    {registering ? "登録中..." : "この端末をパスキー登録"}
  </button>

  {#if registerError}
    <p>{registerError}</p>
  {/if}
</section>
```

## 動作確認手順

1. 環境変数を設定する

```env
BETTER_AUTH_URL=http://localhost:5173
BETTER_AUTH_SECRET=your-secret
PASSKEY_RP_ID=localhost
PASSKEY_RP_NAME=Your App Name
```

2. Better Auth のマイグレーションを実行する

```bash
npx @better-auth/cli migrate
```

3. サインアップまたは通常ログイン後、設定画面でパスキーを登録する
4. いったんログアウトし、`パスキーでログイン` で再認証する
5. `Conditional UI` を使う場合は、ログインフォームの `autocomplete="... webauthn"` を確認する

## セキュリティ/運用ベストプラクティス

- `rpID` と `origin` は環境ごとに厳密に管理する
- 本番はHTTPS必須で運用し、開発環境との差分を最小化する
- `userVerification` は要件に応じて `required` を検討する
- パスキー未対応端末向けにフォールバック（メール+パスワード等）を残す
- 端末紛失時の復旧導線（別端末パスキー/再認証フロー）を事前設計する

## よくあるハマりどころ

### 1. ブラウザのプロンプトが出ない

- `PublicKeyCredential` 非対応ブラウザ
- `Conditional UI` の前提（`autocomplete="... webauthn"`）不足
- WebAuthnがiframe制約やドメイン条件を満たしていない

### 2. 本番だけ失敗する

多くは `rpID` と `origin` の不一致です。  
たとえば `api.example.com` と `app.example.com` を跨ぐ構成では、RP設計を最初に固定しないと失敗します。

### 3. 手動ボタンで `autoFill: true` を使ってしまう

`autoFill: true` は条件付きUI向けです。  
明示ボタンクリック時は `autoFill: false` を使い、用途を分けると安定します。

## まとめ

Passkey認証は「パスワードをなくす」だけでなく、認証そのものを強化する設計です。  
Better Authでは、Passkeyプラグインを追加するだけで実装の土台を短時間で作れます。

実装初期は、次の3点を最優先で確認すると失敗しにくくなります。

- `rpID`
- `origin`
- `Conditional UI` のUI要件

仕組みを理解したうえで導入すれば、UXとセキュリティを両立したログイン体験を提供できます。

## 参考リンク

- Better Auth Passkey: https://www.better-auth.com/docs/plugins/passkey
- Better Auth SvelteKit Integration: https://www.better-auth.com/docs/integrations/svelte-kit
- Better Auth SvelteKit Example: https://www.better-auth.com/docs/examples/svelte-kit
- WebAuthn 概要（MDN）: https://developer.mozilla.org/docs/Web/API/Web_Authentication_API
- SimpleWebAuthn Conditional UI: https://simplewebauthn.dev/docs/packages/browser#browser-autofill-aka-conditional-ui
