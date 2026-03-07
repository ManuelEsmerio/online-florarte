-- Add context column to chat_sessions for WhatsApp order draft storage
ALTER TABLE `chat_sessions` ADD COLUMN `context` TEXT NULL;

-- Seed bank transfer info in company_meta (admin can update via /admin/empresa)
INSERT IGNORE INTO `company_meta` (`key`, `value`, `updatedAt`) VALUES
  ('bank_name',    'BBVA',                    NOW()),
  ('bank_account', 'xxxx xxxx xxxx xxxx',     NOW()),
  ('bank_clabe',   'xxxxxxxxxxxxxxxxxx',      NOW()),
  ('bank_owner',   'Florarte',                NOW());
