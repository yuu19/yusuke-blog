# Books Directory

`books` ディレクトリでは、Zenn の book 形式を参考に本を管理します。

## ディレクトリ構成

```txt
books/
  my-first-book/
    config.yaml
    1.introduction.md
    2.setup.md
```

## config.yaml の例

```yaml
title: "SvelteKit 実践ガイド"
summary: "SvelteKit で実運用するための設計と実装をまとめた本です。"
topics: ["sveltekit", "typescript", "frontend"]
published: true
price: 0
chapters:
  - introduction
  - setup
```

複数の部に分けるBookでは、`chapters`の代わりに`parts`を指定できます。

```yaml
parts:
  - title: "基礎"
    summary: "前提となる概念を学びます。"
    chapters:
      - introduction
  - title: "実装"
    chapters:
      - setup
```

`parts`を指定しても、章番号、前後移動、読了進捗は全パートを通したフラットな順序で扱われます。従来の`chapters`形式も引き続き利用できます。

## チャプター Markdown の例

```md
---
title: "Introduction"
free: true
---

# Introduction

ここに本文を書きます。
```

## 並び順ルール

- `config.yaml` の `chapters` がある場合は、その配列順で並びます
- `chapters` がない場合は、`1.introduction.md` のような数値プレフィックスで並びます
- どちらにも当てはまらないファイルは末尾に並びます
- `parts`がある場合は各Partの`chapters`を上から順に連結します
- `published: false`のBookは開発サーバーだけでDRAFTプレビューでき、本番の一覧・動的ルート・prerender対象には含まれません
