<script>
	let { data } = $props();
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	const publishedArticles = data.articles.filter((article) => article.metadata.blog_published);
</script>

<svelte:head>
	<title>yusuke memo</title>
	<meta
		name="description"
		content="This is a personal blog where I share my thoughts and experiences."
	/>
</svelte:head>

<div class="py-8 px-4 mb-10 rounded-lg flex flex-col items-center bg-slate-100">
	<h1 class="text-3xl font-bold">技術メモ</h1>
	<div class="mt-4">
		<p class="text-muted-foreground">
			SveltekitやPrisma、Tailwind CSSなどの技術に関するメモをまとめています。
		</p>
	</div>
</div>


	<div class="bg-gradient-to-br from-slate-50 to-blue-50 px-4 max-w-7xl mx-auto">
		<div class="p-4 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
			{#each publishedArticles as article}
					<ArticleCard {article} />
			{/each}
		</div>
	</div>
