---
title: 'Programmer’s Python: Async - Threads, processes, asyncio & more: Something Completely Differentの読書メモ'
description: ''
emoji: '🐍'
date: 2024-08-19
topics: ["python", "async"]
blog_published: True
published: False
---

### 2章

- I/O-Bound, CPU-Bound とはそれぞれ、入出力がボトルネックになる処理、CPUの処理がボトルネックになる処理を指している
  - 初めに非同期処理関係の解説記事を読んだとき、これらの用語の意味が分からなかった。

### 3章

参考: [Python公式のmultiprocessingの解説](https://docs.python.org/ja/3/library/multiprocessing.html)

### 4章
マルチスレッドに関する説明をしている。なお、[最新版のPython3.13ではGILを無効化できるらしい](https://docs.python.org/3/whatsnew/3.13.html#free-threaded-cpython)

Cpythonではスレッドの排他制御の仕組みとしてGILが使用されているが、C言語で書かれたスレッドセーフでないライブラリを使用できるようにするためらしい()

I/O処理などの待ちが発生したタイミングで他のスレッドにGILを渡す


`sys.getswitchinterval()`で現在のスレッドの切り替え間隔を取得(デフォルトは5ms)  
`sys.setswitchinterval(value) `でスレッドの切り替え間隔を設定


- Daemon

https://docs.python.org/3/library/threading.html
> A boolean value indicating whether this thread is a daemon thread (True) or not (False). This must be set before start() is called, otherwise RuntimeError is raised. Its initial value is inherited from the creating thread; the main thread is not a daemon thread and therefore all threads created in the main thread default to daemon = False.

残っているスレッドがデーモンスレッドのみになったとき、Pythonプログラム全体が終了して、デーモンスレッドも終了する。

ythonでは、スレッドのうち最初に完了したものを待つための専用のメソッドがなく、通常のjoin()メソッドを使うと、すべてのスレッドが完了するのを待つしかありません。

代替方法の問題点：

例えば、各スレッドの is_alive() を繰り返しチェックすることで、スレッドが終了したかどうかを確認する方法も考えられますが、これはCPUリソースを消費するため効率が悪いです。
is_alive()を繰り返し呼び出すことで、Pythonはそのチェックを常に実行し続け、CPUがビジー状態になります。このアプローチは、特にGlobal Interpreter Lock（GIL）の影響があるPythonでは不適切です。

注:
Pythonの concurrent.futures モジュールを使うと、スレッドプールを管理でき、最初に完了したタスクを効率的に取得できる [as_completed() 関数](https://docs.python.org/3/library/concurrent.futures.html#concurrent.futures.as_completed)を使用できます。



ローカル変数はスレッドごとに分離され、他のスレッドからの影響を受けない

![alt text](/images/python_async_book.png)　引用

スタック上でのローカル変数の作成と解放:

関数内で宣言されたローカル変数は、その関数が呼び出されるとスタック領域に作成されます。関数の実行が終わると、そのローカル変数はスタックから取り除かれ、メモリが解放されます。この動作は、関数が終了するたびにスタックが「ポップ」されると表現されています。
通常の関数呼び出し:

通常、プログラム内で関数を呼び出すとき、同じ関数を同時に複数回実行することはできません。1つのスレッドが関数を実行している間は、同じ関数の新たな呼び出しがブロックされるか、順番に実行されます。
スレッドを使った関数の同時実行:

スレッドを使うと、複数のスレッドが同じ関数を「同時に」呼び出すことができます。各スレッドは独自のスタックを持っているため、関数内で作成されたローカル変数もそれぞれのスレッドに独立して存在します。これにより、スレッド間での干渉がなく、同じ関数内のローカル変数を安全に使うことができます。
各スレッドのスタック上のローカル変数:

各スレッドが関数を呼び出すと、スレッドごとにスタックが用意され、そのスタックにローカル変数が作られます。これらのローカル変数は、そのスレッドでのみアクセス可能です。他のスレッドからは直接アクセスできません。