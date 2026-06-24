-- CreateEnum
CREATE TYPE "KnowledgeArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_articles_tenantId_idx" ON "knowledge_articles"("tenantId");

-- CreateIndex
CREATE INDEX "knowledge_articles_tenantId_status_idx" ON "knowledge_articles"("tenantId", "status");

-- CreateIndex
CREATE INDEX "knowledge_articles_tenantId_category_idx" ON "knowledge_articles"("tenantId", "category");

-- CreateIndex
CREATE INDEX "knowledge_articles_authorId_idx" ON "knowledge_articles"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_articles_tenantId_slug_key" ON "knowledge_articles"("tenantId", "slug");

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
