import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import markdown from 'markdown-it';
import matter from 'gray-matter';
import { format } from 'date-fns';
const readFile = promisify(fs.readFile);

export async function load({ params }) {
  const { articleId } = params;
  const filePath = path.resolve('articles', `${articleId}.md`);
  let fileContent;

  try {
    fileContent = await readFile(filePath, 'utf-8');
  } catch (err) {
    console.error('ファイルの読み込みに失敗しました', err);
  }

  const parsedMatter = matter(fileContent); //メタデータと本文を分離してdata, contentに格納
  const mdParser = new markdown();
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