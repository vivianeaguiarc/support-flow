-- CreateIndex
CREATE INDEX "tickets_tenantId_createdAt_idx" ON "tickets"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "tickets_tenantId_slaDueAt_idx" ON "tickets"("tenantId", "slaDueAt");

-- CreateIndex
CREATE INDEX "tickets_tenantId_priority_idx" ON "tickets"("tenantId", "priority");
