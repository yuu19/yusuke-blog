<script>
  export let data;
  import ArticleLink from '$lib/components/ArticleLink.svelte';
  const publishedArticles = data.articles.filter(article => article.metadata.blog_published);
</script>

<svelte:head>
  <title>My Awesome Tech Blog</title>
  <meta name="description" content="This tech blog features many wonderful articles." />
</svelte:head>

<div class="py-8 px-4 mb-10 rounded-lg flex flex-col items-center bg-slate-100">
  <h1 class="text-3xl font-bold">My Awesome Tech Blog!</h1>
  <div class="mt-4">
    <p class="text-lg text-gray-600">
      今年の4月に新卒でプログラマーとして就職しました。当面は SvelteKit や FastAPI に関する記事を中心に執筆する予定です。
      記事へのご感想やご意見がありましたら、<a href="/form" class="text-blue-500 underline">こちら</a>からお気軽にお送りください。
    </p>
  </div>
</div>


<ul>
  {#each publishedArticles as article}
    <li>
      <ArticleLink {article} />
    </li>
  {/each}
</ul>