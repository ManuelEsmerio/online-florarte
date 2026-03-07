-- AlterTable
ALTER TABLE `chat_sessions` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `company_meta` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `company_profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `legalName` VARCHAR(255) NOT NULL,
    `tradeName` VARCHAR(255) NULL,
    `rfc` VARCHAR(20) NOT NULL,
    `taxRegime` VARCHAR(100) NULL,
    `fiscalStreet` VARCHAR(255) NULL,
    `fiscalNumber` VARCHAR(20) NULL,
    `fiscalNeighborhood` VARCHAR(150) NULL,
    `fiscalCity` VARCHAR(100) NULL,
    `fiscalState` VARCHAR(100) NULL,
    `fiscalPostalCode` VARCHAR(10) NULL,
    `supportEmail` VARCHAR(255) NULL,
    `billingEmail` VARCHAR(255) NULL,
    `supportPhone` VARCHAR(30) NULL,
    `websiteUrl` VARCHAR(255) NULL,
    `csdCertPath` VARCHAR(500) NULL,
    `csdKeyPath` VARCHAR(500) NULL,
    `csdPassword` VARCHAR(255) NULL,
    `csdSeries` VARCHAR(50) NULL,
    `csdValidFrom` DATETIME(3) NULL,
    `csdValidTo` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_profile_rfc_key`(`rfc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_bank_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profileId` INTEGER NOT NULL,
    `alias` VARCHAR(100) NULL,
    `bankName` VARCHAR(150) NOT NULL,
    `accountNumber` VARCHAR(50) NULL,
    `clabe` VARCHAR(50) NULL,
    `beneficiary` VARCHAR(255) NULL,
    `referenceHint` VARCHAR(255) NULL,
    `swiftCode` VARCHAR(50) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `company_bank_accounts_profileId_idx`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_bank_accounts` ADD CONSTRAINT `company_bank_accounts_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `company_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
