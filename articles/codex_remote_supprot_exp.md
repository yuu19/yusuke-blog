---
title: 'Codexがremote MCPの使用を実験的にサポート'
description: 'Codex v0.46.0で追加されたremote MCPサポートの概要と設定手順をまとめます。'
date: 2025-10-11
topics: ["codex", "mcp"]
blog_published: True
published: False
---

Codexは従来、標準入出力を経由したMCPサーバとの通信のみをサポートしていました。先日に公開された[v0.46.0のリリース](https://github.com/openai/codex/releases/tag/rust-v0.46.0)で、実験的ながらstreamable HTTP経由のremote MCPサーバへの接続のサポートを開始しました。



## remote MCPを有効化する

`~/.codex/config.toml`に次の設定を加えると、remote MCPサーバが有効になります。

```toml
experimental_use_rmcp_client = true
```

認可が必要な場合は、
```bash
codex mcp login (サーバ名)
```
とすることで、指定した MCP サーバの認可サーバの URL が開かれ、認可を行うことができます。

## Sentry MCPサーバを利用する

Sentryが提供するMCPサーバを例に、remote MCPの利用手順を確認します。

1. `~/.codex/config.toml`に以下のセクションを追加します。

```toml
[mcp_servers.sentry]
url = "https://mcp.sentry.dev/mcp"
```

2. ターミナルで次のコマンドを実行すると、ブラウザが開き、Sentry MCPの認可サーバのURLにアクセスすることができます。

```bash
codex mcp login sentry
```

「Approve」ボタンをクリックすると、認可が完了して、CodexでのSentry MCPの使用を開始することができます。

![Sentryのremote MCP認証画面](/images/codex/remote-mcp/sentry-auth.png)


