---
title: 'Better Authのorganizationプラグインまとめ'
description: 'Better Authのorganizationプラグインについて、導入手順・主要機能・運用時のポイントをまとめます。'
emoji: '🛡️'
type: 'tech'
date: 2026-02-14
topics: ["better-auth", "authentication", "organization"]
blog_published: true
published: true
---

Better Auth の `organization` プラグインは、SaaS でよくある「ワークスペース/組織単位の権限管理」を実装するための機能です。  
ユーザー、組織、メンバー、招待、チーム、アクティブ組織の管理をまとめて扱えます。

この記事では、公式ドキュメントをベースに以下を整理します。

- 何ができるか
- 最小セットアップ
- 実務で使う主要 API
- 主要オプション
- 運用時の注意点

公式ドキュメント: https://www.better-auth.com/docs/plugins/organization

## デモアプリ

`organization` プラグインの検証用に作成したデモアプリがあります。  
実装全体や画面の動きを確認したい場合は、こちらも参考にしてください。

- GitHub: https://github.com/yuu19/better-auth-organization-demo
- Deploy: https://apps-web.yusuke-kusi1028.workers.dev/

このデモでは、`organization` プラグインの主要な基本フローを確認できます。

- 組織の作成
- ユーザーが所属する組織の一覧表示
- アクティブ組織の切り替え
- メンバー招待などの組織運用の基本操作

## 何ができる？

`organization` プラグインで、主に次の機能を提供できます。

- 組織の作成/更新/削除
- メンバーの招待・参加・削除・ロール更新
- ユーザーが所属する組織の一覧取得
- セッションに紐づく「アクティブ組織」の切り替え
- ロール/権限ベースのアクセス制御
- チーム機能（任意で有効化）
- ライフサイクルごとの hooks で業務ロジックを差し込む

デフォルトロールは `owner` / `admin` / `member` です。  
`owner` が最も強く、`admin` は一部操作（例: 組織削除など）に制限があり、`member` は基本的に閲覧中心の権限です。

## 最小セットアップ

### 1. サーバー側にプラグインを追加

```ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [organization()],
});
```

### 2. スキーマ反映（必須）

organization プラグイン用のテーブル/カラムを DB に追加します。

```bash
npx @better-auth/cli migrate
```

または

```bash
npx @better-auth/cli generate
```

### 3. クライアント側プラグインを追加

```ts
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
```

## よく使う API

### 組織作成

```ts
const { data, error } = await authClient.organization.create({
  name: "My Organization",
  slug: "my-org",
  logo: "https://example.com/logo.png",
  metadata: { plan: "pro" },
});
```

### 組織一覧

```ts
const { data, error } = await authClient.organization.list();
```

### アクティブ組織の切り替え

```ts
await authClient.organization.setActive({
  organizationId: "org-id",
});
```

### メンバー招待

```ts
await authClient.organization.inviteMember({
  email: "user@example.com",
  role: "member",
  organizationId: "org-id",
});
```

## 主要オプション

代表的な設定項目です（公式の Options セクションより）。

- `allowUserToCreateOrganization`  
  組織作成を許可するか。デフォルト `true`。関数でプラン判定も可能。
- `organizationLimit`  
  ユーザーごとの組織数制限。上限到達判定を関数化できる。
- `creatorRole`  
  組織作成者の初期ロール。`owner`（デフォルト）または `admin`。
- `membershipLimit`  
  組織メンバー数の上限。デフォルト `100`。
- `sendInvitationEmail`  
  招待メール送信処理の実装ポイント。
- `invitationExpiresIn`  
  招待リンクの有効期限（秒）。デフォルトは 48 時間。
- `invitationLimit`  
  招待数の上限設定。
- `cancelPendingInvitationsOnReInvite`  
  再招待時の既存 pending 招待の扱い。
- `requireEmailVerificationOnInvitation`  
  招待受諾前にメール検証を必須化するか。

## 実務で重要なポイント

### 1. 「誰が組織を作れるか」を最初に決める

無料プランでは作成不可、Pro 以上のみ可、のような制御は `allowUserToCreateOrganization` で実装できます。

### 2. Active Organization を前提に UI/API を設計する

複数組織に所属するユーザーは一般的なので、現在の作業対象（active organization）の明示が重要です。  
画面ヘッダーで切り替えられるようにして、サーバー処理も active organization 基準で統一すると事故が減ります。

### 3. 招待メールと有効期限は運用要件とセットで決める

`sendInvitationEmail` の実装と `invitationExpiresIn` の設計はセットで考えるのが安全です。  
「期限切れ時の再送」「退会済みメールの再利用」などを事前に決めておくと運用が安定します。

### 4. hooks を使って業務要件を吸収する

`organizationHooks` で、作成/更新/招待/メンバー更新などの前後処理を差し込めます。  
旧 `organizationCreation` hooks は非推奨なので、新規実装は `organizationHooks` を使うのが無難です。

### 5. チーム機能は本当に必要になってから有効化する

`teams.enabled` をオンにすると設計の自由度は上がりますが、管理対象も増えます。  
まずは organization + role ベースで始め、必要になったらチームを追加する進め方が実装コストを抑えやすいです。

## まとめ

Better Auth の `organization` プラグインは、マルチテナント SaaS の認可設計をかなり短時間で形にできます。  
まずは最小構成（organization + invitation + active organization）で立ち上げ、`organizationHooks` と `teams` を段階導入するのがおすすめです。

参考:

- https://www.better-auth.com/docs/plugins/organization
