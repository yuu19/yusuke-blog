import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getArticles } from './getArticles';

describe('getArticles', () => {
	it('returns markdown articles sorted by date (newest first)', () => {
		const articles = getArticles();
		expect(articles.length).toBeGreaterThan(0);

		for (let index = 0; index < articles.length - 1; index += 1) {
			const currentDate = new Date(articles[index].metadata.date).getTime();
			const nextDate = new Date(articles[index + 1].metadata.date).getTime();

			if (Number.isFinite(currentDate) && Number.isFinite(nextDate)) {
				expect(currentDate).toBeGreaterThanOrEqual(nextDate);
			}
		}
	});

	it('maps each slug to an existing markdown file and has basic metadata', () => {
		const articlesDirectory = path.resolve(process.cwd(), 'articles');
		const seenSlugs = new Set<string>();

		for (const article of getArticles()) {
			expect(article.slug.trim().length).toBeGreaterThan(0);
			expect(seenSlugs.has(article.slug)).toBe(false);
			seenSlugs.add(article.slug);

			const markdownPath = path.join(articlesDirectory, `${article.slug}.md`);
			expect(fs.existsSync(markdownPath)).toBe(true);

			expect(typeof article.metadata.title).toBe('string');
			expect(Array.isArray(article.metadata.topics)).toBe(true);
			expect(typeof article.metadata.blog_published).toBe('boolean');
		}
	});
});
