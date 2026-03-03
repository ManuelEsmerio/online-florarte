-- ============================================================
-- Limpieza segura (opcional al reinstalar)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS
  `audit_log`,
  `order_coupons`,
  `coupon_users`,
  `coupon_products`,
  `coupon_categories`,
  `coupons`,
  `wishlist`,
  `cart_items_stage`,
  `payments`,
  `order_items`,
  `orders`,
  `shipping_addresses`,
  `product_images`,
  `product_variants`,
  `product_occasions`,
  `product_tags`,
  `occasions`,
  `tags`,
  `products`,
  `categories`,
  `users`;
SET FOREIGN_KEY_CHECKS = 1;

/* ============================================================
   1) Usuarios y auditoría
   ============================================================ */

CREATE TABLE `users` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`           VARCHAR(120) NOT NULL,
  `email`          VARCHAR(190) NOT NULL,
  `phone`          VARCHAR(30)  NULL,
  `password_hash`  VARCHAR(255) NULL,
  `role`           ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  `is_deleted`     TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `ux_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit log (usa LONGTEXT en lugar de JSON para 5.x)
CREATE TABLE `audit_log` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT UNSIGNED NULL,
  `action`     ENUM('create','update','delete','login','logout') NOT NULL,
  `table_name` VARCHAR(100) NOT NULL,
  `record_id`  BIGINT UNSIGNED NOT NULL,
  `old_value`  LONGTEXT NULL,
  `new_value`  LONGTEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ============================================================
   2) Catálogo
   ============================================================ */

CREATE TABLE `categories` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `parent_id`   INT UNSIGNED NULL,
  `name`        VARCHAR(100) NOT NULL UNIQUE,
  `slug`        VARCHAR(100) NOT NULL UNIQUE,
  `prefix`      VARCHAR(10)  NOT NULL UNIQUE COMMENT 'Prefijo para SKUs',
  `description` TEXT NULL,
  `image_url`   VARCHAR(512) NULL,
  CONSTRAINT `fk_categories_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `products` (
  `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`              VARCHAR(255) NOT NULL,
  `slug`              VARCHAR(255) NOT NULL UNIQUE,
  `code`              VARCHAR(50)  NOT NULL UNIQUE COMMENT 'SKU',
  `description`       TEXT NULL,
  `price`             DECIMAL(10,2) NULL COMMENT 'Si no tiene variantes',
  `sale_price`        DECIMAL(10,2) NULL,
  `stock`             INT NULL COMMENT 'Si no tiene variantes',
  `has_variants`      TINYINT(1) NOT NULL DEFAULT 0,
  `status`            ENUM('publicado','oculto','borrador') NOT NULL DEFAULT 'borrador',
  `category_id`       INT UNSIGNED NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices de performance
CREATE INDEX `ix_products_status_category` ON `products` (`status`, `category_id`, `id`);
-- FULLTEXT en InnoDB (MySQL 5.6+). Si usas 5.5, comenta la siguiente línea:
CREATE FULLTEXT INDEX `ft_products_name_desc` ON `products` (`name`, `description`);

CREATE TABLE `product_variants` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`  INT UNSIGNED NOT NULL,
  `name`        VARCHAR(120) NOT NULL,
  `sku`         VARCHAR(80)  NOT NULL UNIQUE,
  `price`       DECIMAL(10,2) NOT NULL,
  `stock`       INT NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_variants_product`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_variants_product_stock` ON `product_variants` (`product_id`, `stock`);

-- product_images sin columna generada; aseguramos 1 principal por triggers
CREATE TABLE `product_images` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`  INT UNSIGNED NOT NULL,
  `image_url`   VARCHAR(512) NOT NULL,
  `is_primary`  TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `ix_pimg_product` (`product_id`),
  KEY `ix_pimg_product_primary` (`product_id`,`is_primary`),
  CONSTRAINT `fk_images_product`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `tags` (
  `id`    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`  VARCHAR(100) NOT NULL UNIQUE,
  `slug`  VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `occasions` (
  `id`    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`  VARCHAR(100) NOT NULL UNIQUE,
  `slug`  VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `product_tags` (
  `product_id` INT UNSIGNED NOT NULL,
  `tag_id`     INT UNSIGNED NOT NULL,
  PRIMARY KEY (`product_id`,`tag_id`),
  CONSTRAINT `fk_pt_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pt_tag`     FOREIGN KEY (`tag_id`)     REFERENCES `tags`(`id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `product_occasions` (
  `product_id`  INT UNSIGNED NOT NULL,
  `occasion_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`product_id`,`occasion_id`),
  CONSTRAINT `fk_po_product`  FOREIGN KEY (`product_id`)  REFERENCES `products`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_po_occasion` FOREIGN KEY (`occasion_id`) REFERENCES `occasions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ============================================================
   3) Envíos, pedidos, items, pagos
   ============================================================ */

CREATE TABLE `shipping_addresses` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT UNSIGNED NOT NULL,
  `recipient`    VARCHAR(150) NOT NULL,
  `phone`        VARCHAR(30)  NULL,
  `street`       VARCHAR(200) NOT NULL,
  `ext_number`   VARCHAR(30)  NULL,
  `int_number`   VARCHAR(30)  NULL,
  `colony`       VARCHAR(120) NULL,
  `city`         VARCHAR(120) NOT NULL,
  `state`        VARCHAR(120) NOT NULL,
  `postal_code`  VARCHAR(15)  NOT NULL,
  `references`   VARCHAR(255) NULL,
  `is_default`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_address_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_addresses_user_default` ON `shipping_addresses` (`user_id`, `is_default`);

CREATE TABLE `orders` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`             INT UNSIGNED NOT NULL,
  `shipping_address_id` INT UNSIGNED NULL,
  `status`              ENUM('pending','paid','shipped','delivered','canceled') NOT NULL DEFAULT 'pending',
  `subtotal`            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_total`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `shipping_total`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax_total`           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes`               TEXT NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_user`    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `shipping_addresses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_orders_user_created`   ON `orders` (`user_id`, `created_at`);
CREATE INDEX `ix_orders_status_created` ON `orders` (`status`,  `created_at`);

CREATE TABLE `order_items` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id`     INT UNSIGNED NOT NULL,
  `product_id`   INT UNSIGNED NOT NULL,
  `variant_id`   INT UNSIGNED NULL,
  `name_snapshot` VARCHAR(255) NOT NULL,
  `sku_snapshot`  VARCHAR(80)  NULL,
  `price`        DECIMAL(10,2) NOT NULL,
  `quantity`     INT NOT NULL DEFAULT 1,
  `total`        DECIMAL(10,2) NOT NULL,
  CONSTRAINT `fk_items_order`   FOREIGN KEY (`order_id`)   REFERENCES `orders`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_order_items_order_product` ON `order_items` (`order_id`, `product_id`, `variant_id`);

CREATE TABLE `payments` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id`        INT UNSIGNED NOT NULL,
  `payment_method`  VARCHAR(50) NOT NULL,
  `payment_status`  ENUM('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
  `transaction_id`  VARCHAR(255) NULL,
  `amount`          DECIMAL(10,2) NOT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `ux_payment_transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_payments_order_status` ON `payments` (`order_id`, `payment_status`);

/* ============================================================
   4) Carrito + Wishlist
   ============================================================ */

CREATE TABLE `cart_items_stage` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT UNSIGNED NULL,
  `session_id`  VARCHAR(64) NULL,
  `product_id`  INT UNSIGNED NOT NULL,
  `variant_id`  INT UNSIGNED NULL,
  `quantity`    INT NOT NULL DEFAULT 1,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cart_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)            ON DELETE CASCADE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)         ON DELETE RESTRICT,
  CONSTRAINT `fk_cart_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `ux_cart_user`    (`user_id`,`product_id`,`variant_id`),
  UNIQUE KEY `ux_cart_session` (`session_id`,`product_id`,`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `ix_cart_guest_filter` ON `cart_items_stage` (`session_id`, `user_id`, `updated_at`);

CREATE TABLE `wishlist` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `variant_id` INT UNSIGNED NULL,
  `selection_key` VARCHAR(80) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_wish_user_selection` (`user_id`, `selection_key`),
  KEY `idx_wish_product` (`product_id`),
  KEY `idx_wish_variant` (`variant_id`),
  CONSTRAINT `fk_wish_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_wish_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wish_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ============================================================
   5) Cupones (categoría/producto/usuario) + order_coupons
   ============================================================ */

CREATE TABLE `coupons` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code`          VARCHAR(50)  NOT NULL UNIQUE,
  `description`   VARCHAR(255) NULL,
  `discount_type` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_purchase`  DECIMAL(10,2) NULL,
  `max_discount`  DECIMAL(10,2) NULL,
  `usage_limit`   INT UNSIGNED DEFAULT 0,
  `used_count`    INT UNSIGNED DEFAULT 0,
  `start_date`    DATETIME NOT NULL,
  `end_date`      DATETIME NOT NULL,
  `status`        ENUM('active','inactive','expired') NOT NULL DEFAULT 'active',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `coupon_categories` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `coupon_id`   INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  UNIQUE KEY `ux_coupon_category_unique` (`coupon_id`,`category_id`),
  CONSTRAINT `fk_cc_coupon`   FOREIGN KEY (`coupon_id`)  REFERENCES `coupons`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_cc_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `coupon_products` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `coupon_id`  INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  UNIQUE KEY `ux_coupon_product_unique` (`coupon_id`,`product_id`),
  CONSTRAINT `fk_cp_coupon`  FOREIGN KEY (`coupon_id`)  REFERENCES `coupons`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_cp_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `coupon_users` (
  `id`        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `coupon_id` INT UNSIGNED NOT NULL,
  `user_id`   INT UNSIGNED NOT NULL,
  UNIQUE KEY `ux_coupon_user_unique` (`coupon_id`,`user_id`),
  CONSTRAINT `fk_cu_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cu_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `order_coupons` (
  `order_id`  INT UNSIGNED NOT NULL,
  `coupon_id` INT UNSIGNED NOT NULL,
  `code`      VARCHAR(50) NOT NULL,
  `discount_applied` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`order_id`,`coupon_id`),
  CONSTRAINT `fk_oc_order`  FOREIGN KEY (`order_id`)  REFERENCES `orders`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_oc_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ============================================================
   6) TRIGGERS de auditoría (LONGTEXT) + 1 sola imagen principal
   ============================================================ */

DELIMITER $$

-- products
DROP TRIGGER IF EXISTS `trg_products_ai` $$
CREATE TRIGGER `trg_products_ai` AFTER INSERT ON `products`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
  VALUES (COALESCE(@audit_user_id, NULL),'create','products',NEW.id,NULL,
    CONCAT('name=',NEW.name,'|slug=',NEW.slug,'|code=',NEW.code,'|status=',NEW.status,'|category_id=',IFNULL(NEW.category_id,'NULL'))
  );
END $$

DROP TRIGGER IF EXISTS `trg_products_au` $$
CREATE TRIGGER `trg_products_au` AFTER UPDATE ON `products`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
  VALUES (COALESCE(@audit_user_id, NULL),'update','products',NEW.id,
    CONCAT('name=',OLD.name,'|slug=',OLD.slug,'|code=',OLD.code,'|status=',OLD.status,'|category_id=',IFNULL(OLD.category_id,'NULL')),
    CONCAT('name=',NEW.name,'|slug=',NEW.slug,'|code=',NEW.code,'|status=',NEW.status,'|category_id=',IFNULL(NEW.category_id,'NULL'))
  );
END $$

DROP TRIGGER IF EXISTS `trg_products_ad` $$
CREATE TRIGGER `trg_products_ad` AFTER DELETE ON `products`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
  VALUES (COALESCE(@audit_user_id, NULL),'delete','products',OLD.id,
    CONCAT('name=',OLD.name,'|slug=',OLD.slug,'|code=',OLD.code), NULL
  );
END $$

-- orders
DROP TRIGGER IF EXISTS `trg_orders_ai` $$
CREATE TRIGGER `trg_orders_ai` AFTER INSERT ON `orders`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
  VALUES (COALESCE(@audit_user_id, NEW.user_id),'create','orders',NEW.id,NULL,
    CONCAT('status=',NEW.status,'|total=',NEW.total_amount)
  );
END $$

DROP TRIGGER IF EXISTS `trg_orders_au` $$
CREATE TRIGGER `trg_orders_au` AFTER UPDATE ON `orders`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
  VALUES (COALESCE(@audit_user_id, NEW.user_id),'update','orders',NEW.id,
    CONCAT('status=',OLD.status,'|total=',OLD.total_amount),
    CONCAT('status=',NEW.status,'|total=',NEW.total_amount)
  );
END $$

-- users
DROP TRIGGER IF EXISTS `trg_users_au` $$
CREATE TRIGGER `trg_users_au` AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
  IF (OLD.name <> NEW.name) OR (OLD.email <> NEW.email) OR (OLD.is_deleted <> NEW.is_deleted) OR (OLD.role <> NEW.role) THEN
    INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
    VALUES (COALESCE(@audit_user_id, NEW.id),'update','users',NEW.id,
      CONCAT('name=',OLD.name,'|email=',OLD.email,'|role=',OLD.role,'|is_deleted=',OLD.is_deleted),
      CONCAT('name=',NEW.name,'|email=',NEW.email,'|role=',NEW.role,'|is_deleted=',NEW.is_deleted)
    );
  END IF;
END $$

-- cart_items_stage
DROP TRIGGER IF EXISTS `trg_cart_ai` $$
CREATE TRIGGER `trg_cart_ai` AFTER INSERT ON `cart_items_stage`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
  VALUES (COALESCE(@audit_user_id, NEW.user_id),'create','cart_items_stage',NEW.id,NULL,
    CONCAT('user_id=',IFNULL(NEW.user_id,'NULL'),'|session_id=',IFNULL(NEW.session_id,'NULL'),
           '|product_id=',NEW.product_id,'|variant_id=',IFNULL(NEW.variant_id,'NULL'),'|qty=',NEW.quantity)
  );
END $$

DROP TRIGGER IF EXISTS `trg_cart_au` $$
CREATE TRIGGER `trg_cart_au` AFTER UPDATE ON `cart_items_stage`
FOR EACH ROW
BEGIN
  IF (IFNULL(OLD.user_id,0) <> IFNULL(NEW.user_id,0)) OR
     (IFNULL(OLD.session_id,'') <> IFNULL(NEW.session_id,'')) OR
     (OLD.product_id <> NEW.product_id) OR
     (IFNULL(OLD.variant_id,0) <> IFNULL(NEW.variant_id,0)) OR
     (OLD.quantity <> NEW.quantity) THEN
    INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
    VALUES (COALESCE(@audit_user_id, NEW.user_id),'update','cart_items_stage',NEW.id,
      CONCAT('user_id=',IFNULL(OLD.user_id,'NULL'),'|session_id=',IFNULL(OLD.session_id,'NULL'),
             '|product_id=',OLD.product_id,'|variant_id=',IFNULL(OLD.variant_id,'NULL'),'|qty=',OLD.quantity),
      CONCAT('user_id=',IFNULL(NEW.user_id,'NULL'),'|session_id=',IFNULL(NEW.session_id,'NULL'),
             '|product_id=',NEW.product_id,'|variant_id=',IFNULL(NEW.variant_id,'NULL'),'|qty=',NEW.quantity)
    );
  END IF;
END $$

DROP TRIGGER IF EXISTS `trg_cart_ad` $$
CREATE TRIGGER `trg_cart_ad` AFTER DELETE ON `cart_items_stage`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_log` (`user_id`,`action`,`table_name`,`record_id`,`old_value`,`new_value`)
  VALUES (COALESCE(@audit_user_id, OLD.user_id),'delete','cart_items_stage',OLD.id,
    CONCAT('user_id=',IFNULL(OLD.user_id,'NULL'),'|session_id=',IFNULL(OLD.session_id,'NULL'),
           '|product_id=',OLD.product_id,'|variant_id=',IFNULL(OLD.variant_id,'NULL'),'|qty=',OLD.quantity),
    NULL
  );
END $$

-- product_images: asegurar 1 sola principal por producto
DROP TRIGGER IF EXISTS `trg_pimages_bi` $$
CREATE TRIGGER `trg_pimages_bi` BEFORE INSERT ON `product_images`
FOR EACH ROW
BEGIN
  IF NEW.is_primary = 1 THEN
    UPDATE product_images
      SET is_primary = 0
      WHERE product_id = NEW.product_id;
  END IF;
END $$

DROP TRIGGER IF EXISTS `trg_pimages_bu` $$
CREATE TRIGGER `trg_pimages_bu` BEFORE UPDATE ON `product_images`
FOR EACH ROW
BEGIN
  IF NEW.is_primary = 1 AND OLD.is_primary <> 1 THEN
    UPDATE product_images
      SET is_primary = 0
      WHERE product_id = NEW.product_id
        AND id <> NEW.id;
  END IF;
END $$

DELIMITER ;

/* ============================================================
   7) Stored Procedures para backend/cron
   ============================================================ */

-- Funde carrito de invitado (session_id) con el del usuario (user_id)
DELIMITER $$
DROP PROCEDURE IF EXISTS `MergeGuestCart` $$
CREATE PROCEDURE `MergeGuestCart` (
  IN p_session_id VARCHAR(64),
  IN p_user_id    INT UNSIGNED
)
BEGIN
  INSERT INTO cart_items_stage (user_id, session_id, product_id, variant_id, quantity, created_at, updated_at)
  SELECT p_user_id, NULL, product_id, variant_id, quantity, NOW(), NOW()
  FROM cart_items_stage
  WHERE session_id = p_session_id
  ON DUPLICATE KEY UPDATE
    quantity  = cart_items_stage.quantity + VALUES(quantity),
    updated_at = NOW();

  DELETE FROM cart_items_stage WHERE session_id = p_session_id;
END $$
DELIMITER ;

-- Limpieza por TTL (para invocar desde cron/cPanel)
DELIMITER $$
DROP PROCEDURE IF EXISTS `PurgeCarts` $$
CREATE PROCEDURE `PurgeCarts` ()
BEGIN
  -- Invitados: inactivos > 30 días
  DELETE ci
  FROM cart_items_stage AS ci
  WHERE ci.user_id IS NULL
    AND ci.session_id IS NOT NULL
    AND ci.updated_at < (NOW() - INTERVAL 30 DAY);

  -- Usuarios logueados: inactivos > 90 días
  DELETE ci
  FROM cart_items_stage AS ci
  WHERE ci.user_id IS NOT NULL
    AND ci.updated_at < (NOW() - INTERVAL 90 DAY);
END $$
DELIMITER ;

/* ============================================================
   8) Notas de uso
   - Para atribuir auditoría: SET @audit_user_id = <userId>;
   - Para fusionar carrito al login: CALL MergeGuestCart(:sid, :userId);
   - Para limpieza diaria vía cron:  CALL PurgeCarts();
   ============================================================ */
