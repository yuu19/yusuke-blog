<script>
	import '../app.css';
	import NProgress from 'nprogress';
	import "nprogress/nprogress.css";
    import { Search } from 'lucide-svelte';
	import { afterNavigate, beforeNavigate } from '$app/navigation';

	import SearchDialog from "$lib/SearchDialog/SearchDialog.svelte";
    import SearchBar from "$lib/SearchDialog/SearchBar.svelte";
	
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
	<header class="border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur">
		<div class="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 md:flex-nowrap">
			<a
				href="/"
				class="order-1 text-lg font-semibold tracking-tight text-white transition-colors hover:text-indigo-300"
			>
				Yusuke Blog
			</a>

			<nav
				class="order-3 flex w-full flex-wrap items-center justify-center gap-5 text-sm font-medium text-white/70 transition-colors md:order-2 md:flex-1 md:flex-nowrap"
			>
				<a href="/" class="transition-colors hover:text-white">home</a>
				<a href="/profiles" class="transition-colors hover:text-white">Profile</a>
				<a href="/articles" class="transition-colors hover:text-white">Articles</a>
				<a href="/form" class="transition-colors hover:text-white">Form</a>
			</nav>

			<div class="order-2 flex items-center justify-end md:order-3">
				<SearchDialog>
					<div class="hidden md:block">
						<SearchBar />
					</div>
					<button
						type="button"
						class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/40 hover:text-indigo-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-300 md:hidden"
						aria-label="検索"
					>
						<Search class="h-5 w-5" />
					</button>
				</SearchDialog>
			</div>
		</div>
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
