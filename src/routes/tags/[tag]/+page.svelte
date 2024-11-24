<script>
  export let data;
  import { page } from '$app/stores';
  import ArticleLink from '$lib/components/ArticleLink.svelte';
  //blog_published: Trueの記事のみを抽出
  $: publishedArticles = data.articles.filter(article => article.metadata.blog_published);
  $: tagSelectedArticles = publishedArticles.filter(article => article.metadata.topics.includes($page.params.tag));
</script>

<svelte:head>
  <title>My Awesome Articles</title>
  <meta name="description" content="There are lots of great articles" />
</svelte:head>

<ul>
  {#each tagSelectedArticles as article}
    <li>
      <ArticleLink {article} />
    </li>
  {/each}
</ul>