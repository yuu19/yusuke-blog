<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import ArticlePagination from '$lib/components/ArticlePagination.svelte';
	import { ARTICLES_PER_PAGE } from '$lib/constants';
	import { fly } from 'svelte/transition';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let publishedArticles = $derived(data.articles.filter((article) => article.metadata.blog_published));
	let totalArticleCount = $derived(publishedArticles.length);
	let totalPages = $derived(Math.max(1, Math.ceil(totalArticleCount / ARTICLES_PER_PAGE)));

	const normalizePage = (value: string | null) => {
		const parsed = Number.parseInt(value ?? '1', 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
	};

	const clampPage = (nextPage: number, maxPage: number) => {
		return Math.min(Math.max(1, nextPage), Math.max(1, maxPage));
	};

	let currentPage = $state(1);
	let currentPageClamped = $derived(clampPage(currentPage, totalPages));
	let listAnimationKey = $derived(`articles-page-${currentPageClamped}`);

	let pagedArticles = $derived.by(() => {
		const startIndex = (currentPageClamped - 1) * ARTICLES_PER_PAGE;
		return publishedArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
	});

	let visibleStart = $derived(
		totalArticleCount === 0 ? 0 : (currentPageClamped - 1) * ARTICLES_PER_PAGE + 1
	);
	let visibleEnd = $derived(Math.min(currentPageClamped * ARTICLES_PER_PAGE, totalArticleCount));

	$effect(() => {
		const safePage = clampPage(normalizePage(page.url.searchParams.get('page')), totalPages);
		currentPage = safePage;
	});

	$effect(() => {
		const nextUrl = new URL(page.url);
		if (currentPageClamped <= 1) {
			nextUrl.searchParams.delete('page');
		} else {
			nextUrl.searchParams.set('page', String(currentPageClamped));
		}

		if (nextUrl.toString() !== page.url.toString()) {
			replaceState(nextUrl, page.state);
		}
	});

</script>

<svelte:head>
	<title>yusuke memo</title>
	<meta
		name="description"
		content="This is a personal blog where I share my thoughts and experiences."
	/>
</svelte:head>

<div class="mb-8 flex w-full flex-col items-center rounded-lg bg-slate-100 px-2 py-6 sm:mb-10 sm:px-4 sm:py-8">
	<h1 class="text-2xl font-bold sm:text-3xl">技術メモ</h1>
	<div class="mt-4 w-full max-w-3xl">
		<p class="text-sm text-muted-foreground sm:text-base">
			SveltekitやPrisma、Tailwind CSSなどの技術に関するメモをまとめています。
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			全{totalArticleCount}件中 {visibleStart}-{visibleEnd}件を表示
		</p>
	</div>
</div>


<div class="mx-auto max-w-7xl bg-gradient-to-br from-slate-50 to-blue-50 px-0 sm:px-4">
	{#key listAnimationKey}
		<div
			class="grid grid-cols-1 gap-x-6 gap-y-6 p-2 sm:gap-y-8 sm:p-4 md:grid-cols-2 lg:grid-cols-3"
			in:fly={{ x: 18, y: 8, duration: 230, opacity: 0.12 }}
			out:fly={{ x: -18, y: -8, duration: 180, opacity: 0.12 }}
		>
			{#each pagedArticles as article (article.slug)}
				<ArticleCard {article} />
			{/each}
		</div>
	{/key}
	<div class="pb-8">
		<ArticlePagination totalCount={totalArticleCount} perPage={ARTICLES_PER_PAGE} bind:currentPage />
	</div>
</div>
