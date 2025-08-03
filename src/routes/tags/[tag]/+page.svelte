<script>
	let { data } = $props();
	import { page } from '$app/state';
	import { Tag } from 'lucide-svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	//blog_published: Trueの記事のみを抽出
	let publishedArticles = $derived(
		data.articles.filter((article) => article.metadata.blog_published)
	);
	let tagSelectedArticles = $derived(
		publishedArticles.filter((article) => article.metadata.topics.includes(page.params.tag))
	);
	let selectedTag = $derived(page.params.tag);
</script>

<svelte:head>
	<title>My Awesome Articles</title>
	<meta name="description" content="There are lots of great articles" />
</svelte:head>

<div class="flex items-center gap-2 mb-6">
	<Tag size="28" />
	<h1 class="text-3xl font-bold">{selectedTag}</h1>
</div>

	<div class="bg-gradient-to-br from-slate-50 to-blue-50 px-4 max-w-7xl mx-auto">
		<div class="p-4 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
			{#each tagSelectedArticles as article}
					<ArticleCard {article} />
			{/each}
		</div>
	</div>


