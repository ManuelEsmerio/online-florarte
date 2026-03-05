-- CreateTable
CREATE TABLE `coupon_redemptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `couponId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `orderId` INTEGER NULL,
    `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `coupon_redemptions_userId_idx`(`userId`),
    INDEX `coupon_redemptions_orderId_idx`(`orderId`),
    UNIQUE INDEX `coupon_redemptions_couponId_userId_key`(`couponId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `coupons_scope_status_idx` ON `coupons`(`scope`, `status`);

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `coupon_redemptions_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `coupon_redemptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `coupon_redemptions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `coupon_categories` RENAME INDEX `coupon_categories_categoryId_fkey` TO `coupon_categories_categoryId_idx`;

-- RenameIndex
ALTER TABLE `coupon_products` RENAME INDEX `coupon_products_productId_fkey` TO `coupon_products_productId_idx`;

-- RenameIndex
ALTER TABLE `coupon_users` RENAME INDEX `coupon_users_userId_fkey` TO `coupon_users_userId_idx`;
