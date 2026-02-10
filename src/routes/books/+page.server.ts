import { getPublishedBooks } from '$lib/getBooks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const books = getPublishedBooks();

	return {
		books
	};
};
