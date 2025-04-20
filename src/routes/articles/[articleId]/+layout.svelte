<script>
	import 'github-markdown-css/github-markdown-light.css';
	import 'zenn-content-css';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import Comment from './Comment.svelte';
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
		<Button class="mt-2" href="/articles">記事一覧に戻る</Button>
	</div>
	<div class="mt-16">
		<p>コメント欄</p>
		<!-- <div class="zenn-comment" data-id="zenn-embed-comment"></div> -->
		<Comment />
	</div>
</div>
