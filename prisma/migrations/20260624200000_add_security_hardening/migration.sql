-- AlterTable
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "SecurityAuditEvent" AS ENUM ('LOGIN_FAILED', 'LOGIN_LOCKED', 'ACCESS_DENIED', 'API_KEY_CREATED', 'API_KEY_REVOKED', 'USER_PERMISSION_ASSIGNED');

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "actorId" TEXT,
    "event" "SecurityAuditEvent" NOT NULL,
    "email" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_audit_logs_tenantId_event_createdAt_idx" ON "security_audit_logs"("tenantId", "event", "createdAt");

-- CreateIndex
CREATE INDEX "security_audit_logs_email_createdAt_idx" ON "security_audit_logs"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
