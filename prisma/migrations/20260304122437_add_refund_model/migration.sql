-- CreateTable
CREATE TABLE `refunds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentTransactionId` INTEGER NOT NULL,
    `stripeRefundId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refunds_paymentTransactionId_key`(`paymentTransactionId`),
    UNIQUE INDEX `refunds_stripeRefundId_key`(`stripeRefundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_paymentTransactionId_fkey` FOREIGN KEY (`paymentTransactionId`) REFERENCES `payment_transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
