<script lang="ts">
  import { onMount } from 'svelte';

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }

  let showPrompt = $state(false);
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  function handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
    event.preventDefault();
    deferredPrompt = event;
    showPrompt = true;
  }

  async function installApp() {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        showPrompt = false;
      }
    } finally {
      deferredPrompt = null;
    }
  }

  function dismissPrompt() {
    showPrompt = false;
    deferredPrompt = null;
  }

  onMount(() => {
    if (!('serviceWorker' in navigator)) {
      return () => undefined;
    }

    const beforeInstallListener = (event: Event) => {
      handleBeforeInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const installedListener = () => {
      showPrompt = false;
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', beforeInstallListener);
    window.addEventListener('appinstalled', installedListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallListener);
      window.removeEventListener('appinstalled', installedListener);
    };
  });
</script>

{#if showPrompt}
  <div class="install-banner" role="dialog" aria-live="polite">
    <div class="banner-content">
      <div>
        <p class="banner-title">Yusuke Blog をホーム画面に追加しませんか？</p>
        <p class="banner-subtitle">オフラインでも記事を閲覧できます。</p>
      </div>
      <div class="banner-actions">
        <button class="button button-secondary" type="button" onclick={dismissPrompt}>
          後で
        </button>
        <button class="button button-primary" type="button" onclick={installApp}>
          インストール
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .install-banner {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 1rem;
    display: flex;
    justify-content: center;
    z-index: 60;
    padding: 0 1rem;
  }

  .banner-content {
    width: min(48rem, 100%);
    background: rgba(17, 24, 39, 0.95);
    color: #f9fafb;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 0 20px 25px -5px rgba(17, 24, 39, 0.3), 0 10px 10px -5px rgba(17, 24, 39, 0.3);
  }

  .banner-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .banner-subtitle {
    font-size: 0.875rem;
    margin: 0.25rem 0 0;
    color: rgba(243, 244, 246, 0.8);
  }

  .banner-actions {
    display: flex;
    gap: 0.75rem;
    margin-left: auto;
  }

  .button {
    border-radius: 9999px;
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }

  .button:hover {
    transform: translateY(-1px);
  }

  .button-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
  }

  .button-secondary {
    background: rgba(249, 250, 251, 0.15);
    color: #f9fafb;
  }

  @media (max-width: 640px) {
    .banner-content {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .banner-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .button {
      flex: 1;
    }
  }
</style>
