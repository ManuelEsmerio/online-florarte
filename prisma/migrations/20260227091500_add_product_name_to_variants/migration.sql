ALTER TABLE `product_variants`
  ADD COLUMN `productName` VARCHAR(120) NULL;

UPDATE `product_variants` pv
JOIN `products` p ON p.`id` = pv.`productId`
SET pv.`productName` = p.`name`
WHERE pv.`productName` IS NULL OR TRIM(pv.`productName`) = '';

ALTER TABLE `product_variants`
  MODIFY `productName` VARCHAR(120) NOT NULL;