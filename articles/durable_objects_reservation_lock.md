---
title: 'Durable Objectsで二重予約を防ぐ: 「枠ごとの排他」設計'
description: 'Cloudflare Durable Objectsを使って予約システムの二重予約を防ぐ方法を、理論中心に解説。slot単位の排他、入力/出力ゲート、トランザクション、冪等性まで実装付きで整理します。'
emoji: '🗓️'
date: 2026-02-27
topics: ["cloudflare", "durable-objects", "workers", "reservation", "distributed-systems"]
blog_published: True
published: False
---

## はじめに

予約システムで最も壊れやすい部分は、ほぼ確実に「同じ枠への同時リクエスト」です。

- ユーザーAが 10:00-10:30 を予約
- ほぼ同時にユーザーBも同じ枠を予約
- 両方が「空いている」と判定され、二重予約が発生

この記事では、Cloudflare Durable Objects（以下 DO）を使って、
**枠ごとに排他をかける** ことで二重予約を防ぐ設計を解説します。

単なるコード紹介ではなく、まず理論を整理し、その上で実装を示します。

---

## 1. なぜ二重予約が起きるのか

典型的な失敗は、次の read-modify-write です。

1. `SELECT` で空き確認
2. 空いていたら `INSERT` で予約確定

これを2リクエストが同時に実行すると、
両者の `SELECT` が先に通ってしまい、2件の `INSERT` が通る可能性があります。

RDBのトランザクションや `UNIQUE` 制約で対処できるケースもありますが、
分散環境で「アプリ層の同時実行をどう直列化するか」は別問題として残ります。

---

## 2. Durable Objects が効く理由（理論）

DO は「IDで一意に指定されるオブジェクト」が実行単位です。
同じIDへの処理は同じオブジェクトインスタンスに到達し、
**そのインスタンス内の処理は単一スレッド的に進む** という性質を使えます。

予約に適用すると発想はシンプルです。

- 「予約枠」を排他単位（atom of coordination）にする
- 同じ枠を同じ DO 名（ID）にルーティングする
- その DO 内で「予約可否判定 + 状態更新」を行う

すると、同じ枠への同時リクエストは同一オブジェクトで逐次処理され、
「同時に空きを見て同時に確定」が構造的に起きなくなります。

---

## 3. 排他の粒度設計: 「枠ごとDO」

ここが設計の核心です。

### 3.1 キー設計

DO名（または `idFromName` の入力）を以下のように作ります。

```txt
tenantId:resourceId:slotStartIso
```

例:

```txt
clinic-a:doctor-42:2026-03-01T10:00:00.000Z
```

この設計により、

- 同一枠への操作は必ず同じ DO に集約
- 別枠は別 DO に分散

となり、排他とスケールを両立できます。

### 3.2 時刻正規化は必須

`2026-03-01T10:00:00+09:00` と `2026-03-01T01:00:00Z` は同じ時刻です。
文字列のままキーにすると別枠扱いになるので、必ず UTC ISO 形式に正規化してからキー化します。

---

## 4. 予約を2段階に分ける（Hold / Confirm）

実務では次の2段階が安全です。

1. `hold`（仮押さえ）
2. `confirm`（確定）

`hold` に TTL をつけることで、決済離脱や通信断があっても枠が永久に塞がりません。
DO の alarm で期限切れ Hold を掃除できます。

---

## 5. 冪等性（Idempotency）は必須

ネットワーク再送で同じリクエストが複数回届くのは通常動作です。
そのため API には `idempotencyKey` を持たせ、同キーの再送は同じ結果を返すべきです。

排他だけでなく、**再送耐性** を入れて初めて運用で壊れにくくなります。

---

## 6. 実装例

以下は最小構成の TypeScript 例です。

### 6.1 `wrangler.jsonc`（SQLite-backed DO）

```jsonc
{
  "name": "reservation-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-27",
  "durable_objects": {
    "bindings": [
      {
        "name": "SLOT_LOCK",
        "class_name": "SlotLockDO"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["SlotLockDO"]
    }
  ]
}
```

### 6.2 Worker 側: 枠キーで DO にルーティング

```ts
// src/index.ts
import { SlotLockDO } from './slot-lock-do';

export interface Env {
  SLOT_LOCK: DurableObjectNamespace<SlotLockDO>;
}

type HoldRequest = {
  tenantId: string;
  resourceId: string;
  slotStartIso: string;
  userId: string;
  idempotencyKey: string;
};

function canonicalSlotKey(input: Pick<HoldRequest, 'tenantId' | 'resourceId' | 'slotStartIso'>): string {
  const slotStart = new Date(input.slotStartIso).toISOString();
  return `${input.tenantId}:${input.resourceId}:${slotStart}`;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/reservations/hold') {
      const body = (await request.json()) as HoldRequest;
      const key = canonicalSlotKey(body);

      // 2025-08以降は getByName が使える
      const stub = env.SLOT_LOCK.getByName(key);
      const result = await stub.hold(body);

      return Response.json(result, { status: result.ok ? 200 : 409 });
    }

    if (request.method === 'POST' && url.pathname === '/api/reservations/confirm') {
      const body = (await request.json()) as {
        tenantId: string;
        resourceId: string;
        slotStartIso: string;
        reservationId: string;
        userId: string;
      };
      const key = canonicalSlotKey(body);
      const stub = env.SLOT_LOCK.getByName(key);
      const result = await stub.confirm(body);

      return Response.json(result, { status: result.ok ? 200 : 409 });
    }

    return new Response('Not found', { status: 404 });
  }
} satisfies ExportedHandler<Env>;
```

### 6.3 Durable Object 側: 排他と状態遷移

```ts
// src/slot-lock-do.ts
import { DurableObject } from 'cloudflare:workers';

type HoldRequest = {
  tenantId: string;
  resourceId: string;
  slotStartIso: string;
  userId: string;
  idempotencyKey: string;
};

type HoldResult =
  | { ok: true; reservationId: string; expiresAt: number }
  | { ok: false; reason: 'ALREADY_HELD_OR_BOOKED' };

type ConfirmRequest = {
  reservationId: string;
  userId: string;
};

type ConfirmResult =
  | { ok: true; reservationId: string }
  | { ok: false; reason: 'NOT_FOUND' | 'NOT_OWNER' | 'EXPIRED' };

export class SlotLockDO extends DurableObject {
  private holdTtlMs = 2 * 60 * 1000;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);

    // 初期化のみ blockConcurrencyWhile を使う
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS reservations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('HELD','CONFIRMED','CANCELLED')),
          expires_at INTEGER NOT NULL,
          idempotency_key TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL,
          confirmed_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_reservations_status_expires
          ON reservations(status, expires_at);
      `);
    });
  }

  private cleanupExpired(now: number) {
    this.ctx.storage.sql.exec(
      `DELETE FROM reservations WHERE status = 'HELD' AND expires_at <= ?`,
      now
    );
  }

  async hold(req: HoldRequest): Promise<HoldResult> {
    const now = Date.now();
    const expiresAt = now + this.holdTtlMs;
    const reservationId = crypto.randomUUID();

    const result = this.ctx.storage.transactionSync(() => {
      this.cleanupExpired(now);

      // 冪等キー再送は同じ結果を返す
      const idem = this.ctx.storage.sql
        .exec(
          `SELECT id, status, expires_at
             FROM reservations
            WHERE idempotency_key = ?`,
          req.idempotencyKey
        )
        .one<{ id: string; status: 'HELD' | 'CONFIRMED' | 'CANCELLED'; expires_at: number }>();

      if (idem && (idem.status === 'HELD' || idem.status === 'CONFIRMED')) {
        return { kind: 'ok' as const, reservationId: idem.id, expiresAt: idem.expires_at };
      }

      // この DO は「1枠」を表すため、HELD/CONFIRMED が1件でもあれば競合
      const active = this.ctx.storage.sql
        .exec(
          `SELECT id
             FROM reservations
            WHERE status IN ('HELD', 'CONFIRMED')
            LIMIT 1`
        )
        .one<{ id: string }>();

      if (active) {
        return { kind: 'conflict' as const };
      }

      this.ctx.storage.sql.exec(
        `INSERT INTO reservations
          (id, user_id, status, expires_at, idempotency_key, created_at)
         VALUES (?, ?, 'HELD', ?, ?, ?)`,
        reservationId,
        req.userId,
        expiresAt,
        req.idempotencyKey,
        now
      );

      return { kind: 'ok' as const, reservationId, expiresAt };
    });

    if (result.kind === 'conflict') {
      return { ok: false, reason: 'ALREADY_HELD_OR_BOOKED' };
    }

    await this.ctx.storage.setAlarm(result.expiresAt);
    return { ok: true, reservationId: result.reservationId, expiresAt: result.expiresAt };
  }

  async confirm(req: ConfirmRequest): Promise<ConfirmResult> {
    const now = Date.now();

    const result = this.ctx.storage.transactionSync(() => {
      this.cleanupExpired(now);

      const row = this.ctx.storage.sql
        .exec(
          `SELECT id, user_id, status, expires_at
             FROM reservations
            WHERE id = ?`,
          req.reservationId
        )
        .one<{ id: string; user_id: string; status: 'HELD' | 'CONFIRMED' | 'CANCELLED'; expires_at: number }>();

      if (!row) return { kind: 'not_found' as const };
      if (row.user_id !== req.userId) return { kind: 'not_owner' as const };
      if (row.status !== 'HELD' || row.expires_at <= now) return { kind: 'expired' as const };

      this.ctx.storage.sql.exec(
        `UPDATE reservations
            SET status = 'CONFIRMED', confirmed_at = ?
          WHERE id = ?`,
        now,
        req.reservationId
      );

      return { kind: 'ok' as const };
    });

    if (result.kind === 'not_found') return { ok: false, reason: 'NOT_FOUND' };
    if (result.kind === 'not_owner') return { ok: false, reason: 'NOT_OWNER' };
    if (result.kind === 'expired') return { ok: false, reason: 'EXPIRED' };
    return { ok: true, reservationId: req.reservationId };
  }

  async alarm(): Promise<void> {
    this.cleanupExpired(Date.now());
  }
}
```

---

## 7. どこまで DO に任せるべきか

### 7.1 DO は「排他の中枢」に限定する

DO には「同時実行制御が必要な最小状態」だけを持たせるのが定石です。

- 予約枠のロック状態（HELD / CONFIRMED）
- 期限
- 冪等キー

請求、通知、分析などは別コンポーネントへ分離した方がスケールしやすく、障害分離もできます。

### 7.2 最終保存先にも制約を置く

DO で排他していても、下流DBに最終確定を複製する場合は
`UNIQUE(tenant_id, resource_id, slot_start)` を入れて二重防御にしてください。

---

## 8. `blockConcurrencyWhile` の使いどころ

`blockConcurrencyWhile` は強力ですが、通常リクエストで多用するとスループットを落とします。

推奨は次です。

- 初期化（DDL・マイグレーション）でのみ利用
- 通常処理は input/output gate + ストレージトランザクションで実装

---

## 9. この設計で防げるもの / 防げないもの

防げるもの:

- 同一枠への同時予約による競合
- リトライ再送による重複確定

別途対策が要るもの:

- 入力時刻の揺れ（正規化不足）
- クロス枠制約（例: 連続2枠同時確保）
- 他システム連携時の最終整合（補償処理）

---

## 10. まとめ

予約システムの二重予約防止は、
「DBで頑張る」よりも **排他単位を明確にして直列化する** 方が壊れにくいです。

Durable Objects では、

1. 枠をキーに DO へルーティング
2. その DO 内で判定と更新を一体化
3. Hold/Confirm + TTL + 冪等キーを実装

という構成で、実運用に耐える堅牢性を作れます。

---

## 参考

- Durable Objects 概要
  https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
- Durable Object Namespace（`idFromName` / `getByName`）
  https://developers.cloudflare.com/durable-objects/api/namespace/
- SQLite-backed Durable Object Storage（SQL / transaction）
  https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- DurableObjectState（`blockConcurrencyWhile`）
  https://developers.cloudflare.com/durable-objects/api/state/
- Rules of Durable Objects（ベストプラクティス）
  https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
