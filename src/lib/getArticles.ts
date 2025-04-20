import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Metadata {
	title: string;
	date: string;
	description: string;
	category: string;
	blog_published: boolean;
	published: boolean;
	topics: string[];
}

export interface ArticleInfo {
	slug: string;
	metadata: Metadata;
}

export function getArticles(): ArticleInfo[] {
	const articlesDirectory = path.resolve(process.cwd(), 'articles');
	const filenames = fs.readdirSync(articlesDirectory);

	const articles: ArticleInfo[] = filenames.map((filename: string) => {
		const slug = filename.replace(/\.[^.]+$/, '');
		const fullPath = path.join(articlesDirectory, filename);
		const fileContents = fs.readFileSync(fullPath, 'utf8');
		const { data } = matter(fileContents); //フロントマターを抜き出す

		return { slug, metadata: data as Metadata };
	});

	articles.sort((a, b) => {
		const aDate = new Date(a.metadata.date);
		const bDate = new Date(b.metadata.date);
		return bDate.valueOf() - aDate.valueOf();
	});
	return articles;
}
