<script>
	import '../app.css';
	import NProgress from 'nprogress';
	import "nprogress/nprogress.css";

	import { afterNavigate, beforeNavigate } from '$app/navigation';
	
	beforeNavigate(() => {
		NProgress.start();
	});
	
	afterNavigate(() => {
		NProgress.done();
	});
	
	NProgress.configure({
		showSpinner: false
	});
	
	let { children } = $props();

</script>

<svelte:head>
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-4LE8SDBWB5"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-4LE8SDBWB5');
	</script>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="flex items-center justify-end bg-black px-6 py-3">
		<!-- <h1 class="text-xl font-bold text-white">
			<a href="/" class="text-xl font-bold text-white"> Tech Blog </a>
		</h1> -->
		<nav class="flex gap-4">
			<a href="/" class="text-white hover:text-gray-400">home</a>
			<a href="/profiles" class="text-white hover:text-gray-400">Profile</a>
			<a href="/articles" class="text-white hover:text-gray-400">Articles</a>
			<a href="/form" class="text-white hover:text-gray-400">Form</a>
		</nav>
	</header>

	<div class="flex-grow px-4 py-6">
		{@render children()}
	</div>

	<footer class="bg-black py-2 text-center text-white">
		<p>
			© 2025 - Copyright yusuke, All Rights Reserved. このサイトは Google Analytics
			を使用しています。
		</p>
		<p class="hover:text-gray-400">
			<a href="https://policies.google.com/technologies/partner-sites?hl=ja"
				>詳しくは Google のサービスを使用するサイトやアプリから収集した情報の Google による使用 –
				ポリシーと規約</a
			> をご覧ください。
		</p>
	</footer>
</div>
