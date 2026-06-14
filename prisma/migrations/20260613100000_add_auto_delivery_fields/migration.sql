ALTER TABLE "Product" ADD COLUMN "deliveryMode" TEXT NOT NULL DEFAULT 'local_stock';
ALTER TABLE "Product" ADD COLUMN "supplierApiBaseUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplierAppId" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplierAppKey" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplierSharedCode" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplierRace" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplierSkuJson" JSONB;
ALTER TABLE "Product" ADD COLUMN "supplierCardId" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplierDevice" TEXT;

ALTER TABLE "Order" ADD COLUMN "autoDeliveryStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "autoDeliveryMessage" TEXT;
ALTER TABLE "Order" ADD COLUMN "autoDeliveryAttemptedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "supplierTradeNo" TEXT;
