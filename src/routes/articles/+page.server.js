import { getArticles } from '$lib/getArticles';

export async function load() {
  const articles = getArticles();
  console.log("デバッグ", articles);
  return {
    articles
  };
}