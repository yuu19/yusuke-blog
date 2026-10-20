import { getPublishedArticles } from '$lib/getArticles';
import { getPublishedBooks } from '$lib/getBooks';

export async function load() {
	const articles = getPublishedArticles();
	const books = getPublishedBooks();

	return {
		articles,
		books
	};
}
