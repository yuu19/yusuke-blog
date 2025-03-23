<script>
	let { article } = $props();
	import { format } from 'date-fns';
</script>

<a
	rel="prefetch"
	href={`/articles/${article.slug}`}
	class="m-4 p-4 max-w-sm mx-auto bg-white rounded-lg border border-gray-200 flex flex-col justify-between transition-colors duration-200 ease-in-out hover:bg-gray-100"
>
	<div>
		<div class="text-xl font-medium text-black mb-3">{article.metadata.title}</div>
		<p class="line-clamp-3 hover:line-clamp-4 mb-4">{article.metadata.description}</p>
	</div>
	<div class="flex items-center justify-between">
		<!-- タグ部分 -->
		<div class="flex flex-wrap items-center space-x-2"></div>
		<!-- 日付部分 -->
		<p class="text-gray-500 text-xs">
			{new Date(article.metadata.date).toLocaleDateString()}
		</p>
	</div>
</a>
