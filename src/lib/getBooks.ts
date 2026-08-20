import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BOOKS_DIRECTORY = path.resolve(process.cwd(), 'books');
const CONFIG_FILENAMES = ['config.yaml', 'config.yml'] as const;

interface RawBookMetadata {
	title?: unknown;
	summary?: unknown;
	topics?: unknown;
	published?: unknown;
	price?: unknown;
	chapters?: unknown;
	parts?: unknown;
}

interface RawBookPartMetadata {
	title?: unknown;
	summary?: unknown;
	chapters?: unknown;
}

interface RawChapterMetadata {
	title?: unknown;
	free?: unknown;
}

export interface BookMetadata {
	title: string;
	summary: string;
	topics: string[];
	published: boolean;
	price: number;
	chapters: string[];
	parts: BookPartMetadata[];
}

export interface BookPartMetadata {
	title: string;
	summary: string;
	chapters: string[];
}

export interface BookChapterInfo {
	slug: string;
	filename: string;
	title: string;
	order: number;
	displayNumber: number | null;
	free: boolean;
}

export interface BookInfo {
	slug: string;
	metadata: BookMetadata;
	parts: BookPartInfo[];
	chapters: BookChapterInfo[];
}

export interface BookPartInfo {
	title: string;
	summary: string;
	chapters: BookChapterInfo[];
}

function getBookDirectory(slug: string): string {
	return path.join(BOOKS_DIRECTORY, slug);
}

function parseYamlConfig(configText: string): RawBookMetadata {
	const { data } = matter(`---\n${configText}\n---`);
	return data as RawBookMetadata;
}

function normalizeStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];

	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean);
}

function normalizeBookParts(value: unknown): BookPartMetadata[] {
	if (!Array.isArray(value)) return [];

	return value.flatMap((candidate) => {
		if (!candidate || typeof candidate !== 'object') return [];

		const part = candidate as RawBookPartMetadata;
		if (typeof part.title !== 'string' || part.title.trim().length === 0) return [];

		return [
			{
				title: part.title.trim(),
				summary: typeof part.summary === 'string' ? part.summary.trim() : '',
				chapters: normalizeStringArray(part.chapters)
			}
		];
	});
}

function uniqueChapterSlugs(chapterSlugs: string[]): string[] {
	return [...new Set(chapterSlugs)];
}

function normalizeBookMetadata(data: RawBookMetadata): BookMetadata {
	const topics = Array.isArray(data.topics)
		? data.topics.filter((topic): topic is string => typeof topic === 'string')
		: [];
	const parts = normalizeBookParts(data.parts);
	const flatPartChapters = parts.flatMap((part) => part.chapters);
	const chapters = uniqueChapterSlugs(
		flatPartChapters.length > 0 ? flatPartChapters : normalizeStringArray(data.chapters)
	);

	return {
		title:
			typeof data.title === 'string' && data.title.trim().length > 0
				? data.title.trim()
				: 'Untitled Book',
		summary:
			typeof data.summary === 'string' && data.summary.trim().length > 0
				? data.summary.trim()
				: '',
		topics,
		published: data.published === true,
		price: typeof data.price === 'number' ? data.price : 0,
		chapters,
		parts
	};
}

function parseChapterSlug(filename: string): { slug: string; numberedOrder: number | null } {
	const withoutExtension = filename.replace(/\.md$/i, '');
	const numberedMatch = withoutExtension.match(/^(\d+)\.(.+)$/);

	if (!numberedMatch) {
		return {
			slug: withoutExtension,
			numberedOrder: null
		};
	}

	return {
		slug: numberedMatch[2],
		numberedOrder: Number(numberedMatch[1])
	};
}

function getChapters(
	bookSlug: string,
	chapterSlugsFromConfig: string[]
): BookChapterInfo[] {
	const bookDirectory = getBookDirectory(bookSlug);
	const chapterFilenames = fs
		.readdirSync(bookDirectory)
		.filter((filename) => filename.toLowerCase().endsWith('.md'));

	const chapterOrderMap = new Map<string, number>();
	for (const [index, chapterSlug] of chapterSlugsFromConfig.entries()) {
		chapterOrderMap.set(chapterSlug, index);
	}

	const hasConfiguredChapters = chapterOrderMap.size > 0;

	const chapters = chapterFilenames.map((filename, index) => {
		const chapterPath = path.join(bookDirectory, filename);
		const chapterContent = fs.readFileSync(chapterPath, 'utf8');
		const { data } = matter(chapterContent);
		const chapterMetadata = data as RawChapterMetadata;
		const { slug, numberedOrder } = parseChapterSlug(filename);

		const chapterTitle =
			typeof chapterMetadata.title === 'string' && chapterMetadata.title.trim().length > 0
				? chapterMetadata.title.trim()
				: slug;
		const orderFromConfig = chapterOrderMap.get(slug);
		const fallbackOrder = Number.MAX_SAFE_INTEGER + index;

		return {
			slug,
			filename,
			title: chapterTitle,
			order:
				orderFromConfig ??
				(hasConfiguredChapters
					? fallbackOrder
					: numberedOrder ?? fallbackOrder),
			displayNumber: numberedOrder,
			free: chapterMetadata.free === true
		};
	});

	chapters.sort((a, b) => {
		if (a.order !== b.order) return a.order - b.order;
		return a.slug.localeCompare(b.slug, 'ja');
	});

	return chapters;
}

function getBookParts(
	partMetadata: BookPartMetadata[],
	chapters: BookChapterInfo[]
): BookPartInfo[] {
	if (partMetadata.length === 0) return [];

	const chapterBySlug = new Map(chapters.map((chapter) => [chapter.slug, chapter]));
	const assignedChapterSlugs = new Set<string>();
	const parts = partMetadata.map((part) => ({
		title: part.title,
		summary: part.summary,
		chapters: part.chapters.flatMap((slug) => {
			if (assignedChapterSlugs.has(slug)) return [];

			const chapter = chapterBySlug.get(slug);
			if (!chapter) return [];

			assignedChapterSlugs.add(slug);
			return [chapter];
		})
	}));
	const ungroupedChapters = chapters.filter(
		(chapter) => !assignedChapterSlugs.has(chapter.slug)
	);

	if (ungroupedChapters.length > 0) {
		parts.push({
			title: 'その他',
			summary: 'config.yamlのpartsに含まれていないチャプター',
			chapters: ungroupedChapters
		});
	}

	return parts;
}

function readBook(bookSlug: string): BookInfo | null {
	const bookDirectory = getBookDirectory(bookSlug);
	const configPath = CONFIG_FILENAMES.map((filename) => path.join(bookDirectory, filename)).find(
		(configFile) => fs.existsSync(configFile)
	);

	if (!configPath) {
		return null;
	}

	const rawConfig = fs.readFileSync(configPath, 'utf8');
	const metadata = normalizeBookMetadata(parseYamlConfig(rawConfig));
	const chapters = getChapters(bookSlug, metadata.chapters);
	const parts = getBookParts(metadata.parts, chapters);

	return {
		slug: bookSlug,
		metadata,
		parts,
		chapters
	};
}

export function getBooks(): BookInfo[] {
	if (!fs.existsSync(BOOKS_DIRECTORY)) {
		return [];
	}

	const bookSlugs = fs
		.readdirSync(BOOKS_DIRECTORY, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
		.map((entry) => entry.name);

	return bookSlugs
		.map((bookSlug) => readBook(bookSlug))
		.filter((book): book is BookInfo => book !== null)
		.sort((a, b) => a.slug.localeCompare(b.slug, 'ja'));
}

export function getPublishedBooks(): BookInfo[] {
	return getBooks().filter((book) => book.metadata.published);
}

export function getBookBySlug(slug: string): BookInfo | undefined {
	return getBooks().find((book) => book.slug === slug);
}

export function getBookChapterBySlug(
	bookSlug: string,
	chapterSlug: string
): BookChapterInfo | undefined {
	return getBookBySlug(bookSlug)?.chapters.find((chapter) => chapter.slug === chapterSlug);
}

export function getBookChapterMarkdown(
	bookSlug: string,
	chapterSlug: string
): string | null {
	const chapter = getBookChapterBySlug(bookSlug, chapterSlug);

	if (!chapter) {
		return null;
	}

	const chapterPath = path.join(getBookDirectory(bookSlug), chapter.filename);

	if (!fs.existsSync(chapterPath)) {
		return null;
	}

	const chapterContent = fs.readFileSync(chapterPath, 'utf8');
	const parsedChapter = matter(chapterContent);
	return parsedChapter.content;
}
