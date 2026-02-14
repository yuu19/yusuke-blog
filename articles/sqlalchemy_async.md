---
title: 'SQLAlchemyで非同期処理を扱う際の注意点'
description: 'SQLAlchemyを使った非同期処理には、様々な注意点があります。この記事ではどのような点に気を付けて実装をするべきかを紹介します。'
emoji: '🗄️'
date: 2024-08-19
topics: ["python", "sqlalchmy", "async"]
blog_published: True
published: False
---

## ドライバー



- MySQLの場合
ドライバーに`aiomysql`または`asyncmy`を使用する

- PostgreSQLの場合
ドライバーに`asyncpg`を使用する

設定(同期処理と異なる点)
```
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine("データベースのURL")
Session = async_sessionmaker(engine, expire_on_commit=False)
```
エンジンを変更した場合は、それに伴ってデータベースのURLに変更を反映させる必要があることに注意。


`expire_on_commit=False`として、各コミットごとにコミット後にreflesh()を使う
[参考](https://docs.sqlalchemy.org/en/20/orm/session_api.html#sqlalchemy.orm.Session.params.expire_on_commit)
(もう少しこの辺調べる)

## クエリ

- lazy='raise'としてlazy loadが発生した場合に例外を投げるようにするのが安全

[参考](https://docs.sqlalchemy.org/en/14/orm/loading_relationships.html)
> raise loading - available via lazy='raise', lazy='raise_on_sql', or the raiseload() option, this form of loading is triggered at the same time a lazy load would normally occur, except it raises an ORM exception in order to guard against the application making unwanted lazy loads. An introduction to raise loading is at Preventing unwanted lazy loads using raiseload.

## 