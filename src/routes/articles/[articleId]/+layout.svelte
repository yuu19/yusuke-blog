<script>
	import 'github-markdown-css/github-markdown-light.css';
	import 'zenn-content-css';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
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
	<div class="mt-4">
		<p>記事へのご感想、ご意見は<a href="/form">問い合わせフォーム</a>からお送りください。</p>
		<Button class="mt-2" href="/articles">記事一覧に戻る</Button>
	</div>
</div>
