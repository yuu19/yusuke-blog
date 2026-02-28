---
title: 'Cloudflare Miniflareの仕組みを分解して理解する'
description: 'Miniflareが何をエミュレートし、wrangler devやVite開発時にどのようにWorker実行・バインディング接続・ローカル永続化を実現しているかを体系的に解説します。'
emoji: '🔥'
date: 2026-02-28
topics: ["cloudflare", "workers", "miniflare", "wrangler", "workerd"]
blog_published: True
published: False
---

## はじめに

Cloudflare Workers のローカル開発をしていると、`wrangler dev` の裏側で自然に動いているのが Miniflare です。

しかし実務では、次のような疑問にぶつかります。

- ローカルで動いているのに、本番に近い挙動と言えるのはなぜか
- KV / D1 / R2 / Durable Objects はどこまで再現されるのか
- `--remote` や `remote: true` を付けると何が切り替わるのか
- ローカルデータはどこに保存され、いつ消えるのか

この記事では Miniflare を「開発サーバーの黒魔術」ではなく、**実行モデルとして分解**して理解します。

---

## 1. Miniflare の位置づけ

まず前提として、Cloudflare公式ドキュメントでは次の関係が明示されています。

- `wrangler dev` / Cloudflare Vite plugin のローカル開発は Miniflare を利用
- Miniflare は Workers ランタイム API を再現するシミュレーター
- 実行基盤として `workerd` を利用

つまり Miniflare は、単なるモック集ではなく、**Worker 実行 + 各種バインディング接続をローカル開発向けに束ねるオーケストレーター**です。

---

## 2. 全体アーキテクチャ（3層）

ローカル開発時の構造は、実務上ほぼ次の3層で理解できます。

1. **開発フロント層（Wrangler / Vite）**
2. **開発オーケストレーション層（Miniflare）**
3. **実行ランタイム層（workerd）**

### 2.1 開発フロント層

ここは開発者が触る入口です。

- `wrangler dev`
- `vite dev`（Cloudflare Vite plugin 使用時）

この層の役割は、設定読み込み、ファイル監視、再ビルド、起動ログ表示、ポート管理です。

### 2.2 開発オーケストレーション層（Miniflare）

Miniflare は次を担当します。

- Workerスクリプトを `workerd` に渡して起動
- `env` の binding を「ローカル再現」または「リモート接続」に割り当て
- ローカルストレージの保存先（`.wrangler/state` など）を管理
- 開発セッション中の再起動や状態引き継ぎを調停

### 2.3 実行ランタイム層（workerd）

実際に `fetch(request, env, ctx)` が動く場所です。

- `Request` / `Response`
- Cache API
- Streams
- Web Crypto
- Durable Object ハンドラ

この層を使うことで、Node の独自HTTPサーバー上で擬似的に動かすより、本番に近いランタイム差分で検証できます。

---

## 3. リクエストが処理される流れ

`wrangler dev` 実行中に HTTP リクエストが来たときの流れを整理すると次の通りです。

1. 開発サーバーが受信
2. Miniflare が現在の Worker 定義と binding 設定を解決
3. `workerd` 内の Worker エントリポイントへリクエストを渡す
4. Worker から `env.X` が呼ばれるたび、Miniflare が binding の接続先を振り分け
5. レスポンスを返却

ポイントは、**Workerコードの実行場所（ローカル）**と、**bindingの接続先（ローカル or リモート）**が分離されていることです。

---

## 4. ローカル再現とリモート接続（remote bindings）

Cloudflare の開発ドキュメントでは、開発時に重要な概念として次を分離しています。

- Worker execution: コードがどこで実行されるか
- Bindings: どのリソースに接続するか

### 4.1 デフォルト（ローカル開発）

デフォルトでは:

- Worker コードはローカル実行
- binding はローカルシミュレーション

このため本番データを汚さずに反復開発できます。

### 4.2 `remote: true` を使うケース

特定 binding だけ本物のリソースにつなぎたい場合、設定で `remote: true` を使います。

代表例:

- R2 の実データで検証したい
- D1 のステージングDBでクエリ互換性を確認したい
- AI / Vectorize のようにローカル完全再現が難しい機能を使いたい

このときでも **Worker実行自体はローカル**で、binding 呼び出しだけがリモートにプロキシされます。

---

## 5. 永続化: `.wrangler/state` と `--persist-to`

ローカル binding のデータ保存先は、通常 `.wrangler/state` です。

- KV
- R2
- D1
- Durable Objects

などのローカル状態がここに保存されます。

### 5.1 なぜ重要か

状態の保存先を理解していないと、次が起きます。

- 「再起動したらデータが消えた」
- 「CLIで投入したデータが見えない」
- 「別プロジェクトの状態と混線した」

### 5.2 `--persist-to` の運用

`wrangler dev --persist-to <dir>` を使うと保存先を固定できます。

チーム開発では、用途別にディレクトリを分けると再現性が上がります。

- `state/dev-local`
- `state/e2e-seed`
- `state/benchmark`

---

## 6. Durable Objects のローカル開発で誤解しやすい点

Durable Objects は KV / D1 / R2 と違い、**CLIから直接初期データ投入する一般コマンドがありません**。

つまり、ローカル開発で DO 状態を作るには次の設計が必要です。

- 開発用エンドポイントを用意して DO に初期化メッセージを送る
- テストコードから Stub を叩いて状態を準備する

また、DO の挙動確認では次を必ず分けて考えるべきです。

- オブジェクト単位の直列化特性
- storage アクセスの有無で変わる整合性の境界
- alarm の再現（ローカルでのタイミング差を許容）

---

## 7. `wrangler dev` の3モードで整理すると迷わない

実務では次の3つを使い分けると判断が速くなります。

### 7.1 ローカル完全モード

- Worker: ローカル
- Bindings: ローカル

用途: 早い試作、破壊的テスト、ローカル再現性優先

### 7.2 リモートプレビュー（`--remote`）

- Worker: Cloudflare側
- Bindings: Cloudflare側

用途: 本番に近い動作確認、ただし実リソース影響と課金に注意

### 7.3 混在モード（remote bindings）

- Worker: ローカル
- Bindings: 一部だけリモート

用途: 開発速度を維持しつつ、特定機能だけ高忠実度検証

---

## 8. Miniflare APIを直接使う場面

通常開発は `wrangler dev` で十分ですが、次のような高度なテストでは Miniflare API が有効です。

- HTTP経由せずイベントを直接投入したい
- 複数 Worker 間の service binding を一つのテストで検証したい
- 外部テストランナーから細かく制御したい

一方で Cloudflare は一般的な Workers テスト手段として Vitest integration も推奨しており、用途に応じて使い分けるのが現実的です。

---

## 9. 仕組みから逆算した運用ベストプラクティス

Miniflare を理解した上での実践ルールをまとめます。

1. **実行場所と接続先を常に分けて記録する**
2. **ローカル state ディレクトリを明示し、`.gitignore` に含める**
3. **remote binding は最小限にし、対象を明記する**
4. **DO は初期化APIやテストヘルパーを先に作る**
5. **最終確認は `--remote` か staging deploy で行う**

---

## 10. まとめ

Miniflare の本質は、次の一文で表せます。

**「Worker 実行と binding 接続を分離し、開発中に必要な忠実度を段階的に選べるローカル実行基盤」**

この視点を持つと、`wrangler dev` の挙動が読み解きやすくなり、

- どこまでローカルで検証すべきか
- どこから remote / staging に切り替えるべきか

の判断が速くなります。

---

## 参考リンク

- [Cloudflare Docs: Development & testing](https://developers.cloudflare.com/workers/development-testing/)
- [Cloudflare Docs: Miniflare](https://developers.cloudflare.com/workers/testing/miniflare/)
- [Cloudflare Docs: Adding local data](https://developers.cloudflare.com/workers/development-testing/local-data/)
- [Cloudflare Docs: Supported bindings per development mode](https://developers.cloudflare.com/workers/development-testing/bindings-per-env/)
- [Cloudflare Docs: Durable Objects (known issues)](https://developers.cloudflare.com/durable-objects/platform/known-issues/)
