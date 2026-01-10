<script>
  import { getContributions } from '$lib/contributions.remote';
  import { githubConfig } from '$lib/github.config';

  const contributions = getContributions();

  const formatDate = (value) => value.split('T')[0];
</script>

<svelte:head>
  <title>Contributions</title>
  <meta
    name="description"
    content="GitHubのPR一覧を表示します。"
  />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <header class="mb-12 text-center">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contributions</h1>
      <p class="text-gray-600">
        GitHub @{githubConfig.username} のPR一覧
      </p>
    </header>

    <main>
      <div class="bg-white rounded-2xl shadow-lg p-8">
        {#if contributions.loading}
          <p class="text-gray-500 text-center">Loading contributions...</p>
        {:else if contributions.error}
          <p class="text-red-600 text-center">Contributionsの取得に失敗しました。</p>
        {:else if (contributions.current?.length ?? 0) === 0}
          <p class="text-gray-500 text-center">表示できるContributionsがありません。</p>
        {:else}
          <ul class="space-y-4">
            {#each contributions.current as pr (pr.id)}
              <li class="rounded-xl border border-gray-100 p-4 transition hover:shadow-md">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    class="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pr.title}
                  </a>
                  <span class="text-sm font-medium text-gray-500">{pr.repository}</span>
                </div>
                <div class="mt-2 text-sm text-gray-400">
                  Updated: {formatDate(pr.updatedAt)}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </main>
  </div>
</div>
