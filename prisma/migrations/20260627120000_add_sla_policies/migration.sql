-- CreateTable
CREATE TABLE "sla_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TicketPriority",
    "firstResponseHours" INTEGER NOT NULL,
    "resolutionHours" INTEGER NOT NULL,
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_policy_categories" (
    "id" TEXT NOT NULL,
    "slaPolicyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "sla_policy_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sla_policies_tenantId_idx" ON "sla_policies"("tenantId");

-- CreateIndex
CREATE INDEX "sla_policies_tenantId_isActive_idx" ON "sla_policies"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_tenantId_name_key" ON "sla_policies"("tenantId", "name");

-- CreateIndex
CREATE INDEX "sla_policy_categories_categoryId_idx" ON "sla_policy_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "sla_policy_categories_slaPolicyId_categoryId_key" ON "sla_policy_categories"("slaPolicyId", "categoryId");

-- AddForeignKey
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_policy_categories" ADD CONSTRAINT "sla_policy_categories_slaPolicyId_fkey" FOREIGN KEY ("slaPolicyId") REFERENCES "sla_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_policy_categories" ADD CONSTRAINT "sla_policy_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ticket_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
