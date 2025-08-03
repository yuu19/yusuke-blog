<script>
  let { topic } = $props();
</script>

<a href={`/tags/${encodeURIComponent(topic)}`} class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200">
  #{topic}
</a>
