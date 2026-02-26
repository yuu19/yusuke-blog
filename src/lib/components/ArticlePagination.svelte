<script lang="ts">
	import * as Pagination from '$lib/components/ui/pagination/index.js';

	interface Props {
		totalCount: number;
		perPage: number;
		currentPage?: number;
	}

	let { totalCount, perPage, currentPage = $bindable(1) }: Props = $props();

	let shouldShow = $derived(totalCount > perPage);
</script>

{#if shouldShow}
	<nav aria-label="記事ページネーション" class="flex justify-center">
		<Pagination.Root bind:page={currentPage} count={totalCount} {perPage}>
			{#snippet children({ pages, currentPage: activePage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton aria-label="前のページ" />
					</Pagination.Item>
					{#each pages as paginationPage (paginationPage.key)}
						{#if paginationPage.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link
									page={paginationPage}
									isActive={activePage === paginationPage.value}
									aria-label={`ページ ${paginationPage.value}`}
								/>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton aria-label="次のページ" />
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	</nav>
{/if}
