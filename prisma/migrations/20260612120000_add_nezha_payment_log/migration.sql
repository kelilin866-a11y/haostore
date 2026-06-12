-- Add Nezha payment methods without affecting existing payment flows.
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'nezha_alipay';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'nezha_wxpay';

-- Store payment gateway diagnostics for create/webhook/error events.
CREATE TABLE "PaymentLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "orderNo" TEXT,
  "provider" TEXT NOT NULL,
  "channel" TEXT,
  "event" TEXT NOT NULL,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentLog_orderId_idx" ON "PaymentLog"("orderId");
CREATE INDEX "PaymentLog_orderNo_idx" ON "PaymentLog"("orderNo");
CREATE INDEX "PaymentLog_provider_idx" ON "PaymentLog"("provider");
CREATE INDEX "PaymentLog_event_idx" ON "PaymentLog"("event");
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");
