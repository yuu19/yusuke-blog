<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let totalCount = $derived(data.books.length);
</script>

<svelte:head>
	<title>Yusuke Blog - 本一覧</title>
	<meta name="description" content="Yusuke Blog で管理している本の一覧ページです" />
</svelte:head>

<section class="bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
	<div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
		<header class="space-y-3">
			<p class="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
				Books
			</p>
			<h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
				本一覧
			</h1>
			<p class="text-sm text-slate-600 dark:text-slate-400">
				全{totalCount}冊の本を公開しています。
			</p>
		</header>

		{#if totalCount > 0}
			<ul class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.books as book (book.slug)}
					<li class="flex">
						<a
							rel="prefetch"
							href={`/books/${book.slug}`}
							class="group flex w-full flex-col rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800"
						>
							<div class="flex items-start justify-between gap-4">
								<span class="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
									BOOK
								</span>
								<span class="text-xs font-medium text-slate-500 dark:text-slate-400">
									{book.chapters.length} chapters
								</span>
							</div>
							<h2 class="mt-5 text-xl font-semibold leading-snug text-slate-900 transition group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-300">
								{book.metadata.title}
							</h2>
							<p
								class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
								style="display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;"
							>
								{book.metadata.summary || '概要は未設定です。'}
							</p>
							<div class="mt-5 flex flex-wrap items-center gap-2 text-xs">
								<span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
									{book.metadata.price > 0
										? `¥${book.metadata.price.toLocaleString('ja-JP')}`
										: '無料'}
								</span>
								{#if book.metadata.topics.length > 0}
									{#each book.metadata.topics as topic (topic)}
										<span class="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
											#{topic}
										</span>
									{/each}
								{:else}
									<span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
										トピック未設定
									</span>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
				<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
					公開中の本はまだありません
				</h2>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
					`books` ディレクトリに本を追加するとここに表示されます。
				</p>
			</div>
		{/if}
	</div>
</section>
