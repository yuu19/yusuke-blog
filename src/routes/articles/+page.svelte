<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import ArticlePagination from '$lib/components/ArticlePagination.svelte';
	import { ARTICLES_PER_PAGE } from '$lib/constants';
	import { fly } from 'svelte/transition';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// blog_published: true の記事のみ表示
	let publishedArticles = $derived(
		data.articles.filter((article) => article.metadata.blog_published)
	);
	let publishedBooks = $derived(data.books);

	let totalArticleCount = $derived(publishedArticles.length);
	let totalBookCount = $derived(publishedBooks.length);

	let topicOptions = $derived.by(() => {
		const topics = [
			...publishedArticles.flatMap((article) => article.metadata.topics ?? []),
			...publishedBooks.flatMap((book) => book.metadata.topics ?? [])
		];
		const uniqueTopics = topics.filter((topic, index) => topics.indexOf(topic) === index);
		return ['すべて', ...uniqueTopics.sort((a, b) => a.localeCompare(b, 'ja'))];
	});

	let searchQuery = $state('');
	let activeTopic = $state<string>('すべて');
	let sortOrder = $state<'newest' | 'oldest'>('newest');

	let filteredArticles = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		const topic = activeTopic;

		return publishedArticles
			.filter((article) => {
				const matchesTopic = topic === 'すべて' || (article.metadata.topics ?? []).includes(topic);
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

	let filteredBooks = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		const topic = activeTopic;

		return publishedBooks
			.filter((book) => {
				const matchesTopic = topic === 'すべて' || (book.metadata.topics ?? []).includes(topic);
				const searchableText = [
					book.metadata.title ?? '',
					book.metadata.summary ?? '',
					(book.metadata.topics ?? []).join(' '),
					book.chapters.map((chapter) => chapter.title).join(' ')
				]
					.join(' ')
					.toLowerCase();
				const matchesQuery = query === '' || searchableText.includes(query);

				return matchesTopic && matchesQuery;
			})
			.sort((a, b) => a.metadata.title.localeCompare(b.metadata.title, 'ja'));
	});

	let visibleArticleCount = $derived(filteredArticles.length);
	let visibleBookCount = $derived(filteredBooks.length);
	let visibleTotalCount = $derived(visibleArticleCount + visibleBookCount);
	let totalArticlePages = $derived(Math.max(1, Math.ceil(visibleArticleCount / ARTICLES_PER_PAGE)));

	const normalizePage = (value: string | null) => {
		const parsed = Number.parseInt(value ?? '1', 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
	};

	const clampPage = (nextPage: number, maxPage: number) => {
		return Math.min(Math.max(1, nextPage), Math.max(1, maxPage));
	};

	let currentPage = $state(1);
	let currentPageClamped = $derived(clampPage(currentPage, totalArticlePages));
	let articleListAnimationKey = $derived.by(
		() =>
			`articles:${currentPageClamped}:${searchQuery.trim().toLowerCase()}:${activeTopic}:${sortOrder}`
	);
	let previousSearchQuery = $state('');
	let previousActiveTopic = $state('すべて');
	let previousSortOrder = $state<'newest' | 'oldest'>('newest');

	let pagedArticles = $derived.by(() => {
		const start = (currentPageClamped - 1) * ARTICLES_PER_PAGE;
		return filteredArticles.slice(start, start + ARTICLES_PER_PAGE);
	});

	let visibleArticleStart = $derived(
		visibleArticleCount === 0 ? 0 : (currentPageClamped - 1) * ARTICLES_PER_PAGE + 1
	);
	let visibleArticleEnd = $derived(Math.min(currentPageClamped * ARTICLES_PER_PAGE, visibleArticleCount));

	$effect(() => {
		const safePage = clampPage(normalizePage(page.url.searchParams.get('page')), totalArticlePages);
		currentPage = safePage;
	});

	$effect(() => {
		if (
			searchQuery !== previousSearchQuery ||
			activeTopic !== previousActiveTopic ||
			sortOrder !== previousSortOrder
		) {
			previousSearchQuery = searchQuery;
			previousActiveTopic = activeTopic;
			previousSortOrder = sortOrder;
			if (currentPage !== 1) {
				currentPage = 1;
			}
		}
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

	function resetFilters() {
		searchQuery = '';
		activeTopic = 'すべて';
		sortOrder = 'newest';
		currentPage = 1;
	}
</script>

<svelte:head>
	<title>Yusuke Blog - 記事と本の検索</title>
	<meta
		name="description"
		content="Yusuke Blog に公開されている記事と本をまとめて検索できるページです"
	/>
</svelte:head>

<section class="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
	<div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-0 py-8 sm:gap-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
		<header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
					Articles & Books
				</p>
				<h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
					記事と本を検索
				</h1>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
					全{totalArticleCount}件の記事と{totalBookCount}冊の本から検索・絞り込みができます。
				</p>
			</div>
			{#if totalArticleCount + totalBookCount > 0}
				<div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
					<select
						class="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-auto"
						bind:value={sortOrder}
						aria-label="記事の並び順"
					>
						<option value="newest">記事: 新しい順</option>
						<option value="oldest">記事: 古い順</option>
					</select>
					<button
						type="button"
						onclick={resetFilters}
						class="w-full rounded-full border border-transparent bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 sm:w-auto"
						aria-label="フィルターをリセット"
					>
						リセット
					</button>
				</div>
			{/if}
		</header>

		{#if totalArticleCount + totalBookCount > 0}
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60">
					<label class="flex flex-col items-stretch gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-inner focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:px-4 sm:py-2">
						<span class="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 sm:text-sm sm:font-medium sm:normal-case sm:tracking-normal">キーワード検索</span>
						<input
							type="search"
							placeholder="タイトル・概要・タグで検索..."
							bind:value={searchQuery}
							class="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 sm:flex-1"
						/>
					</label>

					<div class="flex flex-wrap items-center gap-2">
						<span class="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
							トピック
						</span>
						{#each topicOptions as topic (topic)}
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
					{visibleTotalCount}件ヒット: 記事 {visibleArticleCount}件 / 本 {visibleBookCount}冊
				</p>
			</div>

			<div class="flex flex-col gap-10">
				<section class="space-y-4">
					<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
						<h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">記事</h2>
						<p class="text-sm text-slate-500 dark:text-slate-400">
							{visibleArticleCount}件（{visibleArticleStart}-{visibleArticleEnd}件を表示）
						</p>
					</div>
					{#if visibleArticleCount > 0}
						{#key articleListAnimationKey}
							<div
								class="space-y-6"
								in:fly={{ x: 20, y: 10, duration: 240, opacity: 0.1 }}
								out:fly={{
									x: -20,
									y: -10,
									duration: 190,
									opacity: 0.1
								}}
							>
								<ul class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
									{#each pagedArticles as article (article.slug)}
										<li class="flex">
											<ArticleCard {article} />
										</li>
									{/each}
								</ul>
								<ArticlePagination
									totalCount={visibleArticleCount}
									perPage={ARTICLES_PER_PAGE}
									bind:currentPage
								/>
							</div>
						{/key}
					{:else}
						<div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
							<p class="text-sm text-slate-600 dark:text-slate-400">該当する記事はありません。</p>
						</div>
					{/if}
				</section>

				<section class="space-y-4">
					<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
						<h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">本</h2>
						<p class="text-sm text-slate-500 dark:text-slate-400">{visibleBookCount}冊</p>
					</div>
					{#if visibleBookCount > 0}
						<ul class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{#each filteredBooks as book (book.slug)}
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
										<h3 class="mt-5 text-xl font-semibold leading-snug text-slate-900 transition group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-300">
											{book.metadata.title}
										</h3>
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
						<div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
							<p class="text-sm text-slate-600 dark:text-slate-400">該当する本はありません。</p>
						</div>
					{/if}
				</section>
			</div>
		{:else}
			<div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
				<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
					公開済みの記事と本がまだありません
				</h2>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
					記事や本を公開するとここに表示されます。
				</p>
			</div>
		{/if}
	</div>
</section>
