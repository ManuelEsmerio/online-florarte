-- Active: 1716245842261@@35.202.133.151@3306@irenegar_db_florarte_app_dev

-- =============================================
-- CREACIÓN DE TABLAS
-- =============================================

CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `firebase_uid` VARCHAR(128) NOT NULL UNIQUE COMMENT 'UID de Firebase Authentication',
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` ENUM('customer', 'admin', 'delivery') NOT NULL DEFAULT 'customer',
  `profile_pic_url` VARCHAR(2048) DEFAULT NULL,
  `loyalty_points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Puntos de lealtad acumulados',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_firebase_uid` (`firebase_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT 'Tabla de usuarios';


CREATE TABLE `addresses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `address_name` VARCHAR(255) NOT NULL COMMENT 'Alias de la dirección, ej: "Casa", "Oficina"',
  `recipient_name` VARCHAR(255) NOT NULL COMMENT 'Nombre de quien recibe',
  `recipient_phone` VARCHAR(20) NOT NULL COMMENT 'Teléfono de quien recibe',
  `street_name` VARCHAR(255) NOT NULL,
  `street_number` VARCHAR(50) NOT NULL,
  `interior_number` VARCHAR(50) DEFAULT NULL,
  `neighborhood` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `state` VARCHAR(255) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'México',
  `postal_code` VARCHAR(10) NOT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `address_type` ENUM('casa', 'hotel', 'restaurante', 'oficina', 'hospital', 'capilla-funeral', 'escuela-universidad', 'banco', 'departamento', 'otro') DEFAULT 'casa',
  `reference_notes` TEXT COMMENT 'Referencias adicionales para la entrega',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `prefix` VARCHAR(10) NOT NULL UNIQUE COMMENT 'Prefijo para SKU de productos en esta categoría',
  `description` TEXT,
  `image_url` VARCHAR(2048),
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `show_on_home` TINYINT(1) NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `sku_short` VARCHAR(20) NOT NULL UNIQUE COMMENT 'SKU visible (ej. ARR-ROS-01)',
  `sku_long` VARCHAR(255) NOT NULL UNIQUE COMMENT 'SKU con timestamp, para unicidad interna',
  `short_description` VARCHAR(255) COMMENT 'Descripción corta para SEO y previsualizaciones',
  `description` TEXT,
  `specifications` JSON COMMENT 'Especificaciones como altura, tipo de flor, etc. en formato JSON',
  `care_instructions` TEXT COMMENT 'Instrucciones de cuidado para el producto',
  `price` DECIMAL(10,2) COMMENT 'Precio si no tiene variantes. NULL si tiene variantes.',
  `sale_price` DECIMAL(10,2) COMMENT 'Precio de oferta si no tiene variantes.',
  `stock` INT UNSIGNED COMMENT 'Stock si no tiene variantes.',
  `has_variants` TINYINT(1) NOT NULL DEFAULT 0,
  `allow_photo` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Permite al cliente añadir una foto al producto',
  `photo_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Costo adicional por añadir una foto',
  `status` ENUM('publicado', 'oculto', 'borrador') NOT NULL DEFAULT 'borrador',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  INDEX `idx_products_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `product_variants` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL COMMENT 'Nombre de la variante (ej. "Chico", "Grande")',
  `sku_short` VARCHAR(30) NOT NULL UNIQUE,
  `sku_long` VARCHAR(255) NOT NULL UNIQUE,
  `short_description` VARCHAR(255),
  `description` TEXT,
  `specifications` JSON,
  `price` DECIMAL(10,2) NOT NULL,
  `sale_price` DECIMAL(10,2) DEFAULT NULL,
  `stock` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_product_variant_name` (`product_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `product_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(2048) NOT NULL,
  `alt_text` VARCHAR(255),
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `product_variant_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variant_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(2048) NOT NULL,
  `alt_text` VARCHAR(255),
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tags` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `product_tags` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `tag_id` INT UNSIGNED NOT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_tag` (`product_id`, `tag_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `occasions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `image_url` VARCHAR(2048),
  `show_on_home` TINYINT(1) NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `product_occasions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `occasion_id` INT UNSIGNED NOT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_occasion` (`product_id`, `occasion_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`occasion_id`) REFERENCES `occasions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `coupons` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `valid_from` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` DATETIME,
  `scope` ENUM('global', 'users', 'categories', 'products') NOT NULL DEFAULT 'global',
  `max_uses` INT UNSIGNED,
  `uses_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cupon_user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coupon_user` (`coupon_id`, `user_id`),
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `coupon_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coupon_category` (`coupon_id`, `category_id`),
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cupon_product` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coupon_product` (`coupon_id`, `product_id`),
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `order_statuses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Ej: "pendiente", "procesando", "en_reparto", "completado", "cancelado"',
  `description` VARCHAR(255),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `address_id` INT UNSIGNED NOT NULL,
  `coupon_id` INT UNSIGNED DEFAULT NULL,
  `order_status_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `coupon_discount` DECIMAL(10,2) DEFAULT 0,
  `shipping_cost` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `delivery_date` DATE NOT NULL,
  `delivery_time_slot` VARCHAR(50) NOT NULL COMMENT 'Ej: "9-13", "13-18", "18-20"',
  `dedication` TEXT,
  `is_anonymous` TINYINT(1) NOT NULL DEFAULT 0,
  `signature` VARCHAR(255) COMMENT 'Firma para la dedicatoria',
  `delivery_driver_id` INT UNSIGNED DEFAULT NULL,
  `delivery_notes` TEXT COMMENT 'Notas internas sobre la entrega',
  `delivered_at` TIMESTAMP NULL DEFAULT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`),
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`),
  FOREIGN KEY (`order_status_id`) REFERENCES `order_statuses`(`id`),
  FOREIGN KEY (`delivery_driver_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `variant_id` INT UNSIGNED DEFAULT NULL,
  `product_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot del nombre del producto',
  `custom_photo_url` VARCHAR(2048) DEFAULT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL COMMENT 'Snapshot del precio al momento de la compra',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `payment_methods` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Ej: "tarjeta", "paypal", "efectivo"',
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `payments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `payment_method_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pendiente', 'exitoso', 'fallido') NOT NULL,
  `transaction_id` VARCHAR(255) COMMENT 'ID de la transacción del proveedor de pagos',
  `raw_response` JSON COMMENT 'Respuesta completa del proveedor de pagos',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `testimonials` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED DEFAULT NULL,
  `rating` TINYINT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `status` ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `wishlist` (
  `user_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `product_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `loyalty_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED DEFAULT NULL,
  `points` INT NOT NULL COMMENT 'Puntos ganados (positivo) o gastados (negativo)',
  `transaction_type` ENUM('ganado', 'redimido', 'ajuste') NOT NULL,
  `notes` VARCHAR(255),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `cart_sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `cart_items_stage` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(255) DEFAULT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `variant_id` INT UNSIGNED DEFAULT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `custom_photo_url` VARCHAR(2048) DEFAULT NULL,
  `delivery_date` DATE,
  `delivery_time_slot` VARCHAR(50) DEFAULT NULL,
  `is_complement` TINYINT(1) NOT NULL DEFAULT 0,
  `parent_cart_item_id` INT UNSIGNED DEFAULT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_cart_stage_session_id` (`session_id`),
  INDEX `idx_cart_stage_user_id` (`user_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_cart_item_id`) REFERENCES `cart_items_stage`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `shipping_zones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `postal_code` VARCHAR(10) NOT NULL UNIQUE,
  `locality` VARCHAR(255) NOT NULL COMMENT 'Nombre de la colonia o municipio',
  `shipping_cost` DECIMAL(10,2) NOT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `peak_days` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `peak_date` DATE NOT NULL,
  `is_coupon_restricted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Si es 1, los cupones no se aplican este día',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_peak_date` (`peak_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `audit_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL COMMENT 'ID del usuario que realizó la acción',
  `action` VARCHAR(255) NOT NULL,
  `table_name` VARCHAR(255) NOT NULL,
  `record_id` INT UNSIGNED,
  `old_values` JSON,
  `new_values` JSON,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =============================================
-- VISTAS
-- =============================================
CREATE VIEW `v_products` AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.sku_short,
    p.description,
    p.short_description,
    p.care_instructions,
    p.status,
    p.is_deleted,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    (
        SELECT pi.image_url
        FROM product_images pi
        WHERE pi.product_id = p.id AND pi.is_primary = 1
        LIMIT 1
    ) AS primary_image_url
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.is_deleted = 0;


-- =============================================
-- INSERCIÓN DE DATOS INICIALES
-- =============================================

INSERT INTO `order_statuses` (`id`, `code`, `description`) VALUES
(1, 'pendiente', 'El cliente ha realizado el pedido, pero el pago aún no ha sido confirmado.'),
(2, 'procesando', 'El pago ha sido confirmado y el pedido está siendo preparado.'),
(3, 'en_reparto', 'El pedido ha salido de la tienda y está en camino a su destino.'),
(4, 'completado', 'El pedido ha sido entregado exitosamente.'),
(5, 'cancelado', 'El pedido ha sido cancelado por el cliente o el administrador.');

INSERT INTO `payment_methods` (`id`, `code`, `name`) VALUES
(1, 'tarjeta', 'Tarjeta de Crédito/Débito'),
(2, 'paypal', 'PayPal'),
(3, 'efectivo', 'Pago en Efectivo (OXXO)');

-- =============================================
-- TRIGGERS PARA AUDITORÍA
-- =============================================

DELIMITER $$

CREATE TRIGGER `trg_after_user_update`
AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
    DECLARE changes JSON;
    SET changes = JSON_OBJECT();
    IF OLD.name != NEW.name THEN
        SET changes = JSON_SET(changes, '$.name', JSON_OBJECT('old', OLD.name, 'new', NEW.name));
    END IF;
    IF OLD.email != NEW.email THEN
        SET changes = JSON_SET(changes, '$.email', JSON_OBJECT('old', OLD.email, 'new', NEW.email));
    END IF;
    IF OLD.role != NEW.role THEN
        SET changes = JSON_SET(changes, '$.role', JSON_OBJECT('old', OLD.role, 'new', NEW.role));
    END IF;

    IF JSON_LENGTH(changes) > 0 THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (COALESCE(@audit_user_id, 1), 'UPDATE', 'users', OLD.id, JSON_OBJECT('id', OLD.id), changes);
    END IF;
END$$

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS (SPs)
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_Loyalty_RedeemPoints_AndCreateCoupons $$
CREATE PROCEDURE sp_Loyalty_RedeemPoints_AndCreateCoupons (
    IN  p_user_id             INT UNSIGNED,
    IN  p_points_to_redeem    INT UNSIGNED,     -- múltiplos de 3000
    OUT o_coupons_created     INT,
    OUT o_points_deducted     INT,
    OUT o_result              TINYINT,
    OUT o_message             VARCHAR(255)
)
BEGIN
    /* ===== Constantes ===== */
    DECLARE v_coupon_discount_type   VARCHAR(20)   DEFAULT 'fixed';
    DECLARE v_coupon_discount_value  DECIMAL(10,2) DEFAULT 200.00;
    DECLARE v_valid_months           INT UNSIGNED  DEFAULT 2;
    DECLARE v_charpool               VARCHAR(36)   DEFAULT 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    /* ===== Variables ===== */
    DECLARE v_today              DATE     DEFAULT CURDATE();
    DECLARE v_current_points     INT;
    DECLARE v_blocks             INT;
    DECLARE v_points_to_deduct   INT;
    DECLARE v_coupon_id          INT UNSIGNED;

    DECLARE v_valid_from_date    DATE;
    DECLARE v_valid_from_dt      DATETIME;
    DECLARE v_valid_until_dt     DATETIME;

    DECLARE v_tmp_code           VARCHAR(8);
    DECLARE v_peak_date          DATE;
    DECLARE v_in_restricted_win  TINYINT DEFAULT 0;

    DECLARE v_user_fullname      VARCHAR(255);
    DECLARE v_attempts           INT DEFAULT 0;

    /* ===== Handler global: conserva el último E# si existe ===== */
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET o_result = 0;
        IF o_message IS NULL OR o_message = '' OR LEFT(o_message,1) <> 'E' THEN
            SET o_message = 'E0: Error SQL al canjear puntos y generar cupon(es).';
        END IF;
    END;

    /* ===== OUTs ===== */
    SET o_result = 0; SET o_message = '';
    SET o_coupons_created = 0; SET o_points_deducted = 0;

    main: BEGIN
        /* Validaciones */
        IF p_user_id IS NULL OR p_user_id = 0 THEN
            SET o_message = 'EVAL1: p_user_id inválido'; LEAVE main;
        END IF;
        IF p_points_to_redeem IS NULL OR p_points_to_redeem = 0 THEN
            SET o_message = 'EVAL2: p_points_to_redeem inválido (>0)'; LEAVE main;
        END IF;

        START TRANSACTION;

        /* E1: usuario */
        SET o_message = 'E1: SELECT users FOR UPDATE';
        SELECT loyalty_points, name
          INTO v_current_points, v_user_fullname
          FROM users
         WHERE id = p_user_id
         FOR UPDATE;

        IF v_current_points IS NULL THEN
            SET o_message = 'E1A: Usuario no encontrado';
            ROLLBACK; LEAVE main;
        END IF;
        IF v_user_fullname IS NULL OR v_user_fullname = '' THEN
            SET v_user_fullname = CONCAT('ID ', p_user_id);
        END IF;

        /* E2: bloques */
        SET o_message = 'E2: Calculando bloques';
        SET v_blocks = FLOOR(LEAST(v_current_points, p_points_to_redeem) / 3000);
        SET v_points_to_deduct = v_blocks * 3000;
        IF v_blocks = 0 THEN
            SET o_message = 'E2A: Puntos insuficientes (múltiplos de 3000 requeridos)';
            ROLLBACK; LEAVE main;
        END IF;

        /* E3: peak days */
        SET o_message = 'E3: Consultando peak_days';
        SELECT peak_date
          INTO v_peak_date
          FROM peak_days
         WHERE is_coupon_restricted = 1
           AND DATEDIFF(peak_date, v_today) BETWEEN -7 AND 7
         ORDER BY ABS(DATEDIFF(peak_date, v_today)) ASC
         LIMIT 1;
        IF v_peak_date IS NOT NULL THEN
            SET v_in_restricted_win = 1;
        END IF;

        /* E4: vigencias */
        SET o_message = 'E4: Calculando vigencias';
        IF v_in_restricted_win = 1 THEN
            SET v_valid_from_date = DATE_ADD(v_peak_date, INTERVAL 8 DAY);
        ELSE
            SET v_valid_from_date = v_today;
        END IF;
        SET v_valid_from_dt  = CAST(CONCAT(v_valid_from_date, ' 00:00:00') AS DATETIME);
        SET v_valid_until_dt = DATE_ADD(v_valid_from_dt, INTERVAL v_valid_months MONTH);

        /* E5: descontar puntos */
        SET o_message = 'E5: UPDATE users (descontar puntos)';
        UPDATE users
           SET loyalty_points = loyalty_points - v_points_to_deduct
         WHERE id = p_user_id;
        IF ROW_COUNT() = 0 THEN
            SET o_message = 'E5A: No se pudo descontar puntos (concurrencia)';
            ROLLBACK; LEAVE main;
        END IF;

        /* E6: historial */
        SET o_message = 'E6: INSERT loyalty_history';
        INSERT INTO loyalty_history (user_id, points, transaction_type, notes)
        VALUES (p_user_id, -v_points_to_deduct, 'redimido',
                LEFT(CONCAT('Canje de puntos del usuario ', v_user_fullname), 255));

        /* E7–E9: cupones */
        coupon_loop: LOOP
            IF o_coupons_created >= v_blocks THEN LEAVE coupon_loop; END IF;
            SET v_attempts = 0;

            gen_code_loop: LOOP
                /* E7: generar code */
                SET o_message = 'E7: Generando código';
                SET v_tmp_code = CONCAT(
                    SUBSTRING(v_charpool, FLOOR(RAND()*36)+1, 1),
                    SUBSTRING(v_charpool, FLOOR(RAND()*36)+1, 1),
                    SUBSTRING(v_charpool, FLOOR(RAND()*36)+1, 1),
                    SUBSTRING(v_charpool, FLOOR(RAND()*36)+1, 1),
                    SUBSTRING(v_charpool, FLOOR(RAND()*36)+1, 1),
                    SUBSTRING(v_charpool, FLOOR(RAND()*36)+1, 1)
                );

                /* E8: INSERT coupons (con 1062) */
                SET o_message = 'E8: INSERT coupons';
                BEGIN
                    DECLARE v_dup INT DEFAULT 0;
                    DECLARE CONTINUE HANDLER FOR 1062 SET v_dup = 1;

                    INSERT INTO coupons
                        (code, description, discount_type, discount_value, valid_from, valid_until,
                         scope, max_uses, uses_count, is_deleted)
                    VALUES
                        (v_tmp_code,
                         LEFT(CONCAT('Cupón por canje de puntos del usuario ', v_user_fullname), 65535),
                         v_coupon_discount_type,
                         v_coupon_discount_value,
                         v_valid_from_dt,
                         v_valid_until_dt,
                         'users',
                         1,
                         0,
                         0);
                    
                    SET v_coupon_id = LAST_INSERT_ID();

                    IF v_dup = 1 THEN
                        SET v_attempts = v_attempts + 1;
                        IF v_attempts >= 50 THEN
                            SET o_message = 'E8A: Demasiadas colisiones en code UNIQUE';
                            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Colisiones repetidas en coupons.code';
                        END IF;
                        ITERATE gen_code_loop;
                    END IF;
                END;
                
                SET o_message = 'E9: INSERT cupon_user';
                BEGIN
                    DECLARE v_fk_err INT DEFAULT 0;
                    DECLARE CONTINUE HANDLER FOR 1452 SET v_fk_err = 1;

                    INSERT INTO cupon_user (coupon_id, user_id) VALUES (v_coupon_id, p_user_id);
                    
                    IF v_fk_err = 1 THEN
                        SET o_message = CONCAT('E9-FK: No existe padre. coupon_id=', v_coupon_id);
                        ROLLBACK; LEAVE main;
                    END IF;
                END;

                SET o_coupons_created = o_coupons_created + 1;
                LEAVE gen_code_loop;
            END LOOP gen_code_loop;
        END LOOP coupon_loop;

        /* Éxito */
        SET o_points_deducted = v_points_to_deduct;
        SET o_result = 1;
        SET o_message = CONCAT(
            'Se generaron ', o_coupons_created,
            ' cupón(es) de $', v_coupon_discount_value,
            IF(v_in_restricted_win = 1,
               CONCAT('. Vigencia inicia el ', DATE_FORMAT(v_valid_from_dt, '%Y-%m-%d'),
                      ' por regla de pico. Válidos hasta ', DATE_FORMAT(v_valid_until_dt, '%Y-%m-%d'), '.'),
               CONCAT(' válido(s) hasta ', DATE_FORMAT(v_valid_until_dt, '%Y-%m-%d'), '.')
            )
        );

        COMMIT;
    END main;
END $$

DELIMITER ;
