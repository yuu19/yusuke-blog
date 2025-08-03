<script lang="ts">
	let { data } = $props();
	import type { ArticleInfo } from '$lib/getArticles';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	//blog_published: Trueの記事のみを抽出
	const publishedArticles: ArticleInfo[] = data.articles.filter(
		(article) => article.metadata.blog_published
	);
</script>

<svelte:head>
	<title>My Awesome Articles</title>
	<meta name="description" content="There are lots of great articles" />
</svelte:head>

<!-- <ul>
	{#each publishedArticles as article}
		<li>
			<ArticleLink {article} />
		</li>
	{/each}
</ul> -->
<div class="bg-gradient-to-br from-slate-50 to-blue-50 flex-1 space-y-4 p-8 pt-6">
	<div class="flex items-center justify-between space-y-2">
		<h2 class="text-3xl font-bold tracking-tight">記事一覧</h2>
	</div>

	<div class="px-4 max-w-7xl mx-auto">
		<div class="p-4 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
			{#each publishedArticles as article}
					<ArticleCard {article} />
			{/each}
		</div>
	</div>

</div>

