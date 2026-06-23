-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'ESCALATED';

-- DropIndex
DROP INDEX "users_email_key";
