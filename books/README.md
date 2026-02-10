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

