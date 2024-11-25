---
title: 'sveltekit-lucia-starterのコードを読む'
description: ''
date: 2024-08-19
topics: ["sqlalchmy"]
blog_published: False
published: False
---

## ルーティング

### ルートのグループ分け

このアプリケーションでは
src/routers以下のフォルダについて、(loggedIn), (loggedOut), (open)/params以下に機能ごとに纏められています。

[ドキュメント](https://kit.svelte.jp/docs/advanced-routing#advanced-layouts) にあるようにディレクトリ名を()で囲んだ場合には、その部分はURL
には反映されず、ルートをグループに分けて識別しやすくためにこのような書き方が用いられます。

(loggin): ログイン関係のディレクトリ
(loggedOut): ログアウト関係のディレクトリ
(open)/params: アプリケーション関係のディレクトリ

```
├── (loggedIn)
│   ├── backup
│   │   ├── +page.server.ts
│   │   └── +page.svelte
│   ├── sse
│   │   └── [id]
│   │       ├── +page.server.ts
│   │       ├── +page.svelte
│   │       ├── getData
│   │       │   └── +server.ts
│   │       └── setData
│   │           └── +server.ts
│   ├── users
│   │   ├── +page.server.ts
│   │   ├── +page.svelte
│   │   ├── [id]
│   │   │   ├── +layout.server.ts
│   │   │   ├── +layout.svelte
│   │   │   ├── +page.server.ts
│   │   │   ├── +page.svelte
│   │   │   ├── delete
│   │   │   │   ├── +page.server.ts
│   │   │   │   └── +page.svelte
│   │   │   └── password
│   │   │       ├── +page.server.ts
│   │   │       └── +page.svelte
│   │   └── create
│   │       ├── +page.server.ts
│   │       └── +page.svelte
│   └── ws
│       └── [id]
│           ├── +page.server.ts
│           ├── +page.svelte
│           └── socket.svelte.ts
├── (loggedOut)
│   ├── firstUser
│   │   ├── +page.server.ts
│   │   └── +page.svelte
│   ├── login
│   │   ├── +page.server.ts
│   │   └── +page.svelte
│   └── signup
│       ├── +page.server.ts
│       └── +page.svelte
├── (open)
│   └── params
│       ├── +page.server.ts
│       ├── +page.svelte
│       └── searchSchema.ts
```

### 認証ガード

アプリケーション内のそれぞれのページについて、

- adminユーザーのみがアクセスできるページ

- ログイン済みであればアクセスできるページ

- ログインしていないユーザーであってもアクセスできるページ

のようにユーザーに応じてアクセスできるページを制限したい場合があります。

skGuardというライブラリを使用することで、このようなロジックを1箇所にまとめて記述することができます。(`/lib/server/authGuard/authGuardConfig.ts`)

### ページ遷移
skRoutesというライブラリを使用してzodを用いたルーティング用パラメータのバリデーションをすることができます。`routes.ts`にバリデーションのロジックを書いておいて、





## 認証関連



### セッション管理

sveltekitでは`hooks.server.js`にハンドラ関数を記述することで、ハンドラ関数内の記述に応じた処理をミドルウェアとして動作させることができます。

- `handleAuth`関数

セッションIDの有無、セッションIDが有効か否かに応じて処理を行う

- `handleRoute`関数


