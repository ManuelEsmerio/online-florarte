-- Rename stripePaymentId to externalPaymentId and add gateway column
-- Step 1: Drop old unique index on stripe_payment_id
ALTER TABLE `payment_transactions` DROP INDEX `payment_transactions_stripePaymentId_key`;

-- Step 2: Rename the column (MySQL 8.0+)
ALTER TABLE `payment_transactions` RENAME COLUMN `stripePaymentId` TO `externalPaymentId`;

-- Step 3: Add the gateway column with default 'stripe' for existing rows
ALTER TABLE `payment_transactions` ADD COLUMN `gateway` VARCHAR(50) NOT NULL DEFAULT 'stripe';

-- Step 4: Re-create the unique index on externalPaymentId
CREATE UNIQUE INDEX `payment_transactions_externalPaymentId_key` ON `payment_transactions`(`externalPaymentId`);
