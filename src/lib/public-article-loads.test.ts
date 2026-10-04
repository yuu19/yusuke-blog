import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getArticles, getPublishedArticles } from './getArticles';
import { load as loadHome } from '../routes/+page.server';
import { load as loadArticles } from '../routes/articles/+page.server';
import { load as loadTag } from '../routes/tags/[tag]/+page.server';

const { fixtures } = vi.hoisted(() => ({
	fixtures: [
		{ slug: 'public-old', date: '2026-01-01', flag: 'true', published: false },
		{ slug: 'draft', date: '2026-06-01', flag: 'false', published: false },
		{ slug: 'zenn-only', date: '2026-05-01', flag: 'false', published: true },
		{ slug: 'missing-flag', date: '2026-04-01', flag: undefined, published: true },
		{ slug: 'string-flag', date: '2026-03-01', flag: '"true"', published: true },
		{ slug: 'public-new', date: '2026-02-01', flag: 'true', published: true }
	]
}));

// Exercise the real frontmatter reader and public filter with mixed article files.
vi.mock('fs', () => ({
	default: {
		readdirSync: () => [...fixtures.map(({ slug }) => `${slug}.md`), 'README.txt'],
		readFileSync: (file: string) => {
			const fixture = fixtures.find(({ slug }) => `${slug}.md` === path.basename(file));
			if (!fixture) throw new Error(`Unexpected fixture: ${file}`);
			return [
				'---',
				`title: title-${fixture.slug}`,
				`description: description-${fixture.slug}`,
				`date: "${fixture.date}"`,
				`topics: [shared-topic, topic-${fixture.slug}]`,
				`published: ${fixture.published}`,
				...(fixture.flag === undefined ? [] : [`blog_published: ${fixture.flag}`]),
				'---',
				`body-${fixture.slug}`
			].join('\n');
		}
	}
}));

// Book discovery is independent of the article publication boundary.
vi.mock('$lib/getBooks', () => ({
	getPublishedBooks: () => [{ slug: 'published-book' }]
}));

describe('public article data', () => {
	it('keeps the all-article path available for internal tooling', () => {
		expect(getArticles()).toHaveLength(fixtures.length);
	});

	it('requires blog_published: true independently of the Zenn published setting', () => {
		expect(getPublishedArticles().map(({ slug }) => slug)).toEqual(['public-new', 'public-old']);
	});

	it.each([
		['home', loadHome],
		['article index', loadArticles],
		['tag index', () => loadTag({ params: { tag: 'shared-topic' } })]
	] as const)('%s returns only public metadata in the original date order', async (_name, load) => {
		const result = await load();
		expect(result.articles.map(({ slug }) => slug)).toEqual(['public-new', 'public-old']);
		expect(result.articles.map(({ metadata }) => metadata.title)).toEqual([
			'title-public-new',
			'title-public-old'
		]);
		const payload = JSON.stringify(result);
		for (const { slug } of fixtures.filter(({ flag }) => flag !== 'true')) {
			expect(payload).not.toContain(slug);
		}
	});

	it('preserves published books in the combined search index', async () => {
		expect((await loadArticles()).books).toEqual([{ slug: 'published-book' }]);
	});

	it('preserves the decoded tag used by the tag page', async () => {
		expect((await loadTag({ params: { tag: encodeURIComponent('日本語') } })).tag).toBe('日本語');
	});
});
