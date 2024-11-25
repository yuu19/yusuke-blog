// src/routes/api/comments/+server.js

import { prisma } from '$lib/prisma';

export async function POST({ request }: { request: Request }): Promise<Response> {
  const { postId, content, parentId } = await request.json();

  if (!postId || !content) {
    return new Response(JSON.stringify({ error: '記事IDとコメント内容は必須です' }), { status: 400 });
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        postId,
        content,
        parentId,
      },
    });

    return new Response(JSON.stringify(newComment), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'コメントの作成に失敗しました' }), { status: 500 });
  }
}
