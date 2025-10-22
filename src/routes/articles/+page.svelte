<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { ArticleInfo } from '$lib/getArticles';

	let { data } = $props();

	// blog_published: True の記事のみ表示
	const publishedArticles: ArticleInfo[] = data.articles.filter(
		(article) => article.metadata.blog_published
	);

	const totalCount = publishedArticles.length;
	const topicSet = new Set<string>();

	for (const article of publishedArticles) {
		for (const topic of article.metadata.topics ?? []) {
			topicSet.add(topic);
		}
	}

const topicOptions = ['すべて', ...Array.from(topicSet).sort((a, b) => a.localeCompare(b, 'ja'))];

let searchQuery = $state('');
let activeTopic = $state<string>(topicOptions[0]);
let sortOrder = $state<'newest' | 'oldest'>('newest');

const filteredArticles = $derived(() => {
	const query = searchQuery.trim().toLowerCase();
	const topic = activeTopic;

	return publishedArticles
		.filter((article) => {
			const matchesTopic =
				topic === 'すべて' || (article.metadata.topics ?? []).includes(topic);
			const searchableText = [
				article.metadata.title ?? '',
				article.metadata.description ?? '',
				(article.metadata.topics ?? []).join(' ')
			]
				.join(' ')
				.toLowerCase();
			const matchesQuery = query === '' || searchableText.includes(query);

			return matchesTopic && matchesQuery;
		})
		.sort((a, b) => {
			const dateA = new Date(a.metadata.date ?? '').getTime();
			const dateB = new Date(b.metadata.date ?? '').getTime();
			if (!Number.isFinite(dateA) || !Number.isFinite(dateB)) return 0;
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
		});
});

const visibleCount = $derived(() => filteredArticles.length);

function resetFilters() {
	searchQuery = '';
	activeTopic = topicOptions[0];
	sortOrder = 'newest';
}
</script>

<svelte:head>
	<title>Yusuke Blog - 記事一覧</title>
	<meta name="description" content="Yusuke Blog に公開されている記事の一覧ページです" />
</svelte:head>

<section class="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
	<div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
		<header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
					Articles
				</p>
				<h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
					記事一覧
				</h1>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
					全{totalCount}件の記事から検索・絞り込みができます。
				</p>
			</div>
			{#if totalCount > 0}
				<div class="flex items-center gap-3">
					<select
						class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
						bind:value={sortOrder}
					>
						<option value="newest">新しい順</option>
						<option value="oldest">古い順</option>
					</select>
					<button
						type="button"
						onclick={resetFilters}
						class="rounded-full border border-transparent bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
						aria-label="フィルターをリセット"
					>
						リセット
					</button>
				</div>
			{/if}
		</header>

		{#if totalCount > 0}
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60">
					<label class="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-inner focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800">
						<span class="text-sm font-medium text-slate-500 dark:text-slate-300">キーワード検索</span>
						<input
							type="search"
							placeholder="タイトルやタグで検索..."
							bind:value={searchQuery}
							class="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
						/>
					</label>

					<div class="flex flex-wrap items-center gap-2">
						<span class="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
							トピック
						</span>
						{#each topicOptions as topic}
							<button
								type="button"
								onclick={() => (activeTopic = topic)}
								class={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
									topic === activeTopic
										? 'bg-indigo-500 text-white shadow'
										: 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
								}`}
								aria-pressed={topic === activeTopic}
							>
								{topic}
							</button>
						{/each}
					</div>
				</div>
				<p class="text-sm text-slate-600 dark:text-slate-400">
					{visibleCount}件の記事が表示されています。
				</p>
			</div>

			{#if visibleCount > 0}
				<ul class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{#each filteredArticles as article (article.slug)}
						<li class="flex">
							<ArticleCard {article} />
						</li>
					{/each}
				</ul>
			{:else}
				<div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
					<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">該当する記事が見つかりませんでした</h2>
					<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
						キーワードやトピックを変更してもう一度お試しください。
					</p>
				</div>
			{/if}
		{:else}
			<div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
				<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">公開済みの記事がまだありません</h2>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
					記事を公開するとここに表示されます。
				</p>
			</div>
		{/if}
	</div>
</section>
