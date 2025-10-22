<script lang="ts">
	interface Props {
		pages: number;
		p: number;
		href: (page: number) => string;
	}

	let { pages, p, href }: Props = $props();

	const range = $derived(() => {
		const count = Math.max(0, Math.floor(pages));
		return Array.from({ length: count }, (_, index) => index + 1);
	});
</script>

{#if pages > 1}
	<nav aria-label="ページネーション" class="flex justify-center">
		<ul class="flex items-center gap-2">
			{#each range as pageNumber}
				<li>
					<a
						href={href(pageNumber)}
						class={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition ${
							pageNumber === p
								? 'border-indigo-500 bg-indigo-500 text-white shadow'
								: 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300'
						}`}
						aria-current={pageNumber === p ? 'page' : undefined}
					>
						{pageNumber}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
