-- CreateTable
CREATE TABLE `chatbot_webhook_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` VARCHAR(100) NOT NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chatbot_webhook_messages_messageId_key`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
