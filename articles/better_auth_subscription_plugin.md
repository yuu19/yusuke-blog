---
title: 'Better Authのsubscriptionプラグインまとめ'
description: 'Better AuthでStripe連携のsubscription機能を導入する手順・主要API・運用ポイントを整理します。'
emoji: '💳'
type: 'tech'
date: 2026-02-14
topics: ["better-auth", "authentication", "subscription", "stripe"]
blog_published: true
published: true
---

Better Auth で `subscription` を使う場合は、現時点では `@better-auth/stripe` プラグインの `subscription` 機能を使う構成が公式です。  
この記事では、公式ドキュメントをベースに導入手順と実務での注意点をまとめます。

公式ドキュメント: https://www.better-auth.com/docs/plugins/stripe

## 何ができる？

`subscription` 機能で、主に次を実装できます。

- サインアップ時の Stripe Customer 自動作成
- プラン定義（固定定義 / 動的取得）
- Checkout 経由のサブスク作成・アップグレード
- サブスク一覧取得、キャンセル、復元
- Billing Portal への遷移
- Webhook によるサブスク状態の同期

## 最小セットアップ

### 1. パッケージを追加

```bash
pnpm add @better-auth/stripe stripe
```

### 2. サーバー側で Stripe プラグインを有効化

```ts
import { betterAuth } from "better-auth";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const auth = betterAuth({
  // database など既存設定
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
            annualDiscountPriceId: process.env.STRIPE_PRICE_PRO_YEARLY!,
            limits: { projects: 20, seats: 5 },
            freeTrial: { days: 14 },
          },
        ],
      },
    }),
  ],
});
```

### 3. クライアント側プラグインを有効化

```ts
import { createAuthClient } from "better-auth/client";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});
```

### 4. スキーマ反映（必須）

```bash
npx @better-auth/cli migrate
```

または

```bash
npx @better-auth/cli generate
```

### 5. Stripe Webhook を設定

Stripe 側で以下のエンドポイントを登録します（`/api/auth` は Better Auth のデフォルト）。

`https://your-domain.com/api/auth/stripe/webhook`

最低限、次のイベントを購読しておくのが推奨です。

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## よく使う API

### サブスク作成 / プラン変更

```ts
await authClient.subscription.upgrade({
  plan: "pro",
  annual: true,
  successUrl: "/dashboard",
  cancelUrl: "/pricing",
});
```

既存の有効サブスクがあるユーザーを別プランへ変更するときは、`subscriptionId` を渡します。

```ts
await authClient.subscription.upgrade({
  plan: "business",
  subscriptionId: "sub_123",
  successUrl: "/dashboard",
  cancelUrl: "/pricing",
});
```

### 有効サブスク一覧

```ts
const { data: subscriptions } = await authClient.subscription.list({
  query: {
    referenceId: "org_123",
    customerType: "organization",
  },
});
```

### キャンセル

```ts
await authClient.subscription.cancel({
  referenceId: "org_123",
  customerType: "organization",
  subscriptionId: "sub_123",
  returnUrl: "/account",
});
```

### 復元

```ts
await authClient.subscription.restore({
  referenceId: "org_123",
  customerType: "organization",
  subscriptionId: "sub_123",
});
```

### Billing Portal へ遷移

```ts
await authClient.subscription.billingPortal({
  referenceId: "org_123",
  customerType: "organization",
  returnUrl: "/billing",
});
```

## organization 連携時のポイント

`customerType: "organization"` と `referenceId` を使うと、組織単位課金にできます。  
この場合は `authorizeReference` で「誰がその組織の課金操作を実行できるか」を明示するのが安全です。

```ts
subscription: {
  enabled: true,
  plans: [/* ... */],
  authorizeReference: async ({ user, referenceId, action }) => {
    if (
      action === "upgrade-subscription" ||
      action === "cancel-subscription" ||
      action === "restore-subscription" ||
      action === "list-subscription"
    ) {
      const member = await db.member.findFirst({
        where: {
          organizationId: referenceId,
          userId: user.id,
        },
      });

      return member?.role === "owner";
    }

    return true;
  },
},
```

## 実務で重要な注意点

### 1. Webhook を先に安定運用する

Checkout 完了後の状態反映は Webhook に依存します。  
ローカル・ステージングで先に webhook 到達と署名検証を確認しておくと、課金不整合を減らせます。

### 2. 1 referenceId あたり有効サブスクは 1 つ前提で設計する

同一 `referenceId`（ユーザー/組織）で複数同時契約を前提にすると、運用が複雑になります。  
既存契約がある場合は `subscriptionId` 指定で変更フローに統一するのが安全です。

### 3. `better-auth` と `@better-auth/stripe` のバージョンを揃える

プラグイン API が期待通り出ないときは、両パッケージのバージョン不一致を先に疑うのが近道です。

## まとめ

Better Auth の `subscription` 機能は、`@better-auth/stripe` と Webhook のセットで導入すると実運用しやすくなります。  
最初は「少数プラン + 明確な `authorizeReference` + Webhook 監視」から始め、要件に合わせて段階的に広げる構成がおすすめです。

参考:

- https://www.better-auth.com/docs/plugins/stripe
- https://www.better-auth.com/docs/concepts/plugins
