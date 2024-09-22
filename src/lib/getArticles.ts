import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';


interface Metadata {
  title: string;
  date: string;
}

interface ArticleInfo {
  slug: string;
  metadata: Metadata;
}

//記事一覧を新しい順に取得する
//slug: 記事のファイル名
//metadata: 記事のメタデータ(タイトル、日付)
export function getArticles(): ArticleInfo[] {
  const articlesDirectory = path.join(process.cwd(), 'articles');
  const filenames = fs.readdirSync(articlesDirectory);
  const articles: ArticleInfo[] = filenames.map((filename: string) => {
    const slug = filename.replace(/\.[^.]+$/, ''); // 拡張子を取り除く
    const fullpass = path.join(articlesDirectory, filename);
    const fileContents = fs.readFileSync(fullpass, 'utf8');
    const { data } = matter(fileContents); 
    const metadata = data as Metadata; // dataはany型なのでMetadata型にキャスト
    //名前と値が同じ場合は省略できる
    //参考: https://azukiazusa.dev/blog/how-to-write-javascript-in-the-modern-world/#%E3%82%AA%E3%83%96%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%E3%81%AE%E7%9C%81%E7%95%A5%E8%A8%98%E6%B3%95
    return {
      slug,
      metadata,
    };
  });

  articles.sort((a, b) => {
    const aDate = new Date(a.metadata.date);
    const bDate = new Date(b.metadata.date);
    return bDate.getTime() - aDate.getTime(); 
  });
  return articles;
}
