import { error } from '@sveltejs/kit';
import {
	getBookBySlug,
	getBookChapterBySlug,
	getBookChapterMarkdown,
	getPublishedBooks
} from '$lib/getBooks';
import { getZennMarkdownToHtml } from '$lib/server/zennMarkdown';
import type { EntryGenerator, PageServerLoad } from './$types';

function estimateReadingMinutes(markdown: string): number {
	const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, ' ');
	const withoutLinks = withoutCodeBlocks.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
	const withoutInlineCode = withoutLinks.replace(/`[^`]*`/g, ' ');
	const plainText = withoutInlineCode.replace(/[#>*_~\-]/g, ' ').replace(/\s+/g, '');
	const charsPerMinute = 550;

	return Math.max(1, Math.ceil(plainText.length / charsPerMinute));
}

function buildChapterDocument(htmlContent: string, heightChannel: string): string {
	return `<!doctype html>
<html lang="ja">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link
			rel="stylesheet"
			href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-light.css"
		/>
		<link
			rel="stylesheet"
			href="https://cdn.jsdelivr.net/npm/zenn-content-css@0.1.158"
		/>
		<style>
			:root {
				color-scheme: light;
			}
			body {
				margin: 0;
				background: #ffffff;
				color: #0f172a;
			}
			.markdown-body {
				box-sizing: border-box;
				min-width: 200px;
				max-width: 100%;
				margin: 0 auto;
				padding: 24px 20px 40px;
				line-height: 1.8;
			}
			@media (min-width: 768px) {
				.markdown-body {
					padding: 36px 32px 56px;
				}
			}
		</style>
		<script src="https://embed.zenn.studio/js/listen-embed-event.js"></script>
		<script type="module">
			import 'https://esm.sh/zenn-embed-elements@0.1.158';
		</script>
	</head>
	<body>
		<article class="znc markdown-body">${htmlContent}</article>
		<script>
			(() => {
				const channel = ${JSON.stringify(heightChannel)};
				const postHeight = () => {
					const doc = document.documentElement;
					const body = document.body;
					const height = Math.max(
						doc ? doc.scrollHeight : 0,
						body ? body.scrollHeight : 0
					);

					window.parent?.postMessage(
						{
							type: 'chapter-height',
							channel,
							height
						},
						'*'
					);
				};

				const scheduleHeight = () => requestAnimationFrame(postHeight);

				window.addEventListener('load', () => {
					postHeight();
					setTimeout(postHeight, 300);
					setTimeout(postHeight, 1200);
				});
				window.addEventListener('resize', scheduleHeight);

				if (window.ResizeObserver && document.body) {
					new ResizeObserver(scheduleHeight).observe(document.body);
				}

				if (window.MutationObserver && document.body) {
					new MutationObserver(scheduleHeight).observe(document.body, {
						childList: true,
						subtree: true,
						attributes: true,
						characterData: true
					});
				}

				postHeight();
			})();
		</script>
	</body>
</html>`;
}

export const entries: EntryGenerator = () =>
	getPublishedBooks().flatMap((book) =>
		book.chapters.map((chapter) => ({
			bookId: book.slug,
			chapterId: chapter.slug
		}))
	);

export const load: PageServerLoad = async ({ params }) => {
	const book = getBookBySlug(params.bookId);

	if (!book || !book.metadata.published) {
		error(404, 'Book not found');
	}

	const chapter = getBookChapterBySlug(params.bookId, params.chapterId);

	if (!chapter) {
		error(404, 'Chapter not found');
	}

	const markdown = getBookChapterMarkdown(params.bookId, params.chapterId);

	if (markdown === null) {
		error(404, 'Chapter not found');
	}

	const chapterIndex = book.chapters.findIndex((bookChapter) => bookChapter.slug === chapter.slug);
	const previousChapter = chapterIndex > 0 ? book.chapters[chapterIndex - 1] : null;
	const nextChapter =
		chapterIndex >= 0 && chapterIndex < book.chapters.length - 1
			? book.chapters[chapterIndex + 1]
			: null;
	const chapterNumber = chapterIndex + 1;
	const totalChapters = book.chapters.length;
	const estimatedReadingMinutes = estimateReadingMinutes(markdown);
	const heightChannel = `${book.slug}:${chapter.slug}`;
	const markdownToHtml = await getZennMarkdownToHtml();
	const htmlContent = markdownToHtml(markdown, {
		embedOrigin: 'https://embed.zenn.studio'
	});
	const chapterDocument = buildChapterDocument(htmlContent, heightChannel);

	return {
		book,
		chapter,
		previousChapter,
		nextChapter,
		chapterNumber,
		totalChapters,
		estimatedReadingMinutes,
		heightChannel,
		chapterDocument
	};
};
