<script>
  import { onMount } from 'svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Loader2, MessageCircle, AlertCircle } from 'lucide-svelte';

  let isLoading = $state(true);
  let hasError = $state(false);
  let commentBoxLoaded = $state(false);

  onMount(() => {
    // HTMLCommentBoxの読み込み状態を監視
    const checkCommentBox = () => {
      const commentBox = document.getElementById('HCB_comment_box');
      if (commentBox && commentBox.innerHTML.includes('Widget')) {
        // まだ読み込み中
        setTimeout(checkCommentBox, 500);
      } else if (commentBox && commentBox.innerHTML.trim() !== '') {
        // 読み込み完了
        isLoading = false;
        commentBoxLoaded = true;
      } else {
        // エラーまたはタイムアウト
        setTimeout(() => {
          if (isLoading) {
            isLoading = false;
            hasError = true;
          }
        }, 10000); // 10秒でタイムアウト
        setTimeout(checkCommentBox, 500);
      }
    };

    // 初期チェック
    setTimeout(checkCommentBox, 1000);

    // HTMLCommentBoxスクリプトの実行
    try {
      if (!window.hcb_user) {
        window.hcb_user = {};
      }
      
      const script = document.createElement('script');
      const location = window.location.href.replace(/'/g, '%27');
      const baseUrl = 'https://www.htmlcommentbox.com';
      
      script.setAttribute('type', 'text/javascript');
      script.setAttribute('src', 
        baseUrl + '/jread?page=' + encodeURIComponent(location).replace('+', '%2B') +
        '&mod=%241%24wq1rdBcg%2491Zajd7x61J5jOOBLY9e%2F1' +
        '&opts=16798&num=10&ts=' + Date.now()
      );
      
      script.onerror = () => {
        isLoading = false;
        hasError = true;
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to load comment system:', error);
      isLoading = false;
      hasError = true;
    }
  });
</script>

<svelte:head>
  <link
    rel="stylesheet"
    type="text/css"
    href="https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0"
  />
</svelte:head>

<div class="comment-section">
  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 class="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
      <p class="text-gray-600 dark:text-gray-400">コメントを読み込み中...</p>
      <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
        初回読み込みには少し時間がかかる場合があります
      </p>
    </div>
  {:else if hasError}
    <Alert class="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <AlertCircle class="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription class="text-orange-800 dark:text-orange-200">
        コメントシステムの読み込みに失敗しました。ページを再読み込みしてお試しください。
      </AlertDescription>
    </Alert>
  {:else}
    <div class="comment-container">
      <div class="mb-4 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          コメントを投稿するにはログインが必要です
        </p>
      </div>
      
      <!-- HTMLCommentBox Container -->
      <div 
        id="HCB_comment_box" 
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="flex items-center justify-center py-8">
          <div class="flex items-center gap-2 text-gray-500">
            <MessageCircle class="w-5 h-5" />
            <span>コメントを読み込み中...</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  :global(#HCB_comment_box) {
    @apply rounded-lg overflow-hidden;
  }

  :global(#HCB_comment_box .hcb-wrapper) {
    @apply bg-white dark:bg-gray-800;
  }

  :global(#HCB_comment_box .hcb-comment) {
    @apply border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50;
  }

  :global(#HCB_comment_box .hcb-comment-content) {
    @apply text-gray-800 dark:text-gray-200;
  }

  :global(#HCB_comment_box .hcb-comment-author) {
    @apply text-gray-900 dark:text-gray-100 font-medium;
  }

  :global(#HCB_comment_box .hcb-comment-date) {
    @apply text-gray-500 dark:text-gray-400;
  }

  :global(#HCB_comment_box input) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
  }

  :global(#HCB_comment_box textarea) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
  }

  :global(#HCB_comment_box button) {
    @apply bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-md px-4 py-2 transition-colors;
  }
</style>
