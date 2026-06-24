-- AlterEnum
ALTER TYPE "TicketHistoryEvent" ADD VALUE 'SLA_BREACHED';

-- AlterTable
ALTER TABLE "ticket_histories" ADD COLUMN "metadata" JSONB;
