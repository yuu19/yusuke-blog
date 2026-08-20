<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft, ArrowRight, Lock, LockOpen } from 'lucide-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let chapterCount = $derived(data.book.chapters.length);
	let displayParts = $derived(
		data.book.parts.length > 0
			? data.book.parts
			: [{ title: 'チャプター', summary: '', chapters: data.book.chapters }]
	);
	let chapterNumberBySlug = $derived(
		Object.fromEntries(
			data.book.chapters.map((chapter, index) => [
				chapter.slug,
				chapter.displayNumber ?? index + 1
			])
		)
	);
</script>

<svelte:head>
	<title>{data.book.metadata.title} | Books</title>
	<meta name="description" content={data.book.metadata.summary} />
</svelte:head>

<section class="bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950">
	<div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
		{#if data.isDraft}
			<div class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" role="status">
				<strong>DRAFTプレビュー:</strong> このBookは開発環境だけで表示されています。
			</div>
		{/if}
		<div>
			<a
				href={resolve('/books', {})}
				class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
			>
				<ArrowLeft class="h-4 w-4" />
				本一覧に戻る
			</a>
		</div>

		<header class="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800">
			<p class="text-sm font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
				Book
			</p>
			<h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
				{data.book.metadata.title}
			</h1>
			<p class="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
				{data.book.metadata.summary || '概要は未設定です。'}
			</p>
			<div class="mt-6 flex flex-wrap items-center gap-2 text-xs">
				<span class="rounded-full bg-cyan-100 px-3 py-1 font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
					{chapterCount} chapters
				</span>
				<span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
					{data.book.metadata.price > 0
						? `¥${data.book.metadata.price.toLocaleString('ja-JP')}`
						: '無料公開'}
				</span>
				{#if data.book.metadata.topics.length > 0}
					{#each data.book.metadata.topics as topic (topic)}
						<span class="rounded-full bg-cyan-100 px-3 py-1 font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
							#{topic}
						</span>
					{/each}
				{/if}
			</div>
		</header>

		<section class="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800 sm:p-8">
			{#if chapterCount > 0}
				{#each displayParts as part, partIndex (`${part.title}-${partIndex}`)}
					<section aria-labelledby={`book-part-${partIndex}`}>
						<div>
							<p class="text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">Part {partIndex + 1}</p>
							<h2 id={`book-part-${partIndex}`} class="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{part.title}</h2>
							{#if part.summary}
								<p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{part.summary}</p>
							{/if}
						</div>
						<ol class="mt-4 space-y-3">
							{#each part.chapters as chapter (chapter.slug)}
								<li>
							<a
								rel="prefetch"
								href={resolve('/books/[bookId]/[chapterId]', {
									bookId: data.book.slug,
									chapterId: chapter.slug
								})}
								class="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 transition hover:border-cyan-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-cyan-500/50 dark:hover:bg-slate-800"
							>
								<div class="min-w-0">
									<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
										Chapter {chapterNumberBySlug[chapter.slug]}
									</p>
									<p class="truncate text-sm font-medium text-slate-800 transition group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-300">
										{chapter.title}
									</p>
								</div>
								<div class="flex items-center gap-2 text-xs">
									{#if data.book.metadata.price > 0}
										<span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
											{#if chapter.free}
												<LockOpen class="h-3.5 w-3.5" />
												無料公開
											{:else}
												<Lock class="h-3.5 w-3.5" />
												有料
											{/if}
										</span>
									{/if}
									<ArrowRight class="h-4 w-4 text-slate-500 transition group-hover:text-cyan-500 dark:text-slate-400 dark:group-hover:text-cyan-300" />
								</div>
							</a>
								</li>
							{/each}
						</ol>
					</section>
				{/each}
			{:else}
				<p class="mt-4 text-sm text-slate-600 dark:text-slate-400">
					チャプターがまだ登録されていません。
				</p>
			{/if}
		</section>
	</div>
</section>
