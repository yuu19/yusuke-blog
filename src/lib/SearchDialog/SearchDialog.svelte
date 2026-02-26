<script lang="ts">
  import { Dialog } from "bits-ui";
  import { PagefindUI } from "@pagefind/default-ui";
  import "@pagefind/default-ui/css/ui.css";
  import { onDestroy } from "svelte";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  let pagefindInitTimer: number | null = null;
  let resultLinkObserver: MutationObserver | null = null;

  function normalizeInternalUrl(url: string) {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        return url;
      }

      let pathname = parsed.pathname;
      pathname = pathname.replace(/\/index\.html$/, "/");
      pathname = pathname.replace(/\.html$/, "");
      parsed.pathname = pathname;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return url;
    }
  }

  function normalizeResultLinks() {
    const searchRoot = document.getElementById("search");
    if (!searchRoot) return;

    searchRoot.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const normalizedHref = normalizeInternalUrl(href);
      if (normalizedHref !== href) {
        link.setAttribute("href", normalizedHref);
      }
    });
  }

  function startResultLinkObserver() {
    const searchRoot = document.getElementById("search");
    if (!searchRoot) return;

    resultLinkObserver?.disconnect();
    resultLinkObserver = new MutationObserver(() => {
      normalizeResultLinks();
    });
    resultLinkObserver.observe(searchRoot, {
      childList: true,
      subtree: true,
    });

    normalizeResultLinks();
  }

  function cleanupSearchDialog() {
    if (typeof window === "undefined") return;

    if (pagefindInitTimer !== null) {
      window.clearTimeout(pagefindInitTimer);
      pagefindInitTimer = null;
    }

    resultLinkObserver?.disconnect();
    resultLinkObserver = null;
    window.removeEventListener("click", handleClick);
  }

  function handleKeyDown(e: KeyboardEvent) {
    // command + k でダイアログを開く
    if (e.metaKey && e.key === "k") {
      handleOpenChange(true);
    }
  }

  let open = $state(false);

  /**
   * リンクをクリックしたときにダイアログを閉じる
   */
  function handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    const link = target?.closest<HTMLAnchorElement>("a[href]");
    if (link) {
      const href = link.getAttribute("href");
      if (href) {
        const normalizedHref = normalizeInternalUrl(href);
        if (normalizedHref !== href) {
          link.setAttribute("href", normalizedHref);
        }
      }
      open = false;
      cleanupSearchDialog();
    }
  }

  function handleOpenChange(o: boolean) {
    open = o;
    if (o) {
      // ダイアログが開いてから <div id="search" /> が表示されるまでちょっと待つ
      pagefindInitTimer = window.setTimeout(() => {
        const searchRoot = document.getElementById("search");
        if (!searchRoot) return;
        searchRoot.innerHTML = "";

        new PagefindUI({
          element: "#search",
          showSubResults: true,
          translations: {
            clear_search: "クリア",
            zero_results:
              "[SEARCH_TERM] に一致する記事は見つかりませんでした。",
            many_results: "[SEARCH_TERM] の検索結果（[COUNT] 件）",
            one_result: "[SEARCH_TERM] の検索結果（[COUNT] 件）",
          },
          processResult: (result) => {
            // 何故か &amp; が含まれているので置換する
            // https://github.com/CloudCannon/pagefind/issues/459
            if (result.meta?.image) {
              result.meta.image = result.meta.image.replaceAll("&amp;", "&");
            }

            if (result.url) {
              result.url = normalizeInternalUrl(result.url);
            }

            const subResults = (result as { sub_results?: Array<{ url?: string }> }).sub_results;
            if (Array.isArray(subResults)) {
              for (const subResult of subResults) {
                if (subResult.url) {
                  subResult.url = normalizeInternalUrl(subResult.url);
                }
              }
            }
            return result;
          },
        });
        startResultLinkObserver();
        document
          .querySelector<HTMLElement>(".pagefind-ui__search-input")
          ?.focus();
      }, 100);

      window.addEventListener("click", handleClick);
    } else {
      cleanupSearchDialog();
    }
  }

  onDestroy(() => {
    cleanupSearchDialog();
  });
</script>

<svelte:document onkeydown={handleKeyDown} />

<Dialog.Root onOpenChange={handleOpenChange} bind:open>
  <Dialog.Trigger>
    {@render children?.()}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="backdrop-blur-xs fixed inset-0 z-50 bg-black/80" />
    <Dialog.Content
      class="outline-hidden fixed left-0 right-0 top-0 z-50 mx-auto mt-8 flex max-h-[90%] min-h-[15rem] max-w-2xl overflow-y-scroll rounded-lg border bg-white p-5 text-zinc-800 md:mt-16 md:max-h-[80%] dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-50"
    >
      <div id="search" class="w-full"></div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(html) {
    --pagefind-ui-primary: rgb(79 70 229);
    --pagefind-ui-text: rgb(38 38 38);
    --pagefind-ui-background: #ffffff;
    --pagefind-ui-border: rgb(209 213 219);
  }

  :global(html.dark) {
    --pagefind-ui-primary: rgb(129 140 248);
    --pagefind-ui-text: rgb(249 250 251);
    --pagefind-ui-background: rgb(24 24 27);
    --pagefind-ui-border: rgb(63 63 70);
  }
</style>
