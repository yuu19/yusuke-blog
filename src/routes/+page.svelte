<script>
	let { data } = $props();
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	const publishedArticles = data.articles.filter((article) => article.metadata.blog_published);
</script>

<svelte:head>
	<title>My Awesome Tech Blog</title>
	<meta name="description" content="This tech blog features many wonderful articles." />
</svelte:head>

<div class="py-8 px-4 mb-10 rounded-lg flex flex-col items-center bg-slate-100">
	<h1 class="text-3xl font-bold">My Awesome Tech Blog!</h1>
	<div class="mt-4">
		<p class="text-lg text-gray-600">
			今年の4月に新卒でプログラマーとして就職しました。当面は SvelteKit や FastAPI
			に関する記事を中心に執筆する予定です。
		</p>
	</div>
</div>

<ul>
	<div class="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
		{#each publishedArticles as article}
			<li>
				<ArticleCard {article} />
			</li>
		{/each}
	</div>
</ul>
