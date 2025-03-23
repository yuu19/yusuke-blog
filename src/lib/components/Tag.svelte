<script lang="ts">
	let { topic } = $props();
</script>

<a
	href={`/tags/${encodeURIComponent(topic)}`}
	class="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-sm hover:bg-indigo-200 transition-colors duration-200"
>
	{topic}
</a>
