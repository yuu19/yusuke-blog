import { getArticles } from "$lib/getArticles";

export async function load() {
  const articles = getArticles();
  return {
    articles
  };
}

// import { getArticles } from "$lib/getArticles";
// import { page_size } from "$lib/constants";

// export async function load({url}: {url: URL}) {
//   const tab = url.searchParams.get('tab') || 'all';
// 	const tag = url.searchParams.get('tag');
// 	const page = +(url.searchParams.get('page') ?? '1');

// 	const endpoint = tab === 'feed' ? 'articles/feed' : 'articles';

// 	const q = new URLSearchParams();

// 	q.set('limit', `${page_size}`);
// 	q.set('offset', `${(page - 1) * page_size}`);
// 	if (tag) q.set('tag', tag);
//   const articles = getArticles();
//   return {
//     articles
//   };
// }