<script>
	import 'github-markdown-css/github-markdown-light.css';
	import 'zenn-content-css';
	import * as publicEnv from '$env/static/public';
	import { onMount } from 'svelte';

	const ADSENSE_CLIENT_ID_PATTERN = /^ca-pub-\d{16}$/;
	const adsenseClientId = publicEnv['PUBLIC_ADSENSE_CLIENT_ID'] ?? '';
	const hasValidAdsenseClientId = ADSENSE_CLIENT_ID_PATTERN.test(adsenseClientId);
	const shouldLoadAdsense = import.meta.env.PROD && hasValidAdsenseClientId;

	const { children } = $props();

	onMount(async () => {
		// 'zenn-embed-elements'を動的にインポート
		await import('zenn-embed-elements');
	});
</script>

<svelte:head>
	{#if shouldLoadAdsense}
		<script
			async
			src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
			crossorigin="anonymous"
		></script>
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col">
	<div class="flex-1">
		{@render children()}
	</div>
</div>
