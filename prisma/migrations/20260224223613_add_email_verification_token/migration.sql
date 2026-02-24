-- AlterTable
ALTER TABLE `users` ADD COLUMN `emailVerificationExpiry` DATETIME(3) NULL,
    ADD COLUMN `emailVerificationToken` VARCHAR(255) NULL;
