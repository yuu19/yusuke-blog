<script lang="ts">
	import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-svelte';
	import type { PageProps } from './$types';

	type HeadingLevel = 2 | 3 | 4;
	type ChapterHeading = {
		id: string;
		text: string;
		level: HeadingLevel;
	};

	let { data }: PageProps = $props();
	let isIframeLoaded = $state(false);
	let iframeHeight = $state(860);
	let chapterIframe = $state<HTMLIFrameElement | null>(null);
	let tocItems = $state<ChapterHeading[]>([]);
	let activeHeadingId = $state<string | null>(null);
	let pendingAnimationFrameId = 0;

	function bindChapterIframe(node: HTMLIFrameElement) {
		chapterIframe = node;

		return {
			destroy() {
				if (chapterIframe === node) {
					chapterIframe = null;
				}
			}
		};
	}

	function slugifyHeading(text: string): string {
		const normalized = text
			.normalize('NFKD')
			.toLowerCase()
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^\p{L}\p{N}\s-]/gu, '')
			.trim()
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');

		return normalized.length > 0 ? normalized : 'section';
	}

	function syncChapterHeadings() {
		const frameDocument = chapterIframe?.contentDocument;
		if (!frameDocument) return;

		const headingElements = Array.from(
			frameDocument.querySelectorAll<HTMLHeadingElement>('article h2, article h3, article h4')
		);

		const idCounts: Record<string, number> = {};
		const nextTocItems: ChapterHeading[] = [];

		for (const headingElement of headingElements) {
			const text = (headingElement.textContent ?? '').trim();
			if (!text) continue;

			const numericLevel = Number(headingElement.tagName.slice(1));
			if (numericLevel < 2 || numericLevel > 4) continue;

			const baseId =
				headingElement.id.trim().length > 0 ? headingElement.id.trim() : slugifyHeading(text);
			const count = (idCounts[baseId] ?? 0) + 1;
			idCounts[baseId] = count;

			const resolvedId = count === 1 ? baseId : `${baseId}-${count}`;
			headingElement.id = resolvedId;

			nextTocItems.push({
				id: resolvedId,
				text,
				level: numericLevel as HeadingLevel
			});
		}

		tocItems = nextTocItems;

		if (nextTocItems.length === 0) {
			activeHeadingId = null;
			return;
		}

		const stillExists = nextTocItems.some((heading) => heading.id === activeHeadingId);
		if (!stillExists) {
			activeHeadingId = nextTocItems[0].id;
		}
	}

	function getHeadingViewportTop(headingId: string): number | null {
		if (!chapterIframe) return null;

		const frameDocument = chapterIframe.contentDocument;
		const headingElement = frameDocument?.getElementById(headingId);

		if (!headingElement) return null;

		const iframeTop = chapterIframe.getBoundingClientRect().top;
		const headingTop = headingElement.getBoundingClientRect().top;
		return iframeTop + headingTop;
	}

	function updateActiveHeading() {
		if (tocItems.length === 0) {
			activeHeadingId = null;
			return;
		}

		const threshold = 180;
		let nextActiveHeadingId = tocItems[0].id;

		for (const heading of tocItems) {
			const headingTop = getHeadingViewportTop(heading.id);
			if (headingTop === null) continue;

			if (headingTop <= threshold) {
				nextActiveHeadingId = heading.id;
				continue;
			}

			break;
		}

		activeHeadingId = nextActiveHeadingId;
	}

	function scheduleActiveHeadingUpdate() {
		if (pendingAnimationFrameId) return;

		pendingAnimationFrameId = requestAnimationFrame(() => {
			pendingAnimationFrameId = 0;
			updateActiveHeading();
		});
	}

	function scrollToHeading(headingId: string) {
		const headingTop = getHeadingViewportTop(headingId);
		if (headingTop === null) return;

		const offset = 120;
		window.scrollTo({
			top: Math.max(0, window.scrollY + headingTop - offset),
			behavior: 'smooth'
		});

		activeHeadingId = headingId;
	}

	function handleIframeLoad() {
		isIframeLoaded = true;
		syncChapterHeadings();
		scheduleActiveHeadingUpdate();

		// Wait for deferred embeds/layout changes inside srcdoc.
		setTimeout(() => {
			syncChapterHeadings();
			scheduleActiveHeadingUpdate();
		}, 250);
		setTimeout(() => {
			syncChapterHeadings();
			scheduleActiveHeadingUpdate();
		}, 1200);
	}

	function handleFrameMessage(
		event: MessageEvent<{ type?: string; channel?: string; height?: number }>
	) {
		const payload = event.data;
		if (!payload || payload.type !== 'chapter-height') return;
		if (payload.channel !== data.heightChannel) return;
		if (typeof payload.height !== 'number' || payload.height <= 0) return;

		iframeHeight = Math.max(500, Math.ceil(payload.height));
		isIframeLoaded = true;
		scheduleActiveHeadingUpdate();
	}

	let chapterProgress = $derived(`第${data.chapterNumber}章 / 全${data.totalChapters}章`);
	let chapterAccessLabel = $derived(
		data.book.metadata.price > 0 && !data.chapter.free ? '有料チャプター' : '無料公開'
	);
</script>

<svelte:head>
	<title>{data.chapter.title} | {data.book.metadata.title}</title>
	<meta name="description" content={data.book.metadata.summary} />
</svelte:head>

<svelte:window
	onmessage={handleFrameMessage}
	onscroll={scheduleActiveHeadingUpdate}
	onresize={scheduleActiveHeadingUpdate}
/>

<section class="bg-gradient-to-br from-slate-50 via-white to-sky-100/40 dark:from-gray-950 dark:via-slate-900 dark:to-sky-950">
	<div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
		<header class="space-y-4">
			<a
				href={`/books/${data.book.slug}`}
				class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
			>
				<ArrowLeft class="h-4 w-4" />
				本の詳細に戻る
			</a>
			<div class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800 sm:p-8">
				<p class="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
					{data.book.metadata.title}
				</p>
				<h1 class="mt-2 text-2xl font-bold leading-snug text-slate-900 dark:text-slate-100 sm:text-3xl">
					{data.chapter.title}
				</h1>
				<div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
					<span class="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
						{chapterProgress}
					</span>
					<span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
						約{data.estimatedReadingMinutes}分
					</span>
					<span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
						{chapterAccessLabel}
					</span>
				</div>
			</div>
		</header>

		<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
			<article class="order-2 relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800 xl:order-1">
				{#if !isIframeLoaded}
					<div class="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-white/85 text-sm text-slate-500 dark:bg-slate-900/85 dark:text-slate-400">
						<BookOpen class="h-5 w-5 animate-pulse" />
						<span>チャプターを読み込み中です...</span>
					</div>
				{/if}

				<iframe
					{@attach bindChapterIframe}
					title={data.chapter.title}
					srcdoc={data.chapterDocument}
					onload={handleIframeLoad}
					class="w-full border-0 bg-white dark:bg-slate-900"
					style={`height:${iframeHeight}px;`}
					scrolling="no"
				></iframe>
			</article>

			<aside class="order-1 xl:order-2 xl:sticky xl:top-24 xl:h-fit">
				<div class="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800">
					<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
						この章の目次
					</p>

					{#if tocItems.length > 0}
						<nav aria-label="この章の目次" class="mt-3 space-y-1">
							{#each tocItems as heading (heading.id)}
								<button
									type="button"
									onclick={() => scrollToHeading(heading.id)}
									aria-current={heading.id === activeHeadingId ? 'location' : undefined}
									class={`w-full truncate rounded-lg py-2 pr-3 text-left text-sm transition ${
										heading.id === activeHeadingId
											? 'bg-sky-100 font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
											: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
									} ${
										heading.level === 2 ? 'pl-3' : heading.level === 3 ? 'pl-6' : 'pl-9'
									}`}
								>
									{heading.text}
								</button>
							{/each}
						</nav>
					{:else}
						<p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
							見出しを読み込み中です...
						</p>
					{/if}
				</div>
			</aside>
		</div>

		<section class="space-y-4">
			{#if data.nextChapter}
				<a
					rel="prefetch"
					data-sveltekit-preload-data="tap"
					href={`/books/${data.book.slug}/${data.nextChapter.slug}`}
					class="group flex items-center justify-between rounded-2xl border border-transparent bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-4 text-white shadow-lg transition hover:from-sky-500 hover:to-cyan-400"
				>
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-wide text-white/80">次に読む</p>
						<p class="truncate text-base font-semibold">{data.nextChapter.title}</p>
					</div>
					<ArrowRight class="h-5 w-5 transition group-hover:translate-x-1" />
				</a>
			{/if}

			<nav class="grid gap-3 sm:grid-cols-3">
				{#if data.previousChapter}
					<a
						rel="prefetch"
						href={`/books/${data.book.slug}/${data.previousChapter.slug}`}
						class="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 transition hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-sky-500/60"
					>
						<div class="min-w-0">
							<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
								前のチャプター
							</p>
							<p class="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
								{data.previousChapter.title}
							</p>
						</div>
						<ArrowLeft class="h-4 w-4 text-slate-500 transition group-hover:text-sky-500 dark:text-slate-400 dark:group-hover:text-sky-300" />
					</a>
				{:else}
					<div class="flex items-center rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
						最初のチャプターです
					</div>
				{/if}

				<a
					href={`/books/${data.book.slug}`}
					class="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-sky-500/60 dark:hover:text-sky-300"
				>
					本の目次へ戻る
				</a>

				{#if data.nextChapter}
					<a
						rel="prefetch"
						href={`/books/${data.book.slug}/${data.nextChapter.slug}`}
						class="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 transition hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-sky-500/60"
					>
						<div class="min-w-0">
							<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
								次のチャプター
							</p>
							<p class="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
								{data.nextChapter.title}
							</p>
						</div>
						<ArrowRight class="h-4 w-4 text-slate-500 transition group-hover:text-sky-500 dark:text-slate-400 dark:group-hover:text-sky-300" />
					</a>
				{:else}
					<div class="flex items-center justify-end rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
						最終チャプターです
					</div>
				{/if}
			</nav>
		</section>
	</div>
</section>
