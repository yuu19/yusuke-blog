---
title: 'SvelteのcreateSubscriberを詳しく理解する'
description: 'createSubscriberの実行モデル、$effectとの関係、複数購読時の挙動、実装パターンを実例つきで解説'
emoji: '🧩'
date: 2026-02-27
topics: ["svelte", "typescript", "reactivity"]
blog_published: True
published: False
---

## はじめに

`createSubscriber` は Svelte 5 の `svelte/reactivity` に追加された低レベルAPIです。

```ts
import { createSubscriber } from 'svelte/reactivity';
```

公式ドキュメントの定義は次です。

```ts
function createSubscriber(
  start: (update: () => void) => (() => void) | void
): () => void;
```

一見シンプルですが、実際には

- 外部イベント源（`matchMedia`, `IntersectionObserver`, `WebSocket`, 独自Emitter）
- Svelte のリアクティブ実行（特に `$effect`）

を安全に接続するための重要な橋渡しになっています。

この記事では `createSubscriber` を「どう使うか」だけでなく、**どう動くか** まで掘り下げます。

---

## 1. createSubscriberが解く問題

Svelteコンポーネントでは通常、`$state` / `$derived` で状態を組みます。

ただし次のような値は、外部イベントで変化します。

- メディアクエリの一致状態
- WebSocketの接続状態
- DOM要素の可視状態
- ブラウザAPI由来のランタイム値

こうした「Svelte外部で変わる値」を、

- 必要な時だけ購読し
- 依存しているeffectだけ再実行し
- 不要になったら確実に解放する

ための抽象が `createSubscriber` です。

---

## 2. 実行モデル（ここが最重要）

`createSubscriber(start)` が返す `subscribe` を、`$effect`（またはその内部で呼ばれるgetter）から読むと次が起きます。

1. 最初の追跡コンテキストで `subscribe()` が呼ばれたとき `start(update)` が実行される
2. 外部イベント発生時に `update()` を呼ぶと、その `subscribe()` を読んだeffectが再実行される
3. effectが全て破棄されたら、`start` が返した cleanup が実行される

### 複数effect時の挙動

公式仕様上、`subscribe` が複数effectで使われても

- `start` は1回だけ
- cleanup は最後の購読者が消えた時に1回

です。

要するに **参照カウント付き購読** として振る舞います。

---

## 3. 公式MediaQuery実装を読む

Svelte docsの `MediaQuery` 実装（要旨）は次です。

```ts
import { createSubscriber } from 'svelte/reactivity';
import { on } from 'svelte/events';

export class MediaQuery {
  #query: MediaQueryList;
  #subscribe: () => void;

  constructor(query: string) {
    this.#query = window.matchMedia(`(${query})`);

    this.#subscribe = createSubscriber((update) => {
      const off = on(this.#query, 'change', update);
      return () => off();
    });
  }

  get current() {
    this.#subscribe();
    return this.#query.matches;
  }
}
```

この実装のポイントは3つです。

1. `get current()` の中で `#subscribe()` を呼ぶ  
   - getterを読んだeffectだけが依存登録される
2. 実値は `return this.#query.matches` で即時取得  
   - 「購読管理」と「値取得」を分離している
3. teardown を必ず返す  
   - リスナーリーク防止

---

## 4. なぜ `onMount + addEventListener` では不十分か

`onMount` で購読して全体state更新する方法も可能です。

ただしそれだと

- コンポーネント単位で購読が常時有効になりやすい
- 値を参照していないeffectまで巻き込みやすい
- 再利用可能な「reactive class / utility」にしにくい

`createSubscriber` は **値を読む場所に依存を閉じ込める** ため、API設計が綺麗になります。

---

## 5. 実装パターン（実践）

### 5.1 WebSocket接続状態

```ts
import { createSubscriber } from 'svelte/reactivity';

export class ReactiveSocketStatus {
  #ws: WebSocket;
  #connected = false;
  #subscribe: () => void;

  constructor(url: string) {
    this.#ws = new WebSocket(url);

    this.#subscribe = createSubscriber((update) => {
      const onOpen = () => {
        this.#connected = true;
        update();
      };
      const onClose = () => {
        this.#connected = false;
        update();
      };

      this.#ws.addEventListener('open', onOpen);
      this.#ws.addEventListener('close', onClose);

      return () => {
        this.#ws.removeEventListener('open', onOpen);
        this.#ws.removeEventListener('close', onClose);
      };
    });
  }

  get connected() {
    this.#subscribe();
    return this.#connected;
  }
}
```

使う側:

```svelte
<script lang="ts">
  import { ReactiveSocketStatus } from './reactive-socket-status';
  const status = new ReactiveSocketStatus('wss://example.com/ws');
</script>

<p>{status.connected ? 'connected' : 'disconnected'}</p>
```

### 5.2 IntersectionObserver

```ts
import { createSubscriber } from 'svelte/reactivity';

export class Visibility {
  #el: HTMLElement;
  #visible = false;
  #subscribe: () => void;

  constructor(el: HTMLElement) {
    this.#el = el;

    this.#subscribe = createSubscriber((update) => {
      const observer = new IntersectionObserver((entries) => {
        this.#visible = entries[0]?.isIntersecting ?? false;
        update();
      });

      observer.observe(this.#el);
      return () => observer.disconnect();
    });
  }

  get current() {
    this.#subscribe();
    return this.#visible;
  }
}
```

---

## 6. `createSubscriber` と `$effect.tracking`

Svelte docsで明示されている通り、`createSubscriber` は内部的に

- 今がtracking contextかどうか
- （つまりeffect/template依存として扱うべきか）

を見て動作します。

そのため、同じgetterでも

- effect/templateで読む: 依存登録される
- ただのイベントハンドラ内で読む: 購読を増やさない

という挙動になります。

これが「読み取り場所に応じた正しい購読」を実現する鍵です。

---

## 7. よくある落とし穴

1. `update()` を呼ばない  
   - 外部値は変わってもeffectが再実行されない
2. cleanupを返さない  
   - リスナーが残りメモリリーク
3. getter内で `subscribe()` を呼び忘れる  
   - reactive valueとして機能しない
4. SSR前提のAPIをそのまま使う  
   - `window` 非存在で落ちる

---

## 8. SSR時の注意

`createSubscriber` 自体は仕組みですが、対象APIがブラウザ専用なら SSR安全化が必要です。

例えば `matchMedia` 系は

- サーバでは `window` が無い
- hydration時に値が変化しうる

ため、fallback値戦略やブラウザ限定初期化を設計する必要があります。

---

## 9. 使い分け指針

- 単純なローカル状態: `$state`
- 計算値: `$derived`
- DOM副作用: `$effect`
- 外部イベント源を「値」として見せたい: `createSubscriber`

`createSubscriber` は日常的に多用するAPIではなく、**リアクティブ基盤を作る側**で効く低レイヤーAPIです。

---

## 10. まとめ

`createSubscriber` を正しく理解すると、Svelteで次が実現できます。

- 外部イベントとリアクティビティの疎結合
- 参照カウントに基づく効率的な購読管理
- getterベースの綺麗な再利用API

とくにライブラリ・設計層では、`createSubscriber` を使うかどうかで「使いやすさ」と「安全性」が大きく変わります。

---

## 参考

- Svelte docs: `svelte/reactivity`  
  https://svelte.dev/docs/svelte/svelte-reactivity
- Svelte docs: `$effect`  
  https://svelte.dev/docs/svelte/$effect
- Svelte docs: `svelte/events`  
  https://svelte.dev/docs/svelte/svelte-events
- Svelte docs: `svelte/reactivity/window`  
  https://svelte.dev/docs/svelte/svelte-reactivity-window
