---
title: 'cal.comのStripe Connect実装をコードから読む'
description: 'cal.comでStripe Connectがどこで使われ、OAuth接続から決済・Webhookまでどう流れるかを実装ベースで解説します。'
emoji: '🔌'
date: 2026-02-25
topics: ["cal.com", "stripe", "stripe-connect", "payments", "oss"]
category: 'tech'
blog_published: true
published: false
---

この記事は、`calcom/cal.com` の実装を追って、Stripe Connect がどこで使われているかを整理した技術メモです。

調査対象コミット（2026-02-25時点）:
`5d65a0f09199abeab9729d2665e9bed399692f55`

## 結論（先に要点）

cal.com の Stripe Connect は、大きく次の4段で実装されています。

1. Stripe OAuthで接続（Connect URL生成 → callbackで`stripe_user_id`取得）
2. `Credential(type="stripe_payment")` に接続情報を保存（userまたはteam）
3. 予約決済時に `stripeAccount: stripe_user_id` を付けて、接続先アカウント上で `PaymentIntent` / `SetupIntent` を作成
4. Webhook（connected account event）で `payment_intent.succeeded` / `setup_intent.succeeded` を受けて予約を確定

同じStripeでも、組織サブスク課金（Organization billing）は別経路で、Connect口座ではなく platform 側アカウントで処理されています。

## 実装マップ

まず、Stripe Connectに直接関係する主要ファイルは次です。

- API v2（Platform向けConnect導線）
  - `apps/api/v2/src/modules/stripe/controllers/stripe.controller.ts`
  - `apps/api/v2/src/modules/stripe/stripe.service.ts`
  - `apps/api/v2/src/modules/organizations/stripe/organizations-stripe.controller.ts`
  - `apps/api/v2/src/modules/organizations/stripe/services/organizations-stripe.service.ts`
- Front（Platform Atoms）
  - `packages/platform/atoms/hooks/stripe/useConnect.ts`
  - `packages/platform/atoms/hooks/stripe/useCheck.ts`
  - `packages/platform/atoms/connect/stripe/StripeConnect.tsx`
- App Store（旧来のStripe導線）
  - `packages/app-store/stripepayment/api/add.ts`
  - `packages/app-store/stripepayment/api/callback.ts`
  - `packages/app-store/_utils/oauth/createOAuthAppCredential.ts`
- 決済実行・Webhook
  - `packages/app-store/stripepayment/lib/PaymentService.ts`
  - `packages/features/ee/payments/api/webhook.ts`
  - `apps/web/pages/api/integrations/stripepayment/webhook.ts`

## 1. Connect開始（Platform Atoms → API v2）

フロント側の `StripeConnect` コンポーネントは、内部で `useCheck` → `useConnect` を使います。

- 既存接続確認: `/stripe/check` または `/organizations/{orgId}/teams/{teamId}/stripe/check`
- 接続開始: `/stripe/connect` または `/organizations/{orgId}/teams/{teamId}/stripe/connect`

`useConnect` は `authUrl` を取得後、`window.location.href = authUrl` で Stripe へ遷移します。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/platform/atoms/connect/stripe/StripeConnect.tsx#L30-L83

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/platform/atoms/hooks/stripe/useConnect.ts#L9-L54

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/platform/atoms/hooks/stripe/useCheck.ts#L25-L73

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/controllers/stripe.controller.ts#L49-L77

## 2. OAuth URL生成とstateの中身

API v2 の `GET /v2/stripe/connect` は、`Authorization: Bearer ...` からトークンを取り出し、`state` に入れて Stripe OAuth URL を組み立てます。

`StripeService.getStripeRedirectUrl()` のポイント:

- `https://connect.stripe.com/oauth/authorize`
- `scope=read_write`
- `response_type=code`
- `redirect_uri={api.url}/stripe/save`
- `state` に `accessToken`, `returnTo`, `onErrorReturnTo`, `teamId/orgId`（必要時）

ここで `api.url` は設定上 `.../v2` を含むため、実際の callback は `.../v2/stripe/save` になります。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/stripe.service.ts#L60-L82

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/controllers/stripe.controller.ts#L54-L71

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/config/app.ts#L17-L21

## 3. callback保存（user / team）

### 3.1 userレベル

`GET /v2/stripe/save` では以下を実行します。

1. `code` を `stripe.oauth.token` で交換
2. `stripe_user_id` があれば `accounts.retrieve` で `default_currency` 補完
3. 既存の `stripe_payment` 資格情報を削除
4. 新しい `Credential(type="stripe_payment", appId="stripe")` を作成

つまりv2導線は「同一ownerに複数Stripe資格情報を持たせる」のではなく、保存時に置き換える設計です。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/controllers/stripe.controller.ts#L79-L149

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/stripe.service.ts#L100-L134

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/apps/apps.repository.ts#L15-L33

### 3.2 teamレベル

`state` に `teamId` と `orgId` が入っている場合、`/v2/stripe/save` は
`/v2/organizations/:orgId/teams/:teamId/stripe/save` へプロキシします。

このteam側エンドポイントには `TEAM_ADMIN` や Plan / Org / Team ガードが付いており、権限チェックをコントローラ層で担保しています。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/controllers/stripe.controller.ts#L103-L121

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/organizations/stripe/organizations-stripe.controller.ts#L63-L159

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/organizations/stripe/services/organizations-stripe.service.ts#L34-L73

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/tokens/tokens.repository.ts#L158-L169

## 4. 接続済み判定（checkエンドポイント）

`/stripe/check` は保存済みCredentialを見て終わりではなく、Stripe Accountを実問い合わせします。

`validateStripeCredentials()` では:

- Credentialが存在するか
- `invalid` フラグでないか
- `accounts.retrieve(stripe_user_id)` の結果で
  - `payouts_enabled`
  - `charges_enabled`

の両方がtrueかを確認します。

この判定により、「OAuthは通ったがまだ受取/課金が有効化されていないアカウント」を弾けます。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/stripe.service.ts#L145-L169

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/stripe/controllers/stripe.controller.ts#L150-L157

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/api/v2/src/modules/organizations/stripe/services/organizations-stripe.service.ts#L75-L82

## 5. 予約決済でConnectが使われる場所

### 5.1 どのCredentialを使うか

イベントタイプの app metadata には `credentialId` を持てます。予約作成時はこの `credentialId`（なければ主催者user）から payment app credential を解決し、`handlePayment()` に渡します。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/eventTypeAppCardZod.ts#L4-L8

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/features/bookings/lib/service/RegularBookingService.ts#L2548-L2596

### 5.2 Connect口座での課金

`packages/app-store/stripepayment/lib/PaymentService.ts` で、保存済みキー

- `stripe_user_id`
- `stripe_publishable_key`
- `default_currency`

を読み、Stripe API呼び出し時に毎回 `stripeAccount: stripe_user_id` を指定します。

具体的には以下すべてでConnect口座コンテキストを使います。

- `paymentIntents.create`（即時課金）
- `setupIntents.create`（HOLD）
- `paymentMethods.retrieve` / `paymentIntents.create`（後日徴収）
- `refunds.create`
- `checkout.sessions.list/expire`、`paymentIntents.cancel`

さらに `Payment.data` に `stripe_publishable_key` と `stripeAccount` を保存しているため、後段処理（返金や削除）でも正しい口座を再現できます。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/stripepayment/lib/PaymentService.ts#L60-L146

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/stripepayment/lib/PaymentService.ts#L148-L330

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/stripepayment/lib/PaymentService.ts#L336-L438

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/stripepayment/lib/customer.ts#L83-L109

## 6. フロント決済画面とWebhook

### 6.1 フロント

決済画面 (`Payment.tsx`) は `payment.data.stripe_publishable_key` を `loadStripe()` に渡して Stripe Elements を初期化します。

そのため、接続先アカウントに紐づく公開鍵での決済UIが構成されます。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/features/ee/payments/components/Payment.tsx#L171-L261

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/stripepayment/lib/client/getStripe.ts#L12-L21

### 6.2 Webhook

Webhookエンドポイントは `/api/integrations/stripepayment/webhook` で、実体は `@calcom/features/ee/payments/api/webhook` です。

このWebhookでは:

- `stripe-signature` を検証
- `payment_intent.succeeded` / `setup_intent.succeeded` を処理
- Payment成功反映と予約確定（必要に応じてカレンダー作成・通知）

を行います。

また `event.account` の有無を見て、connected accountイベントのみ実質処理する分岐があります（E2E除く）。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/apps/web/pages/api/integrations/stripepayment/webhook.ts#L1-L7

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/features/ee/payments/api/webhook.ts#L39-L248

## 7. 旧App Store導線との関係

`stripepayment` 側には旧来のOAuth導線も残っています。

- `/api/integrations/stripepayment/add` でConnect URL生成
- `/api/integrations/stripepayment/callback` でtoken交換・Credential作成

ここで使われる `decodeOAuthState` は、`stripe` を nonce検証免除アプリとして扱っています。

また旧導線の `createOAuthAppCredential` は基本 `credential.create` なので、v2のような「既存削除→再作成」とは挙動が異なります。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/stripepayment/api/add.ts#L26-L50

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/stripepayment/api/callback.ts#L11-L46

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/_utils/oauth/createOAuthAppCredential.ts#L18-L52

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/app-store/_utils/oauth/decodeOAuthState.ts#L6-L16

## 8. 「Connect」と「組織課金」は別系統

同じStripeでも、組織サブスク課金（例: Organization onboarding）は `StripeBillingService` を使う別系統です。

この系統の `createSubscriptionCheckout` / `createPaymentIntent` には `stripeAccount` 指定がなく、platform側アカウントでのSaaS課金として扱われます。

つまりcal.com内には:

- Marketplace/Host向け: Stripe Connect（`stripe_payment` Credential）
- cal.com自体の課金: Platform Stripe Billing

の二本立てがある、という理解が実装上正しいです。

対応実装:

https://github.com/calcom/cal.com/blob/5d65a0f09199abeab9729d2665e9bed399692f55/packages/features/ee/billing/service/billingProvider/StripeBillingService.ts#L23-L111

## 9. 実装上の観察ポイント

コードを追って見えた、実運用で効くポイントです。

- 接続確認で `charges_enabled` / `payouts_enabled` まで見る設計は堅い
- 決済API呼び出しで `stripeAccount` を一貫して付ける実装はConnect事故を減らせる
- v2のteam callbackをproxyにしてガードを通す設計は、権限漏れ防止として妥当
- 逆に、v2 `state` に `accessToken` を持たせる方式はURLログ流出面の注意が必要（HTTPS前提でも、ログ取り扱いポリシーは要確認）
