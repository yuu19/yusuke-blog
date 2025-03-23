<script>
	let { data } = $props();
	import { page } from '$app/state';
	import ArticleLink from '$lib/components/ArticleLink.svelte';
	import { Tag } from 'lucide-svelte';
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

<div class="flex items-center gap-2">
	<Tag size="28" />
	<h1 class="text-3xl font-bold">{selectedTag}</h1>
</div>

<ul>
	{#each tagSelectedArticles as article}
		<li>
			<ArticleLink {article} />
		</li>
	{/each}
</ul>
