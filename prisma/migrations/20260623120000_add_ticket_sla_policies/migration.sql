-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "defaultSlaHours" INTEGER NOT NULL DEFAULT 72;

-- AlterTable
ALTER TABLE "ticket_categories" ADD COLUMN "slaHours" INTEGER;
