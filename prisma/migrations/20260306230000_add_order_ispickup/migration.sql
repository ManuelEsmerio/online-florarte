-- Add isPickup flag to orders table (used for WhatsApp click-and-collect orders)
ALTER TABLE `orders`
  ADD COLUMN `isPickup` BOOLEAN NOT NULL DEFAULT FALSE,
  MODIFY COLUMN `guestPhone` VARCHAR(30) NULL;
