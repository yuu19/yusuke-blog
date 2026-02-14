---
title: 'playwrightでのE2Eテスト'
description: 'playwrightを使用したE2Eテストについて紹介します'
emoji: '🎭'
date: 2025-08-03
topics: ["playwright", "test"]
blog_published: True
published: True
---


## E2Eテストの概略
E2Eテストはシステム全体に対して行われるテスト。

そのシステムの利用者の目線に立って、ブラウザ上で入力してから実行結果が返ってくるまでの一連の流れを検証する。

実際にブラウザを起動してテストを実行するので、単体テストや結合テストに比べて実行時間がかかる。

## SveltekitプロジェクトへのPlaywrightの導入

新規プロジェクトの作成時でも、既存プロジェクトへの Playwright 導入時でも、設定の手間を省くために [Svelte CLI](https://svelte.dev/docs/cli/overview) の使用を推奨する。

### 新規でSveltekitプロジェクトを作成する場合

Svelte CLIを使用して

```bash 
npx sv create (プロジェクト名)
```

を実行。

以下の画面でplaywrightを選択することで、
playwrightがインストールされ、設定ファイル、テストフォルダが生成される。


![alt text](/images/playwright-description-setup.png)


![alt text](/images/playwright-description-config.png)

- テストフォルダの中にテストファイルを作成する。デフォルトでは以下の形式のファイルがテストファイルとして認識される。
```.*(test|spec).(js|ts|mjs)```


- 基本的なテストファイルの構造
```
test.describe('テストの例', () => {
  test.beforeEach(async ({ page }) => {
    // describeで囲まれた各テストに共通する前処理をbeforeEachに記述する
    // テストの前に毎回実行される
    ....
  });
  
  test('テスト1', async ({ page }) => {
    ....
  }),
  
  test('テスト2', async ({ page }) => {
    ....
  }),
  ............
 });
```

### 既存のプロジェクトにplaywrightを導入したい場合

Svelte CLIで

```bash
npx sv add playwright
```
とすると、同様にplaywrightがインストールされる。

参考: https://svelte.jp/docs/cli/sv-add

## 設定ファイル(playwright.config.ts)

### 代表的な設定値
各設定内容は[ドキュメント](https://playwright.dev/docs/test-configuration)を参照

- testDir
  - e2eテストに使用するテストフォルダを指定(例: tests, e2e)
- webServer
  - テスト前に立ち上げるサーバーの設定
  - `reuseExistingServer: !process.env.CI`とした場合、既に立ち上げたサーバーが存在する時にはそのサーバーを使用する。

- .envファイルの設定
   - playwrightが読み込む`.env`ファイルの位置を指定する。https://playwright.dev/docs/test-parameterize#env-files


- project
  - 同一の設定で実行されるテストを論理的にまとめたグループ

  - 以下のように記述すると、`chromium`, `firefox`, `webkit`の3種類のブラウザでそれぞれのテストが実行される。

```
projects: [
        {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

  ],
```

  - スマートフォンの環境をエミュレートすることも可能

```
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
```
  
  





## Playwrightが提供するテストツール(ロケーター、アクション、アサーション、フック)
参考: [Playwrightが提供するAPI一覧](https://playwright.dev/docs/api/class-test)


- 例1: (`/user/home`に遷移していることを確認)

```
　　//ログインページへ移動 (アクション)
    await page.goto('/login'); 
    //パスワード入力欄(id=userEmailTextboxを持つ)を選択して、メールアドレスを入力 (ロケーター+アクション)
    await page.locator('#userEmailTextbox').fill('hoge@example.com'); 
    //同様にパスワードを入力 (ロケーター+アクション)
    await page.locator('#userPasswordTextbox').fill('00001111aa');
    //type="submit"を持つボタンをクリック (ロケーター+アクション)
    await page.locator('button[type="submit"]').click();
    // /user/homeにいることを確認 (アサーション)
    await expect(page).toHaveURL('/user/home');
```

- 例2: (入力欄を空にしてフォームをsubmitした場合に、エラーメッセージが表示されていることを確認)

```
  await page.locator('#item-title').fill('');
  await page.locator('#submit-update').click();
  // <div class="error-msg"> という要素で、<div>の中に「タイトルは入力必須です。」という文字列を含むものが存在するか確認
  await expect(
    page.locator('div.error-msg', { hasText: 'タイトルは入力必須です。' })
      ).toBeVisible();
    });
```

### ロケーター、アクション

- ロケーター
ページ内の要素を特定する。
操作対象のテキストボックスやボタンなどを探し出す。
Playwrightのロケーターは自動待機機能とリトライ機能を備えている。
[ロケーター一覧](https://playwright.dev/docs/locators)


- アクション
ロケーターを使用して選択した要素に対して、「ボタンをクリックする」、「セレクトボックスを選択する」といったユーザーの操作をシュミレーションする。
[アクション一覧](https://playwright.dev/docs/input#introduction)

  


- ロケーターの例

| メソッド名                     | 説明                                              | 使用例                                                    |
|--------------------------------|---------------------------------------------------|-----------------------------------------------------------|
| `page.getByRole()`             | アクセシビリティ属性によって要素を検索            | `await page.getByRole('button', { name: '送信' }).click();` |
| `page.getByLabel()`            | 関連するラベルのテキストでフォームコントロールを検索 | `await page.getByLabel('ユーザー名').fill('yusuke123');`    |
| `page.getByPlaceholder()`      | プレースホルダーをもとに入力欄を検索              | `await page.getByPlaceholder('パスワード').fill('secret');` |
| `page.getByText()`             | テキストコンテンツで要素を検索                    | `await page.getByText('ログイン').click();` |               
| `page.locator()` | CSS or XPathによって要素を検索  | `page.locator('#submit-button')` (idセレクタ) `page.locator('.submit-button')`  (クラスセレクタ)


- [filter](https://playwright.dev/docs/locators#filtering-locators)を使用することで、要素を絞り込むことができる。
例
```ts
await page.getByRole('button').filter({ hasText: '/Login/' }).click();
```



- `page.getByRole()`:  アクセシビリティネームで指定する場合(aria-label属性などを指定していない場合には、button要素ではボタン内のテキストがアクセシビリティネームとして使用される)
```html
<h3>Sign up</h3>
<label>
  <input type="checkbox" /> Subscribe
</label>
<br/>
<button>Submit</button>
-> await page.getByRole('button', { name: /submit/i }).click(); 
(大文字、小文字の違いは無視)
```


- `page.getByLabel()`
```html
<!--labelのforとinputのidで関連付け-->
<label for="name">名前</label>
<input type="text" id="name" name="name" />

-> await page.getByLabel('名前').fill('山田太郎');
```




- アクションの例
  
| アクション             | 説明                                   |
|------------------------|----------------------------------------|
| `locator.check()`      | チェックボックスにチェックを入れる     |
| `locator.click()`      | 要素をクリックする                     |
| `locator.uncheck()`    | チェックボックスのチェックを外す       |
| `locator.hover()`      | 要素にマウスカーソルをホバーする       |



### アサーション

テスト内で期待される状態と実際の状態を比較/検証する。

https://playwright.dev/docs/test-assertions

- アサーションの例

| アサーション                              | 説明                  |
| ---------------------------------- | ------------------- |
| `toBeVisible()`                    | 要素が表示されているか         |
| `toBeHidden()`                     | 非表示か                |
| `toHaveText(text)`                 | テキスト内容が一致するか        |
| `toHaveValue(value)`               | input の値が一致するか      |
| `toHaveAttribute(name, value)`     | 属性の値が一致するか          |
| `toHaveClass(className)`           | class 名が一致するか       |
| `toBeEnabled()` / `toBeDisabled()` | 有効／無効か              |
| `toBeChecked()`                    | チェックボックスがチェックされているか |










### フック 

複数のテスト間で準備、片付けコードを共有する。
`beforeAll`, `beforeEach`, `afterEach`, `afterAll`


| フック名       | 実行タイミング                           | 実行回数                | 主な用途例                                     |
|----------------|------------------------------------------|--------------------------|------------------------------------------------|
| `beforeAll`    | 各テストスイート（ファイルやdescribe）開始前 | スイートごとに1回         | データベース接続の初期化、共通データの作成など  |
| `beforeEach`   | 各 `test()` の直前                        | 各テストごとに1回         | ページ初期化、DBの初期状態リセットなど         |
| `afterEach`    | 各 `test()` の直後                        | 各テストごとに1回         | データのクリーンアップ、ログ保存など           |
| `afterAll`     | 各テストスイートのすべてのテスト終了後      | スイートごとに1回         | DB切断、リソース解放、スクリーンショットまとめなど |

- 実行順

 ```mermaid
sequenceDiagram
    autonumber
    participant Suite as テストスイート

    Note over Suite: テストスイート開始
    Suite->>Suite: beforeAll()

    loop 各テスト (テスト1, テスト2, …)
      Suite->>Suite: beforeEach()
      Suite->>Suite: test('テストX')
      Suite->>Suite: afterEach()
    end

    Suite->>Suite: afterAll()
    Note over Suite: テストスイート終了
```


- 使用例1(ログイン処理)


ログイン処理は各テストの前に毎回実行されるので、`beforeEach`を使用する



```ts
test.describe('フォーム作成: メールアドレスのテスト', () => {
  /**
   * describeで囲まれた各テストに共通する前処理をbeforeEachに記述する
   * テストの前に毎回実行される
   * ログイン->「新しいフォームを作成する」ボタンを押してメールアドレス入力画面(/user/new_form)に遷移
   */
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('#userEmailTextbox').fill('hoge@example.com');
    await page.locator('#userPasswordTextbox').fill('00001111aa');
    await page.locator('button[type="submit"]').click();
    await page.locator('#create-new-form').click();
  });
 ```

- 使用例2(DBを使用したテスト)

テスト間での独立性を保つために、毎回DBをクリアする

```ts
test.describe('DBを使用したテスト', () => {
  // テストスイート開始前に一度だけ実行
  beforeAll(async () => {
    console.log('beforeAll: 全テーブルをクリアしてテストユーザーを作成');
    await cleanUpDatabase();
    await createTestUser();
  });

  // 各テスト前に、テストユーザーは残したまま他テーブルだけクリア
  beforeEach(async () => {
    console.log('beforeEach: 子テーブルをクリア');
    await cleanUpChildTables();
  });

  // 各テスト後に、同様に子テーブルをクリア
  afterEach(async () => {
    console.log('afterEach: 子テーブルをクリア');
    await cleanUpChildTables();
  });

  // 全テスト終了後に全データをクリアしてDB接続を切断
  afterAll(async () => {
    console.log('afterAll: 全テーブルをクリアして切断');
    await cleanUpDatabase();
    await disconnectDatabase();
  });
  
  test('テスト1', async ({ page }) => {
    ....
  }),
  
  test('テスト2', async ({ page }) => {
    ....
  }),
  ............
 });
```

## その他

### パラメータ化テスト

https://playwright.dev/docs/test-parameterize

複数の引数に対するテスト
playwrightでも実行できるが、時間が掛かるので単体テスト向き

- 例

```ts
    const heights = [100, 150, 200, 250, 300, 350, 400, 450, 500];
    for (const height of heights) {
      test(`高さを ${height}px にした場合`, async ({ page }) => {
        await page.locator('#comment-body').click();
        await page.locator('#comment-body').fill('');
        await page.locator('#comment-body').fill('テストコメント');

        await page.getByRole('combobox').selectOption(String(height));

        await page.getByRole('button', { name: '更新する' }).click();

        const commentBody = page.locator('.itemComment > div');
        const style = await commentBody.getAttribute('style');

        // 高さに関するスタイルが含まれているかチェック
        expect(style).toContain(`height: ${height}px;`);
      });
    }
```

### スナップショットテスト

スナップショットテストとは、コンポーネントの出力（例：HTML構造）をファイルに保存し、将来の変更と比較して差分があるかを検出するテスト手法。

htmlの構造が複雑な場合などに有用

(後日追記)

### コンポーネントテスト
PlaywrightはAPIをモックする機能を持っており、E2Eテスト以外にもコンポーネントテストに使用することができる。(Vitest + Svelte testing library + jsdomを使用する場合はNode.js上でjsdomを使用してDOMを再現するが、Playwrightを使用する場合は実際にブラウザを立ち上げるという違いがある)

(後日追記)


## VSCodeの拡張機能

公式が提供している。
https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright

拡張機能を使用することで、以下のような操作をGUI上で簡単に設定できる。

### 個別のテストに対するテスト実行

各テストファイルやテスト関数の横に表示される▶アイコンから、ワンクリックで該当テストを実行できる。

![alt text](/images/playwright-description-extension-1.png)

### Show browser

テスト実行中に実際のブラウザインスタンスを表示する。
デフォルトではヘッドレスモードだが、この機能をオンにすると画面遷移や操作を目視しながらデバッグできる。
![alt text](/images/playwright-description-extension-2.png)
![alt text](/images/playwright-description-top-1.png)

### Show trace viewer

- テスト実行の「前後」で画面がどのように変化したかを詳細に確認できる。
playwright.config.ts に以下の設定を追加すると、失敗時のみトレースが保存される。

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'retain-on-failure',  // 失敗時のみトレースを保持
  },
});
```


![alt text](/images/playwright-description-extension-3.png)

![alt text](/images/playwright-description-trace.png)


### Record new

「Record new」をクリックすると、ブラウザが立ち上げられる。ブラウザ上でボタンの操作等のアクションをすると、テストファイルに反映される。


![alt text](/images/playwright-description-extension-4.png)

- ブラウザ上で「+」ボタンをクリック
![alt text](/images/playwright-description-top-2.png)

- 記録された操作
```
test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Increase the counter by one' }).click();
});
```



## CI環境(Github Actions)でのplaywrightの実行

`.github/workflows`フォルダ内のymlファイルにワークフローを記述する。


Playwrightのドキュメントで手順が紹介されている　https://playwright.dev/docs/ci-intro



- 注意点
  - APIキーなどが必要な場合は事前にSecretに登録しておく必要がある。
[GitHub Actions でのシークレットの使用](https://docs.github.com/ja/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)

  - パブリックリポジトリの場合は料金がかからないが、プライベートリポジトリの場合は一定のストレージ、時間を超えると料金がかかる


    - [GitHub Actions の課金について](https://docs.github.com/ja/billing/managing-billing-for-your-products/managing-billing-for-github-actions/)

    - Github Freeの場合の制限(時間の制限は毎月リセットされるが、ストレージの制限はリセットされない)
    ```
    GitHub Free	500 MB	2,000 分
    ```



## 参考資料

- [playwrightのドキュメント](https://playwright.dev/)
- [Playwrightのベストプラクティスを翻訳してみた](https://daipresents.com/2024/04/15/playwright-best-practices/#test-user-visible-behavior)
- [Webフロントエンド E2E テスト(技術評論社)](https://gihyo.jp/book/2024/978-4-297-14220-9)
- [Svelteドキュメント(E2E tests using Playwright)](https://svelte.dev/docs/svelte/testing#E2E-tests-using-Playwright)
