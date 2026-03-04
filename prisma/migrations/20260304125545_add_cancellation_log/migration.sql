-- CreateTable
CREATE TABLE `order_cancellation_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `refundId` INTEGER NULL,
    `cancelledBy` VARCHAR(10) NOT NULL,
    `adminId` INTEGER NULL,
    `refundPercentage` DECIMAL(5, 2) NULL,
    `refundAmount` DECIMAL(10, 2) NULL,
    `cancellationReason` VARCHAR(100) NULL,
    `customReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `order_cancellation_logs_refundId_key`(`refundId`),
    INDEX `order_cancellation_logs_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_cancellation_logs` ADD CONSTRAINT `order_cancellation_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_cancellation_logs` ADD CONSTRAINT `order_cancellation_logs_refundId_fkey` FOREIGN KEY (`refundId`) REFERENCES `refunds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_cancellation_logs` ADD CONSTRAINT `order_cancellation_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
