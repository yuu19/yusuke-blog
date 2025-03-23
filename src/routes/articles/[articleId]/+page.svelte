<script>
	let { data } = $props();
	import Tag from '$lib/components/Tag.svelte';
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

<div class="grid grid-cols-1 md:grid-cols-[3fr,auto] gap-4 mx-auto max-w-[1280px] znc">
	<article class="markdown-body">{@html data.htmlContent}</article>
	<aside class="md:w-[360px] md:pl-4 md:pt-0 pt-4">
		<ul>
			{#each data.toc as tocItem}
				<li>
					<a
						href={`#${tocItem.id}`}
						class="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
					>
						{tocItem.text}
					</a>
				</li>
			{/each}
		</ul>
	</aside>
</div>
