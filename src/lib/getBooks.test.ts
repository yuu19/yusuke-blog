import { describe, expect, it } from 'vitest';
import {
	getBookBySlug,
	getBookChapterBySlug,
	getBookChapterMarkdown,
	getBooks,
	getPublishedBooks
} from './getBooks';

describe('getBooks', () => {
	it('returns books sorted by slug and keeps chapter order stable', () => {
		const books = getBooks();
		expect(books.length).toBeGreaterThan(0);

		const slugs = books.map((book) => book.slug);
		const sortedSlugs = [...slugs].sort((a, b) => a.localeCompare(b, 'ja'));
		expect(slugs).toEqual(sortedSlugs);

		for (const book of books) {
			for (let index = 0; index < book.chapters.length - 1; index += 1) {
				expect(book.chapters[index].order).toBeLessThanOrEqual(book.chapters[index + 1].order);
			}
		}
	});

	it('returns only published books from getPublishedBooks()', () => {
		const books = getBooks();
		const publishedBooks = getPublishedBooks();

		expect(publishedBooks.length).toBeLessThanOrEqual(books.length);
		expect(publishedBooks.every((book) => book.metadata.published)).toBe(true);
	});

	it('can resolve chapter metadata and markdown by slug', () => {
		const [book] = getPublishedBooks();
		expect(book).toBeDefined();
		if (!book) return;

		const [firstChapter] = book.chapters;
		expect(firstChapter).toBeDefined();
		if (!firstChapter) return;

		const chapterBySlug = getBookChapterBySlug(book.slug, firstChapter.slug);
		expect(chapterBySlug?.filename).toBe(firstChapter.filename);

		const markdown = getBookChapterMarkdown(book.slug, firstChapter.slug);
		expect(typeof markdown).toBe('string');
		expect(markdown?.trim().length).toBeGreaterThan(0);

		expect(getBookBySlug(book.slug)?.slug).toBe(book.slug);
		expect(getBookChapterMarkdown(book.slug, '__missing__')).toBeNull();
	});
});
