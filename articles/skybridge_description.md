---
title: 'Skybridgeとは何か: ChatGPT / MCPアプリ開発フレームワーク解説'
description: 'alpic-ai/skybridge の設計思想、アーキテクチャ、主要API、運用上の注意点を一次情報ベースで解説'
emoji: '🌉'
date: 2026-02-27
topics: ["mcp", "chatgpt", "typescript", "skybridge"]
blog_published: True
published: False
---

## はじめに

この記事では、`alpic-ai/skybridge` を一次情報（GitHub リポジトリと公式ドキュメント）ベースで解説します。

- GitHub: https://github.com/alpic-ai/skybridge
- Docs: https://docs.skybridge.tech

Skybridgeは、ひとことで言うと

- **MCPサーバ実装（server）**
- **Widget側Reactランタイム（web）**
- **開発体験を整えるDevTools/CLI**

を一体化した、**ChatGPT Apps / MCP Apps 向けのTypeScriptフレームワーク**です。

---

## 1. Skybridgeが解く問題

Skybridgeの問題設定は明確です。

1. Apps SDK や MCP ext-apps の生APIは低レベルで、フロント・サーバ間の型連携が弱い
2. Widget開発で「ユーザー向けUI」と「モデルが知る文脈」の同期が難しい
3. ローカル開発でHMRやデバッグ基盤が不足し、反復速度が落ちる

つまり Skybridge は、

- MCPの標準互換性を維持しながら
- フルスタックTypeScriptの開発体験を上げる

ことを目的に設計されています。

---

## 2. 基本アーキテクチャ

Skybridgeは大きく次の3層で構成されます。

- `skybridge/server`: MCPサーバ側（`McpServer`、`registerWidget` など）
- `skybridge/web`: Widget側React API（`useToolInfo`、`useCallTool`、`data-llm` など）
- `@skybridge/devtools`: ローカルエミュレータ、DevTools、開発用サーバ補助

実体として、リポジトリはモノレポで主要パッケージを持ちます。

- `packages/core`（npmパッケージ名: `skybridge`）
- `packages/devtools`
- `packages/create-skybridge`

`create-skybridge` で雛形を作成し、`skybridge dev/build/start` で運用する流れです。

---

## 3. Runtime抽象化の設計

Skybridgeの重要な設計は、**Runtime差分の吸収**です。

- ChatGPT側: Apps SDK（`window.openai`）
- MCP Apps側: ext-apps の JSON-RPC bridge

SkybridgeはHook APIを統一し、実行時にアダプタを切り替えます。

### ただし完全同一ではない

公式 docs の互換表では、機能差も明示されています。

- `useFiles`, `useSetOpenInAppUrl`: Apps SDKのみ
- `useWidgetState`, `data-llm`: MCP Appsではpolyfill（永続性制限あり）
- `useRequestModal`: MCP Appsではiframe内代替

この「抽象化しつつ差分を隠蔽しすぎない」方針は実務的です。

---

## 4. server APIの中核

サーバ側の起点は `McpServer` です。

```ts
import { McpServer } from "skybridge/server";
import { z } from "zod";

const server = new McpServer({ name: "my-app", version: "1.0.0" }, {})
  .registerWidget(
    "search-hotels",
    { description: "Search hotels" },
    {
      inputSchema: { city: z.string() },
      outputSchema: {
        hotels: z.array(z.object({ id: z.string(), name: z.string() }))
      }
    },
    async ({ city }) => {
      const hotels = await findHotels(city);
      return {
        content: [{ type: "text", text: `${city} の候補を表示します` }],
        structuredContent: { hotels }
      };
    }
  );

export type AppType = typeof server;
```

### 設計上のポイント

- `registerWidget` で tool + widgetリソースを一体登録
- `content`（モデル向けテキスト）と `structuredContent`（Widget向けデータ）を分離
- `resourceConfig._meta.ui.csp` で connect/resource/frame/redirect domain を宣言可能

特にCSPの宣言可能性は、Apps審査や本番セキュリティで効きます。

---

## 5. web APIの中核

Widget側は `skybridge/web` のHooksを使います。

### 5.1 初期データ: `useToolInfo`

初回hydrateデータ（tool実行結果）を読むためのHookです。

### 5.2 追加アクション: `useCallTool`

Widgetから追加のtool呼び出しを行います。

- `isPending`, `isSuccess`, `isError` などの状態管理が同梱
- callback/async両パターン対応

### 5.3 型推論: `generateHelpers`

Skybridgeの強みはここです。

```ts
import type { AppType } from "../../server/src/index";
import { generateHelpers } from "skybridge/web";

export const { useCallTool, useToolInfo } = generateHelpers<AppType>();
```

これで

- tool名補完
- input/output型推論
- response metadata型推論

がサーバ定義から自動で繋がります。

### 5.4 LLM文脈同期: `data-llm`

`data-llm` 属性は、ユーザーが今見ているUI状態をモデルに同期するための仕組みです。

- 「どのタブを見ているか」
- 「どの商品を選択中か」
- 「何件ヒットしているか」

といった文脈をモデルに渡すことで、会話回答の精度を上げます。

---

## 6. 型安全の要件: method chaining

Skybridge docs が強調している実装上の要件は、**method chaining** です。

```ts
const server = new McpServer(...)
  .registerWidget("a", ...)
  .registerWidget("b", ...);
```

この形でないと `typeof server` にtool registryが累積されず、`generateHelpers<AppType>()` の推論精度が落ちます。

これはTypeScriptの型計算上の制約を正面から扱った設計です。

---

## 7. 開発フロー（公式推奨）

### 7.1 新規作成

```bash
npm create skybridge@latest
```

生成されるテンプレートには最小構成（server/web、dev/build/start、Alpic deploy）が含まれます。

### 7.2 ローカル開発

```bash
npm run dev
```

`skybridge dev` は

- `http://localhost:3000/mcp`（MCP endpoint）
- `http://localhost:3000/`（DevTools）
- Widget HMR + server再起動監視

を提供します。

### 7.3 本番ビルド

```bash
npm run build
npm start
```

`skybridge build` で `dist/` を作り、`skybridge start` が production server として配信します。

---

## 8. デプロイ戦略

SkybridgeはNode実行環境があればベンダーロックされません。

公式 docs では Alpic 連携が最短導線として示されていますが、設計自体は

- MCP endpoint `/mcp`
- 静的資産 `/assets`

を運用できる任意インフラへ展開可能です。

---

## 9. 向いているケース / 注意点

### 向いているケース

- MCPアプリをTypeScript/Reactで素早く開発したい
- ChatGPT Apps SDK と MCP Apps の両対応を狙いたい
- Widget開発で型安全と反復速度を優先したい

### 注意点

- Node 24+ 前提のため、既存基盤が古いと導入コストが出る
- runtime差分は吸収されるが、全機能が完全同等ではない
- `data-llm` の運用は「モデルに何を見せるか」という設計責務を伴う

---

## 10. まとめ

Skybridgeは、MCPエコシステム上で

- 低レベルSDKの素の扱いづらさ
- Widgetとモデルの文脈同期
- 型の二重定義問題
- 開発サイクルの遅さ

を同時に解くために作られたフレームワークです。

特に、

- `McpServer` + `registerWidget`
- `generateHelpers` による型連携
- `data-llm` による dual-surface 同期

の3点が、他の「ただのMCPサンプル実装」との実用上の差になります。

---

## 参考

- Repository: https://github.com/alpic-ai/skybridge
- Docs: https://docs.skybridge.tech
- API reference: https://docs.skybridge.tech/api-reference
- MCP ext-apps: https://github.com/modelcontextprotocol/ext-apps
- OpenAI Apps SDK: https://developers.openai.com/apps-sdk
