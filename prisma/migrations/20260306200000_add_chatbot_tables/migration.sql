-- Add chatbot tables: chat_sessions + company_meta

-- ChatSession: one row per WhatsApp phone number, tracks conversation state
CREATE TABLE `chat_sessions` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `phone`        VARCHAR(20)  NOT NULL,
  `userId`       INT          NULL,
  `currentState` VARCHAR(50)  NOT NULL DEFAULT 'WELCOME',
  `lastIntent`   VARCHAR(50)  NULL,
  `lastMessage`  TEXT         NULL,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `chat_sessions_phone_key` (`phone`),
  INDEX  `chat_sessions_userId_idx` (`userId`),
  CONSTRAINT `chat_sessions_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CompanyMeta: key-value store for company info shown by chatbot (editable from admin)
CREATE TABLE `company_meta` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `key`       VARCHAR(100) NOT NULL,
  `value`     TEXT         NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `company_meta_key_key` (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default company meta values
INSERT INTO `company_meta` (`key`, `value`, `updatedAt`) VALUES
  ('name',      'Florarte',                            NOW()),
  ('address',   'Av. Hidalgo 123, Guadalajara, Jal.',  NOW()),
  ('phone',     '3312345678',                          NOW()),
  ('hours',     'Lun–Sáb 9:00am – 7:00pm, Dom 10:00am – 3:00pm', NOW()),
  ('latitude',  '20.6597',                             NOW()),
  ('longitude', '-103.3496',                           NOW()),
  ('site_url',  'https://online-florarte.vercel.app',  NOW());
