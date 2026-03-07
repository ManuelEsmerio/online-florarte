-- CreateTable
CREATE TABLE `whatsapp_contacts` (
    `id`         INT          NOT NULL AUTO_INCREMENT,
    `phone`      VARCHAR(20)  NOT NULL,
    `name`       VARCHAR(150) NOT NULL,
    `orderCount` INT          NOT NULL DEFAULT 0,
    `lastSeenAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`  DATETIME(3)  NOT NULL,

    UNIQUE INDEX `whatsapp_contacts_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
