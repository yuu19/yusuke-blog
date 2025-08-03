import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import matter from 'gray-matter';
import { format } from 'date-fns';
// import markdownItMermaid from '@markslides/markdown-it-mermaid';
// import markdownToHtml  from 'zenn-markdown-html';
import lib from 'zenn-markdown-html';
// import parseToc from 'zenn-markdown-html/lib/utils';
const markdownToHtml = lib.default ? lib.default : lib;
const readFile = promisify(fs.readFile);

// build時にそのまま使うとエラーになるため修正
// const markdownToHtml = lib.default ? lib.default : lib;

interface LoadParams {
	params: {
		articleId: string; // 例えば 'slug' パラメータを期待する場合
	};
}

export async function load({ params }: LoadParams) {
	const { articleId } = params;
	//const filePath = path.resolve('articles', articleFolderName, `${articleId}.md`);
	const filePath = path.resolve('articles', `${articleId}.md`);
	const slug = path.basename(filePath, '.md');
	let fileContent;

	try {
		fileContent = await readFile(filePath, 'utf-8');
	} catch (err) {
		console.error('ファイルの読み込みに失敗しました', err);
		throw new Error('ファイルの読み込みに失敗しました');
	}

	const parsedMatter = matter(fileContent); //メタデータと本文を分離してdata, contentに格納
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
