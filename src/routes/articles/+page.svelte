<script>
  let { data } = $props();
  import ArticleLink from '$lib/components/ArticleLink.svelte';
  //blog_published: Trueの記事のみを抽出
  // console.log("デバッグ", data.articles);
  const publishedArticles = data.articles.filter(article => article.metadata.blog_published);
</script>

<svelte:head>
  <title>My Awesome Articles</title>
  <meta name="description" content="There are lots of great articles" />
</svelte:head>

<ul>
  {#each publishedArticles as article}
    <li>
      <ArticleLink {article} />
    </li>
  {/each}
</ul>