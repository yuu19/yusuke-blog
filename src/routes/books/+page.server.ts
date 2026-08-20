import { dev } from '$app/environment';
import { getBooks, getPublishedBooks } from '$lib/getBooks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const books = dev ? getBooks() : getPublishedBooks();

	return {
		books,
		draftPreviewEnabled: dev
	};
};
