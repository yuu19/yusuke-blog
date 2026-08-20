import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getBookBySlug, getPublishedBooks } from '$lib/getBooks';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () =>
	getPublishedBooks().map(({ slug }) => ({
		bookId: slug
	}));

export const load: PageServerLoad = async ({ params }) => {
	const book = getBookBySlug(params.bookId);

	if (!book || (!book.metadata.published && !dev)) {
		error(404, 'Book not found');
	}

	return {
		book,
		isDraft: !book.metadata.published
	};
};
