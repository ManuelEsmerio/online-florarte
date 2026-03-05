-- Rename stripeRefundId to externalRefundId for multi-gateway support
-- Drop the old unique index, rename the column, re-add the unique index

ALTER TABLE `refunds` DROP INDEX `refunds_stripeRefundId_key`;
ALTER TABLE `refunds` RENAME COLUMN `stripeRefundId` TO `externalRefundId`;
ALTER TABLE `refunds` ADD UNIQUE INDEX `refunds_externalRefundId_key` (`externalRefundId`);
