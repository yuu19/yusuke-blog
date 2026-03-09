<script lang="ts">
	let { topic, link = true }: { topic: string; link?: boolean } = $props();

	const tagClass =
		'inline-flex items-center rounded-full border border-blue-200 bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 text-sm font-medium text-blue-800 transition-all duration-200 dark:border-blue-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300';
</script>

{#if link}
	<a
		href={`/tags/${encodeURIComponent(topic)}`}
		class={`${tagClass} hover:shadow-md`}
	>
		#{topic}
	</a>
{:else}
	<span
		class={tagClass}
	>
		#{topic}
	</span>
{/if}
