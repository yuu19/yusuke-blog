import { getArticles } from '$lib/getArticles';
import { getPublishedBooks } from '$lib/getBooks';

export async function load() {
	const articles = getArticles();
	const books = getPublishedBooks();

	return {
		articles,
		books
	};
}
