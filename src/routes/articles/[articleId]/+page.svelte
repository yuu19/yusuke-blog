<script>
  let { data } = $props();
  
</script>

<svelte:head>
  <title>{data.metadata.title}</title>
  <meta name="description" content={data.metadata.description} />
</svelte:head>


<div class="p-6 bg-green-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-8">
  <!-- タイトル -->
  <div class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
    {data.metadata.title}
  </div>
  
  <!-- 説明文 -->
  <p class="text-gray-700 dark:text-gray-300 mb-4">
    {data.metadata.description}
  </p>
  
  <div class="flex items-center space-x-4">
    <!-- タグ（トピック）部分 -->
    <div class="flex flex-wrap items-center space-x-2">
      {#each data.metadata.topics as topic}
        <a href={`/tags/${encodeURIComponent(topic)}`} class="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 rounded-full text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-200">
          {topic}
        </a>
      {/each}
    </div>
  
    <!-- 日付部分 -->
    <span class="text-gray-500 dark:text-gray-400 text-xs">
      {new Date(data.metadata.date).toLocaleDateString()}
    </span>
  </div>  
</div>




<article class="markdown-body">{@html data.htmlContent}</article>


<!-- 

<div class="py-8 px-4 mb-10 rounded-lg flex flex-col items-center bg-slate-100">
  <h1 class="text-3xl font-bold">{data.metadata.title}</h1>
  <div class="flex justify-center items-center w-full mt-4">
    <p
      class="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-sm mr-2"
    >
      {data.metadata.category}
    </p>
    <p>{data.metadata.description}</p>
    <p class="text-lg text-gray-600 ml-2 text-s">{data.metadata.date}</p>
  </div>
</div> -->

<!-- eslint-disable-next-line svelte/no-at-html-tags -->

