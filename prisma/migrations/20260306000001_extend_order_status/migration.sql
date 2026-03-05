-- AlterTable: extend OrderStatus enum with PAYMENT_FAILED and EXPIRED
-- These two new states are additive — no existing rows need updating.
-- PENDING   → order created, awaiting payment (unchanged)
-- PAYMENT_FAILED → failed payment attempt, still active for retry (NEW)
-- PROCESSING → payment confirmed, fulfillment started (unchanged)
-- SHIPPED / DELIVERED / CANCELLED → unchanged
-- EXPIRED   → never paid within the allowed window (NEW)

ALTER TABLE `orders`
  MODIFY COLUMN `status` ENUM(
    'PENDING',
    'PAYMENT_FAILED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'EXPIRED'
  ) NOT NULL DEFAULT 'PENDING';
