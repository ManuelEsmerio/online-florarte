-- AlterTable
ALTER TABLE `users` ADD COLUMN `passwordResetExpiry` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(255) NULL;
