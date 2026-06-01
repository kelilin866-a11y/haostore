-- CreateTable
CREATE TABLE "InventoryLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "beforeStock" INTEGER NOT NULL,
    "afterStock" INTEGER NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "operationType" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryLog_productId_idx" ON "InventoryLog"("productId");

-- CreateIndex
CREATE INDEX "InventoryLog_variantId_idx" ON "InventoryLog"("variantId");

-- CreateIndex
CREATE INDEX "InventoryLog_operationType_idx" ON "InventoryLog"("operationType");

-- CreateIndex
CREATE INDEX "InventoryLog_createdAt_idx" ON "InventoryLog"("createdAt");

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
