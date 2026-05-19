---
title: 'Better Auth / Cal.com / Postiz で比較する Stripe subscription status の扱い'
description: 'Better Auth の Stripe plugin、Cal.com、Postiz の公開実装をもとに、subscription status をそのまま保存する設計と、ドメイン状態へ潰す設計の違いを整理します。'
emoji: '🧾'
type: 'tech'
date: 2026-03-30
topics: ["better-auth", "cal.com", "postiz-app", "stripe", "subscription", "saas"]
blog_published: true
published: false
---

Stripe Billing を触っていると、最初に迷いやすいのが `subscription.status` をどう扱うかです。

Stripe 自体は `active` / `trialing` / `past_due` / `canceled` / `unpaid` など細かい状態を返しますが、アプリ側はそれをそのまま保持するとは限りません。  
実務では次の 3 パターンに分かれます。

1. Stripe の status をほぼそのまま保存する
2. status は保存するが、業務判定では別の派生状態を使う
3. raw status は捨てて、自前の entitlement 状態へ潰す

この記事では、2026-03-30 時点の公開実装をもとに、次の 3 つを比較します。

- Better Auth の `@better-auth/stripe`
- `calcom/cal.com`
- `gitroomhq/postiz-app`

結論だけ先に言うと、Better Auth は 1 に近く、Cal.com は 2、Postiz は 3 にかなり近いです。

## 結論

まず要点をまとめます。

1. Better Auth は Stripe の status を DB に保持し、`active` / `trialing` だけを「使える subscription」として扱います。
2. Cal.com は raw な Stripe status をアプリの公開状態にしません。`valid / no_subscription / no_billing` と `overdue` に寄せています。
3. Postiz はさらに単純化していて、raw status を保持せず、プラン・解約予定日・組織の `isTrailing` に畳み込みます。
4. つまり 3 者の違いは「状態を細かく残すか」よりも、「何を業務判断の主語にするか」です。
5. 課金不整合や将来の要件追加に備えるなら、raw status を保持しつつ、画面や権限制御は派生状態で見る設計が一番伸びやすいです。

## 1. Stripe 側の status をどう読むべきか

Stripe の `subscription.status` は、単に「有効か無効か」だけではありません。ざっくり分けると、実務では次の見方になります。

| status | 実務での見方 |
| --- | --- |
| `active` | 通常の有効契約 |
| `trialing` | 試用中。機能を開けることが多い |
| `past_due` | 支払い失敗後の猶予中 |
| `incomplete` | 初回支払い未完了 |
| `incomplete_expired` | 初回支払い失敗が失効した |
| `canceled` | 解約済み |
| `unpaid` | 未回収で停止寄り |
| `paused` | 明示的に停止 |

重要なのは、これらをそのまま画面の `status` として見せる必要はない一方で、バックエンド内部では失わない方が安全なことです。  
特に `trialing` と `past_due` は、どちらも「完全な active ではない」ですが、意味はかなり違います。

## 2. Better Auth は Stripe の状態をかなり忠実に保存する

Better Auth の `@better-auth/stripe` は、3 つの比較対象の中で最も Stripe 寄りです。

まず schema 上、`subscription.status` は plugin のテーブルにそのまま保存され、初期値は `incomplete` です。  
型定義でも `active` / `canceled` / `incomplete` / `incomplete_expired` / `past_due` / `paused` / `trialing` / `unpaid` を明示的に許可しています。

参照:

- https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/schema.ts
- https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/types.ts

さらに webhook 処理を見ると、`customer.subscription.created` と `customer.subscription.updated` では Stripe の `status` を DB に書き戻し、`customer.subscription.deleted` では明示的に `canceled` へ更新しています。  
つまり Better Auth は「Stripe から来た状態を、まず失わず保持する」方針です。

参照:

- https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/hooks.ts
- https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/routes.ts

ただし、業務判定では全部を同列には扱っていません。  
`utils.ts` の `isActiveOrTrialing(...)` は `active` または `trialing` だけを有効扱いにしています。`list` API もこの条件で絞り込みます。

この設計から分かるのは次です。

- 保存層: raw status を保持する
- 業務層: `active || trialing` だけを利用可能とみなす
- それ以外: `past_due` や `unpaid` は DB には残すが、通常の有効 subscription とはみなさない

また organization 連携では、組織削除前に Stripe の subscription を `status: "all"` で列挙し、`canceled` / `incomplete` / `incomplete_expired` 以外が残っていれば削除を拒否します。  
ここでは `past_due` や `paused` も「まだ終わっていない契約」として扱っています。

参照:

- https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/index.ts
- https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/utils.ts

Better Auth の考え方はかなり素直です。  
「status は Stripe に合わせて保持し、アプリの可用判定は `active/trialing` に寄せる」という 2 段構成になっています。

## 3. Cal.com は raw status より billing validity を前面に出す

Cal.com の platform billing は、Better Auth ほど raw status を前面に出しません。

API v2 の billing service を見ると、外に返す billing 状態は `valid` / `no_subscription` / `no_billing` の 3 値です。  
ここでは Stripe の `past_due` や `trialing` はそのまま公開されません。

参照:

- https://github.com/calcom/cal.com/blob/main/apps/api/v2/src/modules/billing/interfaces/billing-service.interface.ts
- https://github.com/calcom/cal.com/blob/main/apps/api/v2/src/modules/billing/services/billing.service.ts

`getBillingData(teamId)` は、`platformBilling.subscriptionId` があれば `valid` を返します。  
つまり利用可否の表現としては、「Stripe subscription の細かい状態」ではなく「この team に billing relation が存在するか」を主語にしています。

一方で、支払い遅延は別軸で見ています。

- `invoice.payment_failed` で `overdue = true`
- `invoice.payment_succeeded` で `overdue = false`
- `customer.subscription.updated` も `handleStripePaymentPastDue(...)` に流していますが、2026-03-30 時点の main ブランチ実装は `event.data.object` を `Invoice` として扱っており、`subscriptionId` 抽出が成立しない可能性があります
- `customer.subscription.deleted` では billing relation 自体を削除

つまり Cal.com は設計意図としてはこうです。

- 契約の有無: `platformBilling` と `subscriptionId` の存在で見る
- 請求トラブル: 主に invoice 系イベントから `overdue` で見る
- Stripe status: 内部イベント処理の材料として使う

この設計の利点は、プロダクト側の分岐がかなり単純になることです。  
「契約しているか」「支払い遅延か」の 2 軸で多くの画面制御ができます。

ただし副作用もあります。  
`paused` や `unpaid` のような Stripe の細かい差分は、Cal.com の billing API 表現には直接は出てきません。  
raw status を後から分析したい場合、billing domain だけでは粒度が足りなくなる可能性があります。

加えて、現在の main では `customer.subscription.updated` の `past_due` 反映コードに型の食い違いがあるため、実際の overdue 更新は `invoice.payment_failed` / `invoice.payment_succeeded` への依存度が高い読み方になります。ここは設計というより実装上の注意点です。

## 4. Postiz は raw status を捨てて entitlement 状態へ潰している

3 つの中で最も割り切っているのが Postiz です。

Webhook 入口では次だけを扱います。

- `invoice.payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

参照:

- https://github.com/gitroomhq/postiz-app/blob/main/apps/backend/src/api/routes/stripe.controller.ts

Stripe service 側で重要なのは、`createSubscription` / `updateSubscription` が `event.data.object.status !== 'active'` をそのまま `createOrUpdateSubscription(...)` の第 1 引数へ渡していることです。  
その引数名は `isTrailing` で、repository 側では organization の `isTrailing` へ保存されます。

さらに repository を見ると、保存しているのは主に次です。

- `subscriptionTier`
- `totalChannels`
- `period`
- `identifier`
- `cancelAt`
- organization 側の `isTrailing`

逆に、Stripe の raw な `subscription.status` 自体は保存していません。

参照:

- https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/services/stripe.service.ts
- https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/database/prisma/subscriptions/subscription.service.ts
- https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/database/prisma/subscriptions/subscription.repository.ts

ここから読み取れるのは、Postiz の主語が「契約状態」ではなく「今どの entitlement を開けるか」だということです。

実際、`customer.subscription.deleted` では FREE プランへ戻したうえで subscription record を削除します。  
また `setToCancel(...)` では `past_due` や `latest_invoice.status === open/uncollectible` を見て、失敗済みなら即時 cancel、そうでなければ `cancel_at_period_end` を立てています。

つまり Postiz は次のように status を潰しています。

- `active`: 通常契約
- `trialing`, `past_due`, その他 non-active: `isTrailing = true` 側へ寄せる
- `deleted`: FREE へ戻して record を消す

この設計は、SNS 投稿 SaaS としてはかなり実務的です。  
必要なのは「何チャンネル使えるか」「チーム機能を開けるか」であって、Stripe の全 status taxonomy を保存することではない、という割り切りです。

ただし設計上の代償も明確です。

- `trialing` と `past_due` が同じフラグに畳まれる
- 後から dunning 分析をしたいときに情報が足りない
- `paused` / `unpaid` の違いを UI や運用で使い分けにくい

## 5. 3 者の比較表

整理すると次のようになります。

| 観点 | Better Auth | Cal.com | Postiz |
| --- | --- | --- | --- |
| raw Stripe status を保存するか | する | 公開状態としてはほぼ使わない | しない |
| 有効契約の判定 | `active` / `trialing` | `valid` + `overdue` | プラン tier + `isTrailing` |
| `past_due` の扱い | DB に保持、通常の有効契約からは除外 | `overdue = true` へ反映 | non-active として `isTrailing = true` 側へ潰れる |
| `deleted` の扱い | status を `canceled` に更新 | billing relation を削除 | FREE に戻して subscription record を削除 |
| 設計の主語 | Stripe status | billing validity | entitlement |

## 6. どの設計を真似るべきか

個人開発や小さめの SaaS なら、Postiz 型の「必要な業務状態に潰す」設計はかなり速いです。  
一方で、請求失敗時の通知改善、解約理由分析、将来のプラン変更予約、CS 向け管理画面まで考えるなら、最初から raw status を失わない方が安全です。

その意味で、汎用的には Better Auth 型が一番再利用しやすいです。

おすすめは次の分離です。

1. 保存層では Stripe の raw status を保持する
2. 業務層では `active/trialing/overdue/canceled` のような派生状態を作る
3. 画面や認可は派生状態だけを見る

Cal.com はこの 2 にかなり近く、Postiz は 2 をさらに強くして 1 を省いた形だと読むと分かりやすいです。

## 7. 実装者向けの実践メモ

最後に、3 つの実装を見たうえでの実務メモを置いておきます。

- `trialing` と `past_due` は絶対に同一視しない
- 画面表示用 status と DB 保存用 status は分ける
- `customer.subscription.deleted` だけでなく `invoice.payment_failed` / `invoice.payment_succeeded` も運用上は重要
- 解約予定は `status` ではなく `cancel_at_period_end` / `cancel_at` / `canceled_at` で持つ
- 後から分析したくなるので、迷ったら raw status は保存しておく

## 参考リンク

- Better Auth
  - https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/schema.ts
  - https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/types.ts
  - https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/utils.ts
  - https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/hooks.ts
  - https://github.com/better-auth/better-auth/blob/main/packages/stripe/src/routes.ts
- Cal.com
  - https://github.com/calcom/cal.com/blob/main/apps/api/v2/src/modules/billing/controllers/billing.controller.ts
  - https://github.com/calcom/cal.com/blob/main/apps/api/v2/src/modules/billing/services/billing.service.ts
  - https://github.com/calcom/cal.com/blob/main/apps/api/v2/src/modules/billing/interfaces/billing-service.interface.ts
- Postiz
  - https://github.com/gitroomhq/postiz-app/blob/main/apps/backend/src/api/routes/stripe.controller.ts
  - https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/services/stripe.service.ts
  - https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/database/prisma/subscriptions/subscription.service.ts
  - https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/database/prisma/subscriptions/subscription.repository.ts
