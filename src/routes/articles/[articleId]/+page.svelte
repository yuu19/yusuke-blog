<script lang="ts">
  let { data } = $props();
  import Tag from '$lib/components/Tag.svelte';
  import Tree from '$lib/components/Tree.svelte';
  import { createTableOfContents } from '@melt-ui/svelte';
  import { pushState } from '$app/navigation';
  import { Calendar, Clock, BookOpen } from 'lucide-svelte';
  import 'github-markdown-css/github-markdown-light.css';
  import 'zenn-content-css';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Separator } from "$lib/components/ui/separator/index.js";
  import Comment from './Comment.svelte';
  import { ArrowLeft, MessageCircle, Share2 } from 'lucide-svelte';


  const {
    elements: { item },
    states: { activeHeadingIdxs, headingsTree }
  } = createTableOfContents({
    selector: '#toc-builder-preview',
    activeType: 'all',
    pushStateFn: pushState,
    headingFilterFn: (heading) => !heading.hasAttribute('data-toc-ignore')
  });

  // 読了時間を計算する関数（仮の実装）
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textLength = content.replace(/<[^>]*>/g, '').length;
    const words = textLength / 5; // 日本語の場合の概算
    return Math.ceil(words / wordsPerMinute);
  };

  let readingTime = $derived(calculateReadingTime(data.htmlContent));

  // 読了進捗の更新
  if (typeof window !== 'undefined') {
    const updateProgress = () => {
      const article = document.querySelector('article');
      const progressBar = document.getElementById('progress-bar');
      const progressText = document.getElementById('reading-progress');
      
      if (article && progressBar && progressText) {
        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        
        const progress = Math.min(
          Math.max((scrollTop - articleTop + windowHeight) / articleHeight, 0),
          1
        );
        
        const percentage = Math.round(progress * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
      }
    };
    
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    
    // 初期化
    setTimeout(updateProgress, 100);
  }

  
  let isLoading = $state(true);
  let embedError = $state(false);

  onMount(async () => {
    try {
      // 'zenn-embed-elements'を動的にインポート
      await import('zenn-embed-elements');
      isLoading = false;
    } catch (error) {
      console.error('Failed to load zenn-embed-elements:', error);
      embedError = true;
      isLoading = false;
    }
  });

  const shareArticle = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href
      });
    } else {
      // フォールバック: URLをクリップボードにコピー
      navigator.clipboard.writeText(window.location.href);
      // TODO: トースト通知を表示
    }
  };
</script>

<svelte:head>
  <title>{data.metadata.title}</title>
  <meta name="description" content={data.metadata.description} />
  <script src="https://embed.zenn.studio/js/listen-embed-event.js"></script>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-100/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <!-- Navigation Header -->
  <header class="px-4 pt-8 sm:px-6 lg:px-8">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onclick={shareArticle}
          class="flex items-center gap-2 rounded-full border-slate-300 bg-white/70 backdrop-blur-sm transition hover:border-indigo-300 hover:text-indigo-500 dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-indigo-400"
        >
          <Share2 class="h-4 w-4" />
          シェア
        </Button>
      </div>
  </header>
  
  <div class="fixed bottom-[100px] md:top-[100px] right-0 z-40 flex flex-col gap-4 invisible lg:visible"><a target="_blank" rel="noopener noreferrer" class="block transition-all duration-300 hover:scale-101" href="https://github.com/yuu19/yusuke-blog/issues"><div class="relative w-[48px] md:h-fit !rounded-[24px_0_0_24px] overflow-hidden glass glass--no-padding cyan-600"><div class="absolute inset-0 bg-gradient-to-r from-cyan-600/20 dark:from-cyan-500/10 to-transparent"></div><div class="relative z-10 h-full flex flex-col items-center justify-center px-2 py-4" style="z-index:1"><div class="flex flex-col items-center gap-4 text-gray-800 text-[1.4rem]"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 496 512" class="icon-16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path></svg><span class="text-[1.4rem] text-center whitespace-nowrap" style="writing-mode:vertical-rl;text-orientation:mixed"><small class="hidden md:block">修正を提案する</small><span class="block md:hidden">修正を提案する</span></span></div></div></div></a></div>
  <!-- Hero Section -->
  <header class="relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-200/40 via-white/10 to-purple-200/30 dark:from-indigo-500/10 dark:via-transparent dark:to-purple-500/10"></div>
    <div class="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div class="flex flex-col items-center text-center gap-6">
        <h1 class="text-balance text-3xl font-bold leading-snug text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl dark:text-white">
          {data.metadata.title}
        </h1>
        <p class="max-w-3xl text-base text-gray-600 sm:text-lg md:text-xl dark:text-gray-300">
          {data.metadata.description}
        </p>
      </div>

      <!-- Article Meta -->
      <div class="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 sm:gap-6 dark:text-gray-400">
        <div class="flex items-center gap-2">
          <Calendar class="h-4 w-4" />
          <span>{new Date(data.metadata.date).toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div class="flex items-center gap-2">
          <Clock class="h-4 w-4" />
          <span>約{readingTime}分で読めます</span>
        </div>
        <div class="flex items-center gap-2">
          <BookOpen class="h-4 w-4" />
          <span>記事</span>
        </div>
      </div>

      <!-- Tags -->
      <div class="flex flex-wrap justify-center gap-2 pt-2 sm:pt-4">
        {#each data.metadata.topics as topic}
          <Tag {topic} />
        {/each}
      </div>
    </div>
  </header>


  <!-- Main Content -->
  <main class="relative">
    <div id="toc-builder-preview" class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr),320px] lg:gap-12 xl:grid-cols-[minmax(0,1fr),360px]">
        
        <!-- Article Content -->
        <article class="min-w-0">
          <Card class="mb-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-xl backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/70">
            <CardContent class="p-0">
              <div class="znc markdown-body space-y-6 p-6 text-base leading-relaxed sm:p-8 lg:p-12">
                {#if isLoading}
                  <div class="flex items-center justify-center py-12">
                    <div class="flex items-center gap-3 text-gray-500">
                      <BookOpen class="w-5 h-5 animate-pulse" />
                      <span>記事を読み込み中...</span>
                    </div>
                  </div>
                {:else if embedError}
                  <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <p class="text-yellow-800 dark:text-yellow-200 text-sm">
                      一部の埋め込みコンテンツが正常に読み込まれませんでした。
                    </p>
                  </div>
                  {@html data.htmlContent}
                {:else}
                  {@html data.htmlContent}
                {/if}
              </div>
            </CardContent>
          </Card>
        </article>

        <!-- 目次は1024px以上の場合のみ表示 -->
        <aside class="hidden lg:block lg:self-start xl:sticky xl:top-8">
          <div class="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/70">
            <div class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <BookOpen class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">目次</h2>
              </div>
              
              <div class="max-h-[calc(100vh-12rem)] overflow-y-auto">
                		<nav class="toc space-y-1">
					{#key $headingsTree}
						<Tree tree={$headingsTree} activeHeadingIdxs={$activeHeadingIdxs} {item} />
					{/key}
				</nav>
                <!-- <nav class="toc space-y-1">
                  {#key headingsTree}
                    <Tree 
                      tree={headingsTree} 
                      activeHeadingIdxs={activeHeadingIdxs} 
                      {item} 
                    />
                  {/key}
                </nav> -->
              </div>
            </div>
          </div>

          <!-- Progress Indicator -->
          <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>読了進捗</span>
              <span id="reading-progress">0%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                id="progress-bar"
                class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                style="width: 0%"
              ></div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Article Actions -->
    <div class="flex justify-center mb-12">
      <div class="flex items-center gap-4">
        <Button 
          variant="outline" 
          href="/articles"
          class="flex items-center gap-2"
        >
          <ArrowLeft class="w-4 h-4" />
          記事一覧
        </Button>
        
        <Separator orientation="vertical" class="h-6" />
        
        <Button
          variant="outline"
          onclick={shareArticle}
          class="flex items-center gap-2"
        >
          <Share2 class="w-4 h-4" />
          この記事をシェア
        </Button>
      </div>
    </div>


  </main>
</div>

<!-- <style lang="postcss">
  :global(.markdown-body) {
    @apply bg-transparent text-gray-800 dark:text-gray-200;
  }

  :global(.markdown-body h1) {
    @apply text-gray-900 dark:text-white;
  }
  :global(.markdown-body h2) {
    @apply text-gray-900 dark:text-white;
  }
  :global(.markdown-body h3) {
    @apply text-gray-900 dark:text-white;
  }
  :global(.markdown-body h4) {
    @apply text-gray-900 dark:text-white;
  }
  :global(.markdown-body h5) {
    @apply text-gray-900 dark:text-white;
  }
  :global(.markdown-body h6) {
    @apply text-gray-900 dark:text-white;
  }

  :global(.markdown-body p) {
    @apply text-gray-700 dark:text-gray-300;
  }
  :global(.markdown-body li) {
    @apply text-gray-700 dark:text-gray-300;
  }

  :global(.markdown-body a) {
    @apply text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300;
  }

  /* :global(.markdown-body code) {
    @apply bg-gray-100 dark:bg-gray-800 text-gray-100 dark:text-gray-200;
  } */

  :global(.markdown-body pre) {
    @apply bg-gray-900 dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
  }

  :global(.markdown-body blockquote) {
    @apply border-l-blue-500 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300;
  }

  :global(.toc a) {
    @apply block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
  }

  :global(.toc a.active) {
    @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium;
  }
</style> -->
