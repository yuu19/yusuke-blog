import { prisma } from '$lib/prisma';
export async function getCommentsWithReplies(postId: number) {
  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null, // トップレベルのコメントのみ
    },
    include: {
      replies: {
        include: {
          replies: true, // 必要に応じてネストの深さを調整
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  return comments;
}
