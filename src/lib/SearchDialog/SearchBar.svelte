<script lang="ts">
  import { Search } from 'lucide-svelte';
</script>

<button
  type="button"
  class="flex h-10 min-w-[12rem] items-center gap-3 rounded-full border border-black/10 bg-white/90 px-4 text-sm font-medium text-zinc-700 shadow-sm transition duration-150 hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-white/15 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
>
  <Search
    class="h-4 w-4 text-indigo-500 dark:text-indigo-300"
    aria-hidden="true"
  />
  <span>検索</span>
  <span
    class="ml-auto hidden items-center gap-1 rounded-md border border-black/10 bg-black/5 px-1.5 py-0.5 text-[0.75rem] font-normal tracking-wide text-zinc-500 dark:border-white/15 dark:bg-white/10 dark:text-white/60 md:flex"
  >
    <kbd class="font-sans">⌘</kbd>
    <kbd class="font-sans">K</kbd>
  </span>
</button>
