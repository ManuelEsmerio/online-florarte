-- Professional order-address snapshot refactor for MySQL 5.7

-- 1) New snapshot table independent from user Address lifecycle
CREATE TABLE `order_addresses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderId` INT NOT NULL,
  `sourceAddressId` INT NULL,
  `alias` VARCHAR(100) NULL,
  `recipientName` VARCHAR(150) NOT NULL,
  `recipientPhone` VARCHAR(20) NULL,
  `streetName` VARCHAR(255) NULL,
  `streetNumber` VARCHAR(20) NULL,
  `interiorNumber` VARCHAR(20) NULL,
  `neighborhood` VARCHAR(150) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `country` VARCHAR(60) NOT NULL DEFAULT 'México',
  `postalCode` VARCHAR(10) NULL,
  `addressType` ENUM('HOME', 'HOTEL', 'RESTAURANT', 'OFFICE', 'HOSPITAL', 'FUNERAL_CHAPEL', 'SCHOOL', 'BANK', 'APARTMENT', 'OTHER') NULL,
  `referenceNotes` TEXT NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `googlePlaceId` VARCHAR(255) NULL,
  `formattedAddress` TEXT NOT NULL,
  `isGuestAddress` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `order_addresses_orderId_key`(`orderId`),
  INDEX `order_addresses_sourceAddressId_idx`(`sourceAddressId`),
  INDEX `order_addresses_postalCode_city_idx`(`postalCode`, `city`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order_addresses`
  ADD CONSTRAINT `order_addresses_orderId_fkey`
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Backfill snapshot data from current orders + optional user addresses
INSERT INTO `order_addresses` (
  `orderId`,
  `sourceAddressId`,
  `alias`,
  `recipientName`,
  `recipientPhone`,
  `streetName`,
  `streetNumber`,
  `interiorNumber`,
  `neighborhood`,
  `city`,
  `state`,
  `country`,
  `postalCode`,
  `addressType`,
  `referenceNotes`,
  `latitude`,
  `longitude`,
  `googlePlaceId`,
  `formattedAddress`,
  `isGuestAddress`,
  `updatedAt`
)
SELECT
  o.`id` AS `orderId`,
  a.`id` AS `sourceAddressId`,
  a.`alias`,
  COALESCE(o.`recipientName`, a.`recipientName`, o.`guestName`, 'Cliente') AS `recipientName`,
  COALESCE(o.`recipientPhone`, a.`recipientPhone`, o.`guestPhone`) AS `recipientPhone`,
  a.`streetName`,
  a.`streetNumber`,
  a.`interiorNumber`,
  a.`neighborhood`,
  a.`city`,
  a.`state`,
  COALESCE(a.`country`, 'México') AS `country`,
  a.`postalCode`,
  a.`addressType`,
  a.`referenceNotes`,
  a.`latitude`,
  a.`longitude`,
  a.`googlePlaceId`,
  COALESCE(
    o.`shippingAddressSnapshot`,
    CONCAT_WS(', ',
      CONCAT_WS(' ', a.`streetName`, a.`streetNumber`, IFNULL(CONCAT('Int. ', a.`interiorNumber`), '')),
      a.`neighborhood`,
      a.`city`,
      a.`state`,
      IFNULL(CONCAT('CP ', a.`postalCode`), NULL)
    ),
    'Dirección por confirmar'
  ) AS `formattedAddress`,
  IF(o.`isGuest` = 1, 1, 0) AS `isGuestAddress`,
  o.`updatedAt`
FROM `orders` o
LEFT JOIN `addresses` a ON a.`id` = o.`addressId`;

-- 3) Remove direct dependency Order -> Address
ALTER TABLE `orders` DROP FOREIGN KEY `orders_addressId_fkey`;

ALTER TABLE `orders`
  DROP COLUMN `addressId`,
  DROP COLUMN `shippingAddressSnapshot`,
  DROP COLUMN `recipientName`,
  DROP COLUMN `recipientPhone`;

-- 4) Helpful operational index for guest orders
CREATE INDEX `orders_isGuest_createdAt_idx` ON `orders`(`isGuest`, `createdAt`);
