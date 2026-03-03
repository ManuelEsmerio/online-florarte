-- Add support for guest checkout orders
ALTER TABLE `orders`
  MODIFY `userId` INT NULL,
  ADD COLUMN `isGuest` BOOLEAN NOT NULL DEFAULT false AFTER `userId`,
  ADD COLUMN `guestName` VARCHAR(150) NULL AFTER `isGuest`,
  ADD COLUMN `guestEmail` VARCHAR(255) NULL AFTER `guestName`,
  ADD COLUMN `guestPhone` VARCHAR(20) NULL AFTER `guestEmail`,
  ADD COLUMN `sessionId` VARCHAR(128) NULL AFTER `guestPhone`;

CREATE INDEX `orders_sessionId_createdAt_idx` ON `orders`(`sessionId`, `createdAt`);
