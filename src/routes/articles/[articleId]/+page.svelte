<script>
	let { data } = $props();
	import Tag from '$lib/components/Tag.svelte';
	import Tree from '$lib/components/Tree.svelte';
	import { createTableOfContents } from '@melt-ui/svelte';
	import { pushState } from '$app/navigation';

	const {
		elements: { item },
		states: { activeHeadingIdxs, headingsTree }
	} = createTableOfContents({
		selector: '#toc-builder-preview',
		activeType: 'all',
		/**
		 * Here we can optionally provide SvelteKit's `pushState` function.
		 * This function preserve navigation state within the framework.
		 */
		pushStateFn: pushState,
		headingFilterFn: (heading) => !heading.hasAttribute('data-toc-ignore')
	});
</script>

<svelte:head>
	<title>{data.metadata.title}</title>
	<meta name="description" content={data.metadata.description} />
	<script src="https://embed.zenn.studio/js/listen-embed-event.js"></script>
</svelte:head>

<div
	class="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-8"
>
	<!-- タイトル -->
	<div class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
		{data.metadata.title}
	</div>

	<!-- 説明文 -->
	<p class="text-gray-700 dark:text-gray-300 mb-4">
		{data.metadata.description}
	</p>

	<div class="flex items-center space-x-4">
		<!-- タグ（トピック）部分 -->
		<div class="space-x-2">
			{#each data.metadata.topics as topic}
				<Tag {topic} />
			{/each}
		</div>

		<!-- 日付部分 -->
		<span class="text-gray-500 dark:text-gray-400 text-xs">
			{new Date(data.metadata.date).toLocaleDateString()}
		</span>
	</div>
</div>

<div id="toc-builder-preview">
	<div class="grid grid-cols-1 md:grid-cols-[3fr,auto] gap-4 mx-auto max-w-[1280px] znc">
		<article class="markdown-body">
			{@html data.htmlContent}
		</article>

		<aside
			class="
				md:sticky md:top-20 md:self-start /* 常に画面上部 80px 下に固定 */
				md:w-[360px] w-full /* md 以上: 360px / モバイル: 全幅 */
				md:pl-4 pt-4 md:pt-0 /* 余白調整 */
			"
		>
			<div
				class="
					rounded-xl border border-neutral-200
					bg-gray-100 shadow-sm md:max-h-[calc(100vh-7rem)]
					overflow-y-auto
					p-4
				"
			>
				<p class="mb-3 text-sm font-semibold text-neutral-700 tracking-wide">目次</p>

				<nav class="toc space-y-2 text-sm">
					{#key $headingsTree}
						<Tree tree={$headingsTree} activeHeadingIdxs={$activeHeadingIdxs} {item} />
					{/key}
				</nav>
			</div>
		</aside>
	</div>
</div>
