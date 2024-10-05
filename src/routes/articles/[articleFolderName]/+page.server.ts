import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import markdown from 'markdown-it';
// import markdownItMermaid from '@markslides/markdown-it-mermaid';
import matter from 'gray-matter';
import { format } from 'date-fns';
import { getArticleFilePath } from '$lib/getArticles';
const readFile = promisify(fs.readFile);

interface LoadParams {
  params: {
    articleFolderName: string; // 例えば 'slug' パラメータを期待する場合
  };
}

export async function load({ params }: LoadParams) {
  const { articleFolderName } = params;
  //const filePath = path.resolve('articles', articleFolderName, `${articleId}.md`);
  const filePath = getArticleFilePath(articleFolderName); 
  let fileContent;

  try {
    fileContent = await readFile(filePath, 'utf-8');
  } catch (err) {
    console.error('ファイルの読み込みに失敗しました', err);
    throw new Error('ファイルの読み込みに失敗しました');
  }

  const parsedMatter = matter(fileContent); //メタデータと本文を分離してdata, contentに格納
  const mdParser = new markdown();
  // const mdParser = new markdown().use(markdownItMermaid);
  const htmlContent = mdParser.render(parsedMatter.content);

  let metadata = parsedMatter.data;
  if(metadata.date instanceof Date) {
    metadata.date = format(metadata.date, 'yyyy-MM-dd');
  }
  return {
    params, 
    htmlContent,
    metadata: parsedMatter.data 
  };
}