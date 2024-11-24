import { getArticles } from '$lib/getArticles';

export async function load({ params }: { params: { tag: string } }) {
  const articles = getArticles();
  const tag = decodeURIComponent(params.tag);
  return {
    articles,
    tag
  };
}