<script>
  import 'github-markdown-css/github-markdown-light.css';
</script>


<div class="flex flex-col min-h-screen p-4">
  <div class="flex-1 markdown-body">
    <slot />
  </div>
  <div class="mt-4">
    <a href="/articles" class="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded inline-block text-center">
      記事一覧に戻る
    </a>
  </div>
</div>