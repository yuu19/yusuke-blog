<script>
  import 'github-markdown-css/github-markdown-light.css';
	import 'zenn-content-css';
  import { onMount } from 'svelte';
  const { children } = $props();
  onMount(async () => {
    // 'zenn-embed-elements'を動的にインポート
    await import('zenn-embed-elements');
  });

</script>


<div class="flex flex-col min-h-screen p-4">
  <div class="flex-1 markdown-body">
    {@render children()}
  </div>
  <div class="znc mt-4">
    <p>記事へのご感想、ご意見は<a href="/form">問い合わせフォーム</a>からお送りください。</p>
    <a href="/articles" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow-md inline-block text-center transition-colors duration-200">
      記事一覧に戻る
    </a>
  </div>
</div>