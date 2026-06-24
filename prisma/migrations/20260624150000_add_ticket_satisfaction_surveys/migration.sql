-- AlterEnum
ALTER TYPE "TicketHistoryEvent" ADD VALUE 'SATISFACTION_SUBMITTED';

-- CreateTable
CREATE TABLE "ticket_satisfaction_surveys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_satisfaction_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_satisfaction_surveys_ticketId_key" ON "ticket_satisfaction_surveys"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_satisfaction_surveys_tenantId_idx" ON "ticket_satisfaction_surveys"("tenantId");

-- CreateIndex
CREATE INDEX "ticket_satisfaction_surveys_customerId_idx" ON "ticket_satisfaction_surveys"("customerId");

-- CreateIndex
CREATE INDEX "ticket_satisfaction_surveys_submittedAt_idx" ON "ticket_satisfaction_surveys"("submittedAt");

-- AddForeignKey
ALTER TABLE "ticket_satisfaction_surveys" ADD CONSTRAINT "ticket_satisfaction_surveys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_satisfaction_surveys" ADD CONSTRAINT "ticket_satisfaction_surveys_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_satisfaction_surveys" ADD CONSTRAINT "ticket_satisfaction_surveys_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
