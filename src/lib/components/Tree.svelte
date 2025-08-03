<script>
  import Tree from './Tree.svelte';
  let { tree, activeHeadingIdxs, item, melt } = $props();
</script>

{#each tree as node}
  <div class="toc-item">
    <a
      use:melt={$item(node.id)}
      href="#{node.id}"
      class="toc-link {activeHeadingIdxs.includes(node.index) ? 'active' : ''}"
      style="padding-left: {(node.level - 1) * 1}rem"
    >
      <span class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
        {node.title}
      </span>
    </a>
    
    {#if node.children && node.children.length > 0}
      <div class="ml-2">
        <Tree tree={node.children} {activeHeadingIdxs} {item} />
      </div>
    {/if}
  </div>
{/each}
