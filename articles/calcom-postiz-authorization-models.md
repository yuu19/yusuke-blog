---
title: 'RBAC / ABAC / PBAC から読む SaaS認可設計: Cal.com と Postiz の比較'
description: 'RBAC・ABAC・PBAC の違いを整理したうえで、Cal.com と Postiz の認可設計と実装を比較し、SaaS での実践パターンを解説します。'
emoji: '🔐'
category: 'tech'
date: 2026-03-09
topics: ["authorization", "rbac", "abac", "pbac", "cal.com", "postiz-app", "saas"]
blog_published: true
published: false
---

SaaS の認可は、画面を隠すだけの話ではありません。組織、チーム、料金プラン、使用量、操作主体、対象リソースが増えるほど、認可は `if (role === "admin")` では支えきれなくなります。

この記事では、まず `RBAC -> ABAC -> PBAC` の順に概念を整理し、そのうえで `calcom/cal.com` と `gitroomhq/postiz-app` の実装を比較します。Cal.com は permission registry を中心にした明示的な PBAC、Postiz は RBAC を残しつつ policy guard と subscription entitlement を重ねたハイブリッド実装として読むと理解しやすいです。

## 結論（先に要点）

1. `RBAC` は最初の一歩として強いですが、SaaS の組織権限や課金制約まで扱い始めると表現力が足りなくなりやすいです。
2. `ABAC` は文脈依存の判定に強い一方で、permission 一覧が見えにくく、監査や UI 制御の基準が散らばりやすいです。
3. `PBAC` は permission を先に列挙し、条件評価を後段に寄せるので、実装者にとって「何ができるか」の見通しを持ちやすいです。
4. Cal.com は `organization.*` や `team.*` を明示した permission registry を持ち、fallback role と handler 側チェックを組み合わせる PBAC 寄りの設計です。
5. Postiz は role を残しながら、CASL ベースの ability とプラン制約を `Sections` 単位で判定しており、PBAC 単体というより pragmatic hybrid と見る方が実装に忠実です。

## 1. なぜ SaaS の認可は複雑になるのか

SaaS では、認証より認可の方が長く難しくなりがちです。理由は単純で、「誰か」だけでなく「どの組織の誰が」「どの機能に」「どの条件で」アクセスできるかを同時に表現しなければならないからです。

典型的には次の軸が増えます。

- 所属: 個人、組織、サブチーム
- 役割: owner、admin、member
- 対象: organization、team、billing、members、webhooks
- 条件: private org か、公開 team か、本人か、所属中か
- 商品制約: free/pro/enterprise、席数、チャンネル数、月次利用量

この複雑さに対して、認可モデルはだいたい `RBAC -> ABAC -> PBAC` の順で洗練されていきます。

## 2. RBAC -> ABAC -> PBAC

### 2.1 RBAC

`RBAC` は Role-Based Access Control です。ユーザーに role を割り当て、その role ごとに操作可否を決めます。

たとえば次のような形です。

- `OWNER` は請求情報を変更できる
- `ADMIN` はメンバー招待できる
- `MEMBER` は閲覧のみ

RBAC の利点は明快さです。実装も説明もしやすく、最初のプロダクトにはよく合います。

一方で、SaaS ではすぐに次の問題が出ます。

- `ADMIN` でも private organization ではメンバー一覧を見せたくない
- `MEMBER` でも public organization では一覧閲覧だけ許したい
- `ADMIN` でも free plan では webhook を作らせたくない
- `OWNER` でも別組織の team は触らせたくない

role だけで全部を表そうとすると、role の種類が膨らむか、結局コードの各所に例外条件が散ります。

### 2.2 ABAC

`ABAC` は Attribute-Based Access Control です。role ではなく、属性の組み合わせで判定します。

属性には次のようなものが入ります。

- user attribute: `isSuperAdmin`, `department`, `tenantId`
- resource attribute: `ownerId`, `teamPrivacy`, `organizationId`
- environment attribute: request origin、時間帯、課金状態

たとえば `user.organizationId === resource.organizationId && resource.teamPrivacy === "public"` のように書けます。RBAC より表現力は高く、現実の文脈をそのまま条件に落とせます。

ただし ABAC だけで組むと、「何の permission が存在するか」が見えづらくなります。条件式は書けても、次が弱くなりがちです。

- 権限一覧の可視化
- 管理画面での権限定義
- UI 側のボタン表示判定
- 監査やレビュー時の説明可能性

つまり ABAC は条件を表すには強いが、permission catalog を作るには弱いことがあります。

### 2.3 PBAC

`PBAC` は Policy-Based Access Control と呼ばれることが多いですが、実装者の感覚では「permission を明示的に定義し、その評価を policy として実行する設計」と読むと分かりやすいです。

RBAC が `role` を中核に置き、ABAC が `attribute` を中核に置くのに対し、PBAC はまず permission を名前付きで列挙します。

たとえば次のような粒度です。

- `organization.listMembers`
- `organization.invite`
- `organization.manageBilling`
- `team.create`
- `team.delete`

この形にすると、permission 一覧が先に立ちます。そのうえで実際の判定に role や attribute を使えます。つまり PBAC は、実務上は `permission catalog + role/attribute based evaluation` として実装されることが多いです。

### 2.4 SaaS 実装者の観点で見る違い

3 つを SaaS 実装の観点で並べると、だいたい次の違いになります。

| 観点 | RBAC | ABAC | PBAC |
| --- | --- | --- | --- |
| 主語 | role | attribute | permission / policy |
| 強み | 単純で導入しやすい | 文脈条件に強い | 一覧性と拡張性が高い |
| 弱み | 例外条件が増える | 権限一覧が見えにくい | 初期設計コストが上がる |
| SaaS 向きの使い方 | 初期段階 | 条件評価層 | 中規模以降の中核 |

重要なのは、現実のシステムは純粋な 1 方式ではなく混ざることです。RBAC を残しつつ PBAC を足す、PBAC の中で ABAC 的条件を使う、という形がむしろ普通です。

## 3. Cal.com の認可設計

調査対象コミット（2026-03-09 時点）:
`7801266dbe9252c262e82d373759ce20b307773a`

### 3.1 Cal.com をどう位置づけるか

Cal.com の Organization まわりは、PBAC をかなり明示的に採っています。中心にあるのは permission registry です。

ここでは `organization.*` や `team.*` のような permission namespace が先に定義され、画面側と handler 側がその permission を読んで判定します。ただし完全に permission のみで閉じているわけではなく、`OWNER / ADMIN / MEMBER` の fallback role も併用しています。

つまり Cal.com は次の設計です。

- permission を先に定義する
- 画面表示や API 実行時にその permission を解決する
- PBAC 未設定時や互換性のために fallback role を持つ
- private/public などの属性条件を permission 可視条件や handler で吸収する

この構成は、PBAC を中核にしつつ、既存 RBAC を壊さずに移行している設計として読みやすいです。

### 3.2 実装マップ

- [`packages/features/pbac/domain/types/permission-registry.ts`](https://github.com/calcom/cal.com/blob/7801266dbe9252c262e82d373759ce20b307773a/packages/features/pbac/domain/types/permission-registry.ts)
- [`apps/web/modules/members/getOrgMembersPageData.ts`](https://github.com/calcom/cal.com/blob/7801266dbe9252c262e82d373759ce20b307773a/apps/web/modules/members/getOrgMembersPageData.ts)
- [`packages/trpc/server/routers/viewer/organizations/createTeams.handler.ts`](https://github.com/calcom/cal.com/blob/7801266dbe9252c262e82d373759ce20b307773a/packages/trpc/server/routers/viewer/organizations/createTeams.handler.ts)
- [`packages/trpc/server/routers/viewer/organizations/deleteTeam.handler.ts`](https://github.com/calcom/cal.com/blob/7801266dbe9252c262e82d373759ce20b307773a/packages/trpc/server/routers/viewer/organizations/deleteTeam.handler.ts)

### 3.3 permission registry が認可の中心にある

`permission-registry.ts` では、Organization という resource に対して permission が列挙されています。たとえば次のようなものです。

- `organization.read`
- `organization.listMembers`
- `organization.invite`
- `organization.remove`
- `organization.changeMemberRole`
- `organization.manageBilling`
- `organization.impersonate`
- `organization.passwordReset`

ここで重要なのは、permission が単なる文字列ではなく、依存関係や可視条件も持っていることです。たとえば `organization.invite` が `organization.listMembers` に依存したり、`ListMembers` と `ListMembersPrivate` を `teamPrivacy` で分けたりしています。

これは ABAC 的な条件を PBAC の registry の中に取り込んでいる実装です。permission を軸に置きつつ、属性条件を後付けで評価できる形になっています。

### 3.4 画面側でも permission を解決する

`getOrgMembersPageData.ts` では、メンバー画面に必要な permission をまとめて取得しています。ここでは `getSpecificPermissions(...)` を使い、`Resource.Organization` に対して次の操作可否を一括で解決します。

- `ListMembers`
- `Invite`
- `ChangeMemberRole`
- `Remove`
- `Impersonate`
- `PasswordReset`

さらに `fallbackRoles` を渡し、PBAC の定義がなくても `OWNER / ADMIN / MEMBER` で最低限の互換挙動を保っています。たとえば public organization なら `MEMBER` にも一覧閲覧を許し、private organization では `ADMIN / OWNER` へ寄せる形です。

ここで見えてくるのは、Cal.com が「画面表示の permission 判定」と「API 実行の permission 判定」を同じ vocabulary で揃えようとしていることです。PBAC の利点である一覧性が UI にも効いています。

### 3.5 handler 側でも再度 permission をチェックする

Cal.com が堅いのは、registry があるだけで終わらない点です。`createTeams.handler.ts` と `deleteTeam.handler.ts` では、実際の変更処理の前に `PermissionCheckService` を使って `team.create` や `team.delete` を明示的に確認しています。

`createTeams.handler.ts` では次を見ています。

- 実行ユーザーが対象 organization の owner 文脈にいるか
- `team.create` を持つか
- fallback role として `OWNER / ADMIN` を許すか

`deleteTeam.handler.ts` ではさらに、対象 team が `parentId` を持つ、つまり organization 配下の team であることを確認したうえで `team.delete` をチェックしています。

この二重化により、Cal.com の認可は次の形になります。

- permission registry で「何ができるか」を定義する
- 画面で「何を見せるか」を定義する
- handler で「本当に実行してよいか」を再検証する

PBAC をプロダクト全体へ浸透させる場合の、かなり素直な作りです。

### 3.6 Cal.com から学べること

Cal.com の設計は、B2B SaaS で「操作の種類が増える」「組織管理が複雑になる」「後から権限 UI を作りたい」という状況に向いています。

特に強いのは次です。

- permission 一覧が見える
- role と permission を段階的に共存させられる
- UI と API の両方で同じ permission vocabulary を使える

反面、permission registry を育てるコストはかかります。機能追加時に「どの permission 名を新設するか」を毎回考える必要があります。

## 4. Postiz の認可設計

調査対象コミット（2026-03-09 時点）:
`f624321b4337d3160ebb312e4d2a346e975d6bac`

### 4.1 Postiz をどう位置づけるか

Postiz は Cal.com ほど明示的な permission registry 中心ではありません。代わりに、次の要素を重ねています。

- request に `user` と `organization` を載せる middleware
- controller のメソッドに付く `@CheckPolicies(...)`
- CASL の ability を返す `PermissionsService`
- `ADMIN / SUPERADMIN` や `isSuperAdmin` による role 分岐
- subscription tier や usage limit による entitlement 判定

これは明示的 PBAC 単体より、`RBAC + policy guard + product entitlement` のハイブリッドです。実装上の主語は `organization.invite` のような細かい business permission ではなく、`Sections.ADMIN` や `Sections.WEBHOOKS` のような機能セクションです。

### 4.2 実装マップ

- [`apps/backend/src/services/auth/auth.middleware.ts`](https://github.com/gitroomhq/postiz-app/blob/f624321b4337d3160ebb312e4d2a346e975d6bac/apps/backend/src/services/auth/auth.middleware.ts)
- [`apps/backend/src/services/auth/permissions/permissions.ability.ts`](https://github.com/gitroomhq/postiz-app/blob/f624321b4337d3160ebb312e4d2a346e975d6bac/apps/backend/src/services/auth/permissions/permissions.ability.ts)
- [`apps/backend/src/services/auth/permissions/permissions.guard.ts`](https://github.com/gitroomhq/postiz-app/blob/f624321b4337d3160ebb312e4d2a346e975d6bac/apps/backend/src/services/auth/permissions/permissions.guard.ts)
- [`apps/backend/src/services/auth/permissions/permissions.service.ts`](https://github.com/gitroomhq/postiz-app/blob/f624321b4337d3160ebb312e4d2a346e975d6bac/apps/backend/src/services/auth/permissions/permissions.service.ts)
- [`apps/backend/src/services/auth/permissions/permission.exception.class.ts`](https://github.com/gitroomhq/postiz-app/blob/f624321b4337d3160ebb312e4d2a346e975d6bac/apps/backend/src/services/auth/permissions/permission.exception.class.ts)
- [`apps/backend/src/api/routes/users.controller.ts`](https://github.com/gitroomhq/postiz-app/blob/f624321b4337d3160ebb312e4d2a346e975d6bac/apps/backend/src/api/routes/users.controller.ts)
- [`apps/backend/src/api/api.module.ts`](https://github.com/gitroomhq/postiz-app/blob/f624321b4337d3160ebb312e4d2a346e975d6bac/apps/backend/src/api/api.module.ts)

### 4.3 まず middleware で認可文脈を作る

`auth.middleware.ts` は JWT と cookie/header を読み、`req.user` と `req.org` を組み立てます。ここで organization の選択も行い、`showorg` がなければ先頭 organization を採用します。

この設計の意味は大きいです。Postiz では認可判定の前に、リクエストがどの organization 文脈で動くかを確定させています。つまり認可は controller の中だけではなく、request context の構築から始まっています。

`api.module.ts` ではこの middleware を authenticated controller 群へまとめて適用しているので、後続の guard や controller は `req.org` を前提にできます。

### 4.4 policy metadata と guard で止める

Postiz の policy 宣言は `permissions.ability.ts` の `@CheckPolicies(...)` です。controller のメソッドでは、たとえば次のように書きます。

- API key rotation は `Sections.ADMIN`
- subscription 取得も `Sections.ADMIN`
- webhook 作成は `Sections.WEBHOOKS`
- post 作成は `Sections.POSTS_PER_MONTH`
- integration 追加は `Sections.CHANNEL`

`permissions.guard.ts` はこの metadata を `Reflector` で読み、`PermissionsService.check(...)` から CASL `Ability` を作って `ability.can(...)` を評価します。失敗時には `SubscriptionException` を投げ、HTTP 402 相当の `PAYMENT_REQUIRED` に寄せています。

ここが Postiz らしいところです。認可エラーが単なる forbidden ではなく、「プラン上その機能は使えない」という product gating と一体化しています。

### 4.5 PermissionsService は role と課金制約をまとめて判定する

`permissions.service.ts` では、`Sections` ごとに ability を許可するかを決めています。ここで見ている条件は多層です。

- role: `ADMIN` / `SUPERADMIN`
- subscription tier: free / paid
- usage count: channel 数、webhook 数、月次投稿数
- feature flag 的な package options: AI、community features、import

たとえば次のような判定があります。

- `Sections.CHANNEL` は現在の integration 数と契約上限を比較する
- `Sections.WEBHOOKS` は webhook 総数とプラン上限を比較する
- `Sections.POSTS_PER_MONTH` は当月投稿数とプラン上限を比較する
- `Sections.ADMIN` は role が `ADMIN` または `SUPERADMIN` のときだけ許す

この形は ABAC 的でもあります。role だけでなく、organization の subscription や usage count という属性で可否が変わるからです。ただし permission 名の粒度は Cal.com より粗く、機能セクション中心です。

### 4.6 role 分岐も残っているので PBAC 単体ではない

Postiz は policy guard を使っていますが、role 判定が guard に完全統合されているわけではありません。`users.controller.ts` では `user.isSuperAdmin` を直接見て impersonation を制御しており、レスポンス組み立てでも `organization.users[0].role` を読んで `publicApi` を返すかどうかを決めています。

つまり Postiz の実装は、次の 3 層が共存しています。

- role branch: `isSuperAdmin`, `ADMIN`, `SUPERADMIN`
- policy branch: `@CheckPolicies(...)` + `PoliciesGuard`
- entitlement branch: tier と usage count による可否

このため、Postiz を「PBAC の一種」と広く呼ぶことはできますが、実装を正確に言うなら hybrid の方が近いです。

### 4.7 Postiz から学べること

Postiz の設計は、「機能アクセス」と「料金プラン制約」が密接に結びついた SaaS に向いています。認可を product packaging の一部として扱っているからです。

特に強いのは次です。

- 課金制約を backend guard に直接入れられる
- controller 側は `@CheckPolicies(...)` で必要機能を宣言できる
- organization context を middleware で統一できる

一方で、permission catalog としての一覧性は Cal.com より弱めです。どの操作が許可されるかは、`Sections` と service 内条件を合わせて読まないと全体像が見えません。

## 5. Cal.com -> Postiz 比較

両者を並べると、認可の中心思想がかなり違います。

| 観点 | Cal.com | Postiz |
| --- | --- | --- |
| 中心モデル | 明示的 PBAC | ハイブリッド |
| 主語 | `organization.*`, `team.*` | `Sections.ADMIN`, `Sections.WEBHOOKS` など |
| 条件の置き場 | registry の依存関係、画面側、handler 側 | middleware、guard、ability service、role 分岐 |
| role の扱い | fallback role として併用 | 今も重要な一次判定として残る |
| 課金制約との接続 | 間接的 | かなり直接的 |
| 強み | 一覧性、拡張性、監査しやすさ | 商品制約との一体化、実装の速さ |
| 弱み | 初期設計コスト | 全体像の把握がやや難しい |

設計上の違いを一言でまとめるとこうなります。

- Cal.com は「permission vocabulary を先に作る」
- Postiz は「product feature gate を先に作る」

この違いが、そのまま認可実装の読みやすさに出ています。Cal.com は「この操作にはどの permission が必要か」を追いやすく、Postiz は「この機能はどのプランで開くか」を追いやすいです。

## 6. SaaS での選び方

実務では、最初から純粋な ABAC や完全な PBAC を目指す必要はありません。段階で選ぶのが現実的です。

### 6.1 小規模なら RBAC でよい

次の条件なら RBAC で十分なことが多いです。

- role が 2 から 3 種類しかない
- 課金制約が少ない
- organization / sub-team の階層が浅い
- UI ごとの差分制御がまだ少ない

### 6.2 中規模以降は PBAC か hybrid が必要になる

次のどれかが出たら、RBAC 単独は苦しくなります。

- `invite`, `remove`, `billing`, `impersonate` のように操作が増える
- public/private、owner/member など文脈差が増える
- 料金プランや使用量で解放機能が変わる
- API と UI の両方で同じ権限語彙を使いたい

この段階では、Cal.com のように PBAC へ寄せるか、Postiz のように hybrid へ寄せるかを選ぶことになります。

### 6.3 ABAC は単独採用より条件層として使うと強い

ABAC は単独理論としては強いですが、実装では「PBAC や hybrid の中で条件評価として使う」方が扱いやすいです。

たとえば次のような使い方です。

- `organization.listMembers` という permission は PBAC で定義する
- `teamPrivacy === "private"` や `subscription.tier === "PRO"` は ABAC 的条件として評価する

この分け方にすると、permission の一覧性と属性条件の柔軟性を両立しやすくなります。

## まとめ

SaaS の認可モデルは、RBAC、ABAC、PBAC の三択ではなく、何を中心語彙に置くかの選択です。

- role を中心に置くなら RBAC
- 条件式を中心に置くなら ABAC
- permission catalog を中心に置くなら PBAC

Cal.com は permission catalog を明示的に持つことで、組織管理の複雑さに耐える設計を作っています。Postiz は product entitlement を認可に深く埋め込むことで、料金プランと機能解放を一体で運用しています。

SaaS を作る側としては、まず RBAC で始めて、操作面が複雑になったら PBAC へ、料金や使用量の制約が強くなったら hybrid へ進む、という順で考えるのが実践的です。ABAC はそのどちらでも、条件評価の層として活きます。
