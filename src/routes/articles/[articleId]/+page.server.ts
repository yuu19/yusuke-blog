import { error, redirect } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import matter from 'gray-matter';
import { format } from 'date-fns';
// import markdownItMermaid from '@markslides/markdown-it-mermaid';
import { getArticles } from '$lib/getArticles';
import { getZennMarkdownToHtml } from '$lib/server/zennMarkdown';
// import parseToc from 'zenn-markdown-html/lib/utils';
const readFile = promisify(fs.readFile);
const BOOK_SLUG_REINFORCE_FINANCE = 'reinforce-finance-series';
const migratedArticleToBookChapter = new Map<string, string>([
	['rl-finance', 'rl-finance'],
	['rl-finance-2', 'rl-finance-2'],
	['rl-finance-3', 'rl-finance-3'],
	['rl-finance-4', 'rl-finance-4'],
	['rl-finance-5', 'rl-finance-5'],
	['rl-finance-6', 'rl-finance-6'],
	['rl-finance-7', 'rl-finance-7'],
	['rl-finance-8', 'rl-finance-8']
]);

// build時にそのまま使うとエラーになるため修正
// const markdownToHtml = lib.default ? lib.default : lib;

interface LoadParams {
	params: {
		articleId: string; // 例えば 'slug' パラメータを期待する場合
	};
}

export const entries = () =>
	getArticles()
		.filter(({ metadata }) => metadata.blog_published)
		.map(({ slug }) => ({ articleId: slug }));

export async function load({ params }: LoadParams) {
	const { articleId } = params;
	//const filePath = path.resolve('articles', articleFolderName, `${articleId}.md`);
	const filePath = path.resolve('articles', `${articleId}.md`);
	const slug = path.basename(filePath, '.md');
	let fileContent;

	try {
		fileContent = await readFile(filePath, 'utf-8');
	} catch (err) {
		const migratedChapter = migratedArticleToBookChapter.get(articleId);
		if (migratedChapter) {
			redirect(308, `/books/${BOOK_SLUG_REINFORCE_FINANCE}/${migratedChapter}`);
		}

		console.error('ファイルの読み込みに失敗しました', err);
		error(404, '記事が見つかりません');
	}

	const parsedMatter = matter(fileContent); //メタデータと本文を分離してdata, contentに格納
	const markdownToHtml = await getZennMarkdownToHtml();
	const htmlContent = markdownToHtml(parsedMatter.content, {
		embedOrigin: 'https://embed.zenn.studio',
	});
	// const toc = parseToc(htmlContent);
	// console.log('tocデバッグ', toc);
	const metadata = parsedMatter.data;
	if (metadata.date instanceof Date) {
		metadata.date = format(metadata.date, 'yyyy-MM-dd');
	}
	return {
		slug,
		params,
		htmlContent,
		metadata: parsedMatter.data
	};
}
