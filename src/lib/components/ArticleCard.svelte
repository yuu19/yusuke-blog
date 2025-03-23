<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Tag from '$lib/components/Tag.svelte';
	import type { ArticleInfo } from '$lib/getArticles';

	let { article }: { article: ArticleInfo } = $props();
</script>

<a rel="prefetch" href={`/articles/${article.slug}`} class="flex-1">
	<Card.Root class="flex flex-col h-full">
		<Card.Header>
			<Card.Title>{article.metadata.title}</Card.Title>
			<Card.Description></Card.Description>
		</Card.Header>
		<Card.Content class="flex-1">{article.metadata.description}</Card.Content>
		<Card.Footer>
			<div class="flex fles-wrap gap-1">
				{#each article.metadata.topics as topic}
					<Tag {topic} />
				{/each}
			</div>
		</Card.Footer>
	</Card.Root>
</a>
