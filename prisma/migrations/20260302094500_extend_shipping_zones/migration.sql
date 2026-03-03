-- Extend shipping_zones with new geo metadata and logistics classification fields
ALTER TABLE `shipping_zones`
  ADD COLUMN `settlementType` VARCHAR(100) NULL,
  ADD COLUMN `municipality` VARCHAR(150) NULL,
  ADD COLUMN `state` VARCHAR(100) NULL,
  ADD COLUMN `stateCode` VARCHAR(5) NULL,
  ADD COLUMN `municipalityCode` VARCHAR(5) NULL,
  ADD COLUMN `postalOfficeCode` VARCHAR(10) NULL,
  ADD COLUMN `zone` VARCHAR(50) NULL;

-- Replace the legacy unique constraint on postalCode with a composite key (postalCode + locality)
DROP INDEX `shipping_zones_postalCode_key` ON `shipping_zones`;
CREATE UNIQUE INDEX `shipping_zones_postalCode_locality_key` ON `shipping_zones`(`postalCode`, `locality`);
