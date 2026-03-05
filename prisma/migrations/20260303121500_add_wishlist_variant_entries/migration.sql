-- Add variant support and selection keys to wishlist items
ALTER TABLE `wishlist_items`
    ADD COLUMN `variantId` INT NULL,
    ADD COLUMN `selectionKey` VARCHAR(80) NULL;

UPDATE `wishlist_items`
SET `selectionKey` = CONCAT('product:', `productId`)
WHERE `selectionKey` IS NULL OR `selectionKey` = '';

ALTER TABLE `wishlist_items`
    MODIFY COLUMN `selectionKey` VARCHAR(80) NOT NULL;

ALTER TABLE `wishlist_items`
    ADD INDEX `wishlist_items_userId_idx`(`userId`),
    ADD INDEX `wishlist_items_productId_idx`(`productId`);

ALTER TABLE `wishlist_items`
    DROP INDEX `wishlist_items_userId_productId_key`;

CREATE UNIQUE INDEX `wishlist_items_userId_selectionKey_key`
    ON `wishlist_items`(`userId`, `selectionKey`);

CREATE INDEX `wishlist_items_variantId_idx`
    ON `wishlist_items`(`variantId`);

ALTER TABLE `wishlist_items`
    ADD CONSTRAINT `wishlist_items_variantId_fkey`
    FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE;

ALTER TABLE `wishlist_items`
    ADD CONSTRAINT `wishlist_items_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE;
