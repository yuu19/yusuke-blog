# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

## 記事の管理

articlesフォルダにmarkdown形式の記事を管理する。
記事は次のメタデータを持つ。

| キー           | 例値                                                                                                      | 説明                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| title          | Programmer’s Python: Async - Threads, processes, asyncio & more: Something Completely Differentの読書メモ | 記事やブログポストのタイトル。内容の概要を伝える。                                       |
| description    | （空文字）                                                                                                | 記事の概要や補足説明。                                                                   |
| date           | 2024-08-19                                                                                                | 記事の作成日を表します。                                                                 |
| topics         | ["python", "async"]                                                                                       | 記事の内容に関連するトピックやキーワードのリスト。タグでブログ記事を絞ることができます。 |
| blog_published | True                                                                                                      | ブログとして公開されるかどうかのフラグ。Trueの場合、ブログ記事として扱われます。         |
| published      | False                                                                                                     | zennに記事を公開されるかどうかのフラグ。Trueの場合、Zennに記事が公開されます(現在未対応) |

## 使用技術

| カテゴリー     | 技術・ツール                |
| -------------- | --------------------------- |
| フロントエンド | Svelte, SvelteKit           |
| スタイリング   | Tailwind CSS, shadcn svelte |
| インフラ       | Cloudflare Pages            |

## 現在のアーキテクチャー

![設計図](./architecture.drawio.svg)
