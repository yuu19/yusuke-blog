---
title: 'Sveltekitでの型定義'
description: 'Sveltekit上で定義されている型定義を読み解くことを通じて、
Typescriptでの型定義に慣れることが目標。'
date: 2024-08-19
topics: ["sveltekit"]
blog_published: False
published: False
---


### ActionResult

- 型定義

```
type ActionResult<
	Success extends
		| Record<string, unknown>
		| undefined = Record<string, any>,
	Failure extends
		| Record<string, unknown>
		| undefined = Record<string, any>
> =
	| { type: 'success'; status: number; data?: Success }
	| { type: 'failure'; status: number; data?: Failure }
	| { type: 'redirect'; status: number; location: string }
	| { type: 'error'; status?: number; error: any };
  ```