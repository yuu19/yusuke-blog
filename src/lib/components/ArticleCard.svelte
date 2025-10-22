<script lang="ts">
	import { ArrowRight, Calendar } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import Tag from '$lib/components/Tag.svelte';
	import type { ArticleInfo } from '$lib/getArticles';

	let { article }: { article: ArticleInfo } = $props();

	const topics = article.metadata.topics ?? [];
	const description = article.metadata.description ?? '';
	const publicationDate = article.metadata.date
		? new Date(article.metadata.date).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
		: '';
</script>

<a
	rel="prefetch"
	href={`/articles/${article.slug}`}
	class="group flex flex-1 transform flex-col transition duration-200 hover:-translate-y-1 hover:scale-[1.01]"
>
	<Card.Root class="flex h-full flex-col overflow-hidden rounded-3xl border-0 bg-white/90 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm transition duration-200 group-hover:shadow-xl dark:bg-slate-900/70 dark:ring-slate-700">
		<Card.Header class="space-y-3 border-0 pb-0">
			<p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
				<span class="inline-flex items-center gap-1">
					<Calendar class="h-3.5 w-3.5" aria-hidden="true" />
					{publicationDate || '公開日未設定'}
				</span>
			</p>
			<Card.Title class="text-xl font-semibold leading-snug text-slate-900 transition group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300">
				{article.metadata.title}
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-1 flex-col justify-between gap-6 pt-5">
			<p
				class="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
				style="display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;"
			>
				{description || '説明文が登録されていません。'}
			</p>
			<div class="flex flex-wrap gap-2">
				{#if topics.length > 0}
					{#each topics as topic}
						<Tag {topic} />
					{/each}
				{:else}
					<span class="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
						タグ未設定
					</span>
				{/if}
			</div>
		</Card.Content>
		<Card.Footer class="mt-4 border-0 pt-0">
			<span class="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition group-hover:gap-3 dark:text-indigo-300">
				続きを読む
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</span>
		</Card.Footer>
	</Card.Root>
</a>
