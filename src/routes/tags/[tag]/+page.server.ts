import { getPublishedArticles } from '$lib/getArticles';

export async function load({ params }: { params: { tag: string } }) {
	const articles = getPublishedArticles();
	const tag = decodeURIComponent(params.tag);
	return {
		articles,
		tag
	};
}
