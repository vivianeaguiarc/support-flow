-- CreateEnum
CREATE TYPE "FeatureFlagAuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_audits" (
    "id" TEXT NOT NULL,
    "featureFlagId" TEXT,
    "key" TEXT NOT NULL,
    "action" "FeatureFlagAuditAction" NOT NULL,
    "enabled" BOOLEAN,
    "previousEnabled" BOOLEAN,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flag_audits_key_idx" ON "feature_flag_audits"("key");

-- CreateIndex
CREATE INDEX "feature_flag_audits_createdAt_idx" ON "feature_flag_audits"("createdAt");

-- AddForeignKey
ALTER TABLE "feature_flag_audits" ADD CONSTRAINT "feature_flag_audits_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_audits" ADD CONSTRAINT "feature_flag_audits_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
