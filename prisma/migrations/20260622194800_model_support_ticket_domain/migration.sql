-- CreateEnum
CREATE TYPE "TicketHistoryEvent" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNED', 'CATEGORY_CHANGED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "document" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- Drop existing ticket relations before restructuring
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_customerId_fkey";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_assignedAgentId_fkey";
DROP TABLE IF EXISTS "tickets";

-- Alter users for multi-tenant
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "users" SET "tenantId" = (SELECT "id" FROM "tenants" LIMIT 1) WHERE "tenantId" IS NULL;

-- Seed default tenant for existing records when empty
INSERT INTO "tenants" ("id", "name", "slug", "updatedAt")
SELECT '00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "tenants");

UPDATE "users" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'AGENT';

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "categoryId" TEXT,
    "customerId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_histories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "event" "TicketHistoryEvent" NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "customers_tenantId_email_key" ON "customers"("tenantId", "email");
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
CREATE UNIQUE INDEX "ticket_categories_tenantId_name_key" ON "ticket_categories"("tenantId", "name");
CREATE INDEX "ticket_categories_tenantId_idx" ON "ticket_categories"("tenantId");
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
CREATE UNIQUE INDEX "tickets_tenantId_protocol_key" ON "tickets"("tenantId", "protocol");
CREATE INDEX "tickets_tenantId_idx" ON "tickets"("tenantId");
CREATE INDEX "tickets_status_idx" ON "tickets"("status");
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");
CREATE INDEX "tickets_customerId_idx" ON "tickets"("customerId");
CREATE INDEX "tickets_assignedToId_idx" ON "tickets"("assignedToId");
CREATE INDEX "tickets_categoryId_idx" ON "tickets"("categoryId");
CREATE INDEX "ticket_histories_tenantId_idx" ON "ticket_histories"("tenantId");
CREATE INDEX "ticket_histories_ticketId_idx" ON "ticket_histories"("ticketId");
CREATE INDEX "ticket_histories_changedById_idx" ON "ticket_histories"("changedById");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ticket_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ticket_histories" ADD CONSTRAINT "ticket_histories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_histories" ADD CONSTRAINT "ticket_histories_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_histories" ADD CONSTRAINT "ticket_histories_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
