/*
  Warnings:

  - You are about to drop the column `tags` on the `PostInfo` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `PostInfo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blog_published` to the `PostInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `PostInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `published` to the `PostInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `PostInfo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "PostInfo" DROP COLUMN "tags",
ADD COLUMN     "blog_published" BOOLEAN NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "published" BOOLEAN NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "topics" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "PostInfo_slug_key" ON "PostInfo"("slug");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
