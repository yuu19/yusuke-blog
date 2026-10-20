import { getPublishedArticles } from '$lib/getArticles';

export async function load() {
	const articles = getPublishedArticles();
	return {
		articles
	};
}
