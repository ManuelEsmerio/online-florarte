-- Active: 1721597858066@@127.0.0.1@3306@irenegar_db_florarte_app_dev
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: irenegar_db_florarte_app_dev
-- ------------------------------------------------------
-- Server version	8.0.36

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `address_name` varchar(255) NOT NULL,
  `recipient_name` varchar(255) NOT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `street_name` varchar(255) NOT NULL,
  `street_number` varchar(50) NOT NULL,
  `interior_number` varchar(50) DEFAULT NULL,
  `neighborhood` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `address_type` varchar(50) DEFAULT NULL,
  `reference_notes` text,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_postal_code` (`postal_code`),
  KEY `idx_is_deleted` (`is_deleted`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL COMMENT 'ID del usuario que realizó la acción',
  `table_name` varchar(100) NOT NULL,
  `row_pk` int unsigned NOT NULL COMMENT 'Llave primaria de la fila afectada',
  `action` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_table_name_row_pk` (`table_name`,`row_pk`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `cart_items_stage`
--

DROP TABLE IF EXISTS `cart_items_stage`;
CREATE TABLE `cart_items_stage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `product_id` int unsigned NOT NULL,
  `variant_id` int unsigned DEFAULT NULL,
  `quantity` int unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `custom_photo_id` int unsigned DEFAULT NULL,
  `custom_photo_url` varchar(2048) DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `delivery_time_slot` varchar(50) DEFAULT NULL,
  `is_complement` tinyint(1) NOT NULL DEFAULT '0',
  `parent_cart_item_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `user_id` (`user_id`),
  KEY `parent_cart_item_id` (`parent_cart_item_id`),
  CONSTRAINT `cart_items_stage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `prefix` varchar(10) DEFAULT NULL,
  `description` text,
  `image_url` varchar(2048) DEFAULT NULL,
  `parent_id` int unsigned DEFAULT NULL,
  `show_on_home` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `prefix_unique` (`prefix`),
  KEY `parent_id` (`parent_id`),
  KEY `idx_is_deleted` (`is_deleted`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `coupon_categories`
--

DROP TABLE IF EXISTS `coupon_categories`;
CREATE TABLE `coupon_categories` (
  `coupon_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  PRIMARY KEY (`coupon_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `coupon_categories_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for `coupon_users`
--

DROP TABLE IF EXISTS `coupon_users`;
CREATE TABLE `coupon_users` (
  `coupon_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  PRIMARY KEY (`coupon_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `coupon_users_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `description` text,
  `discount_type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL,
  `valid_from` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` timestamp NULL DEFAULT NULL,
  `scope` enum('global','users','categories','products') NOT NULL DEFAULT 'global',
  `max_uses` int unsigned DEFAULT NULL,
  `uses_count` int unsigned NOT NULL DEFAULT '0',
  `created_by` int unsigned DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_is_deleted` (`is_deleted`),
  KEY `coupons_ibfk_1` (`created_by`),
  CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `cupon_product`
--

DROP TABLE IF EXISTS `cupon_product`;
CREATE TABLE `cupon_product` (
  `coupon_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  PRIMARY KEY (`coupon_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cupon_product_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cupon_product_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `loyalty_history`
--

DROP TABLE IF EXISTS `loyalty_history`;
CREATE TABLE `loyalty_history` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `order_id` int unsigned DEFAULT NULL,
  `points` int NOT NULL,
  `transaction_type` enum('ganado','redimido') NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `loyalty_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `loyalty_history_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `occasions`
--

DROP TABLE IF EXISTS `occasions`;
CREATE TABLE `occasions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `image_url` varchar(2048) DEFAULT NULL,
  `show_on_home` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `variant_id` int unsigned DEFAULT NULL,
  `quantity` int unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `custom_photo_url` varchar(2048) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `order_statuses`
--

DROP TABLE IF EXISTS `order_statuses`;
CREATE TABLE `order_statuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `order_status_id` int unsigned NOT NULL,
  `address_id` int unsigned NOT NULL,
  `payment_id` int unsigned DEFAULT NULL,
  `coupon_id` int unsigned DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `coupon_discount` decimal(10,2) DEFAULT '0.00',
  `shipping_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `loyalty_points_earned` int DEFAULT '0',
  `loyalty_points_redeemed` int DEFAULT '0',
  `delivery_date` date NOT NULL,
  `delivery_time_slot` varchar(50) NOT NULL,
  `dedication` text,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `signature` varchar(100) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `delivery_driver_id` int unsigned DEFAULT NULL,
  `delivery_notes` text,
  `delivered_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `address_id` (`address_id`),
  KEY `payment_id` (`payment_id`),
  KEY `coupon_id` (`coupon_id`),
  KEY `order_status_id` (`order_status_id`),
  KEY `idx_is_deleted` (`is_deleted`),
  KEY `idx_delivery_date` (`delivery_date`),
  KEY `orders_ibfk_6` (`delivery_driver_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`order_status_id`) REFERENCES `order_statuses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_6` FOREIGN KEY (`delivery_driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `payment_statuses`
--

DROP TABLE IF EXISTS `payment_statuses`;
CREATE TABLE `payment_statuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_status_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `payment_status_id` (`payment_status_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`payment_status_id`) REFERENCES `payment_statuses` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `peak_days`
--

DROP TABLE IF EXISTS `peak_days`;
CREATE TABLE `peak_days` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `peak_date` date NOT NULL,
  `is_coupon_restricted` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `peak_date` (`peak_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
CREATE TABLE `product_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `image_url` varchar(2048) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `product_occasions`
--

DROP TABLE IF EXISTS `product_occasions`;
CREATE TABLE `product_occasions` (
  `product_id` int unsigned NOT NULL,
  `occasion_id` int unsigned NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`product_id`,`occasion_id`),
  KEY `occasion_id` (`occasion_id`),
  CONSTRAINT `product_occasions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_occasions_ibfk_2` FOREIGN KEY (`occasion_id`) REFERENCES `occasions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `product_tags`
--

DROP TABLE IF EXISTS `product_tags`;
CREATE TABLE `product_tags` (
  `product_id` int unsigned NOT NULL,
  `tag_id` int unsigned NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`product_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `product_tags_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `product_variant_images`
--

DROP TABLE IF EXISTS `product_variant_images`;
CREATE TABLE `product_variant_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `variant_id` int unsigned NOT NULL,
  `image_url` varchar(2048) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `product_variant_images_ibfk_1` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'ej. Pequeño, Mediano, Grande',
  `sku_short` varchar(50) DEFAULT NULL COMMENT 'SKU corto para esta variante específica',
  `sku_long` varchar(255) DEFAULT NULL COMMENT 'SKU largo para esta variante específica',
  `price` decimal(10,2) NOT NULL,
  `sale_price` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL,
  `short_description` varchar(255) DEFAULT NULL,
  `specifications` json DEFAULT NULL,
  `description` text,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku_short` (`sku_short`),
  UNIQUE KEY `sku_long` (`sku_long`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `sku_short` varchar(50) NOT NULL COMMENT 'SKU corto, ej: ARR001',
  `sku_long` varchar(255) NOT NULL COMMENT 'SKU largo, ej: ARR-FLR-ROS-ROJ-12',
  `description` text,
  `short_description` varchar(255) DEFAULT NULL,
  `specifications` json DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `sale_price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `has_variants` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('publicado','oculto','borrador') NOT NULL DEFAULT 'borrador',
  `category_id` int unsigned NOT NULL,
  `care_instructions` text,
  `allow_photo` tinyint(1) NOT NULL DEFAULT '0',
  `photo_price` decimal(10,2) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku_short` (`sku_short`),
  UNIQUE KEY `sku_long` (`sku_long`),
  KEY `category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_deleted` (`is_deleted`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `shipping_zones`
--

DROP TABLE IF EXISTS `shipping_zones`;
CREATE TABLE `shipping_zones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `postal_code` varchar(10) NOT NULL,
  `locality` varchar(255) NOT NULL,
  `shipping_cost` decimal(10,2) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `postal_code` (`postal_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `testimonials`
--

DROP TABLE IF EXISTS `testimonials`;
CREATE TABLE `testimonials` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `order_id` int unsigned DEFAULT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text NOT NULL,
  `status` enum('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `testimonials_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `testimonials_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `firebase_uid` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('customer','admin','delivery') NOT NULL DEFAULT 'customer',
  `profile_pic_url` varchar(2048) DEFAULT NULL,
  `loyalty_points` int unsigned NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `firebase_uid` (`firebase_uid`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
CREATE TABLE `wishlist` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int unsigned NOT NULL,
    `product_id` int unsigned NOT NULL,
    `variant_id` int unsigned DEFAULT NULL,
    `selection_key` varchar(80) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_wishlist_user_selection` (`user_id`,`selection_key`),
    KEY `idx_wishlist_product` (`product_id`),
    KEY `idx_wishlist_variant` (`variant_id`),
    CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    CONSTRAINT `wishlist_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping routines for database 'irenegar_db_florarte_app_dev'
--
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_Address_Upsert $$
CREATE PROCEDURE sp_Address_Upsert(
    IN p_address_id INT,
    IN p_user_id INT,
    IN p_address_name VARCHAR(255),
    IN p_recipient_name VARCHAR(255),
    IN p_recipient_phone VARCHAR(20),
    IN p_street_name VARCHAR(255),
    IN p_street_number VARCHAR(50),
    IN p_interior_number VARCHAR(50),
    IN p_neighborhood VARCHAR(100),
    IN p_city VARCHAR(100),
    IN p_state VARCHAR(100),
    IN p_country VARCHAR(100),
    IN p_postal_code VARCHAR(10),
    IN p_latitude DECIMAL(10,8),
    IN p_longitude DECIMAL(11,8),
    IN p_address_type VARCHAR(50),
    IN p_reference_notes TEXT,
    OUT o_new_id INT
)
BEGIN
    IF p_address_id IS NOT NULL AND p_address_id > 0 THEN
        -- Actualizar dirección existente
        UPDATE addresses
        SET
            address_name = p_address_name,
            recipient_name = p_recipient_name,
            recipient_phone = p_recipient_phone,
            street_name = p_street_name,
            street_number = p_street_number,
            interior_number = p_interior_number,
            neighborhood = p_neighborhood,
            city = p_city,
            state = p_state,
            country = p_country,
            postal_code = p_postal_code,
            latitude = p_latitude,
            longitude = p_longitude,
            address_type = p_address_type,
            reference_notes = p_reference_notes
        WHERE id = p_address_id AND user_id = p_user_id;
        SET o_new_id = p_address_id;
    ELSE
        -- Insertar nueva dirección
        INSERT INTO addresses (
            user_id, address_name, recipient_name, recipient_phone,
            street_name, street_number, interior_number, neighborhood,
            city, state, country, postal_code, latitude, longitude,
            address_type, reference_notes
        ) VALUES (
            p_user_id, p_address_name, p_recipient_name, p_recipient_phone,
            p_street_name, p_street_number, p_interior_number, p_neighborhood,
            p_city, p_state, p_country, p_postal_code, p_latitude, p_longitude,
            p_address_type, p_reference_notes
        );
        SET o_new_id = LAST_INSERT_ID();
    END IF;
END $$

DELIMITER ;

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

    DECLARE v_tmp_code           VARCHAR(6);
    DECLARE v_peak_date          DATE;
    DECLARE v_in_restricted_win  TINYINT DEFAULT 0;

    DECLARE v_user_fullname      VARCHAR(255);
    DECLARE v_attempts           INT DEFAULT 0;
    
    DECLARE v_created_coupon_ids TEXT DEFAULT '';

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
                LEFT(CONCAT('Canjeo de puntos del usuario ', v_user_fullname), 255));

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

                    IF v_dup = 1 THEN
                        SET v_attempts = v_attempts + 1;
                        IF v_attempts >= 50 THEN
                            SET o_message = 'E8A: Demasiadas colisiones en code UNIQUE';
                            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Colisiones repetidas en coupons.code';
                        END IF;
                        ITERATE gen_code_loop;
                    END IF;
                    
                    -- Capturar el ID del cupón recién insertado
                    SET v_coupon_id = LAST_INSERT_ID();
                END;

                /* E9: INSERT coupon_users */
                SET o_message = 'E9: INSERT coupon_users';
                BEGIN
                    DECLARE v_fk_err  INT DEFAULT 0;
                    DECLARE v_dup_err INT DEFAULT 0;
                    DECLARE CONTINUE HANDLER FOR 1452 SET v_fk_err  = 1;  -- FK fail
                    DECLARE CONTINUE HANDLER FOR 1062 SET v_dup_err = 1;  -- PK dup

                    IF v_coupon_id > 0 THEN
                        INSERT INTO coupon_users (coupon_id, user_id) VALUES (v_coupon_id, p_user_id);
                        
                        IF v_fk_err = 1 THEN
                            SET o_message = CONCAT('E9-FK: No existe padre. user_id=', p_user_id, ', coupon_id=', v_coupon_id);
                            ROLLBACK; LEAVE main;
                        END IF;

                        IF v_dup_err = 1 THEN
                            SET o_message = CONCAT('E9-DUP: Par duplicado. user_id=', p_user_id, ', coupon_id=', v_coupon_id);
                            -- reintentar generando otro cupón
                            ITERATE gen_code_loop;
                        END IF;

                        IF ROW_COUNT() = 0 THEN
                            SET o_message = CONCAT('E9A: No se pudo vincular. coupon_id=', v_coupon_id);
                            ROLLBACK; LEAVE main;
                        END IF;
                        
                        -- Almacenar el ID del cupón creado
                        SET v_created_coupon_ids = CONCAT_WS(',', v_created_coupon_ids, v_coupon_id);

                    ELSE
                        SET o_message = 'E9B: No se obtuvo ID del cupón tras la inserción.';
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
        -- Devolver los IDs de los cupones creados
        SET o_message = LTRIM(v_created_coupon_ids);

        COMMIT;
    END main;
END $$


DELIMITER ;
DELIMITER $$
CREATE PROCEDURE `sp_Product_UpsertFull`(
    IN p_product_id INT,
    IN p_name VARCHAR(255),
    IN p_slug_opt VARCHAR(255),
    IN p_sku_short_prefix VARCHAR(10),
    IN p_sku_long_prefix VARCHAR(50),
    IN p_description TEXT,
    IN p_short_description VARCHAR(255),
    IN p_care_instructions TEXT,
    IN p_category_id INT,
    IN p_allow_photo TINYINT(1),
    IN p_photo_price DECIMAL(10,2),
    IN p_price DECIMAL(10,2),
    IN p_sale_price DECIMAL(10,2),
    IN p_stock INT,
    IN p_has_variants TINYINT(1),
    IN p_status ENUM('publicado', 'oculto', 'borrador'),
    IN p_specifications JSON,
    IN p_tag_ids_json JSON,
    IN p_occasion_ids_json JSON,
    IN p_images_json JSON,
    IN p_variants_json JSON,
    OUT o_product_id INT,
    OUT o_sku_short VARCHAR(50),
    OUT o_slug VARCHAR(255),
    OUT o_result INT,
    OUT o_message VARCHAR(255)
)
BEGIN
    DECLARE v_is_new_product BOOLEAN DEFAULT (p_product_id IS NULL OR p_product_id = 0);
    DECLARE v_product_id INT DEFAULT p_product_id;
    DECLARE v_slug VARCHAR(255);
    DECLARE v_sku_short VARCHAR(50);
    DECLARE v_sku_long VARCHAR(255);
    DECLARE v_tag_id INT;
    DECLARE v_occasion_id INT;
    DECLARE v_image_json JSON;
    DECLARE v_variant_json JSON;
    DECLARE i INT DEFAULT 0;
    DECLARE j INT DEFAULT 0;
    
    SET o_result = 0;
    SET o_message = 'Error desconocido';

    -- Generar Slug
    IF p_slug_opt IS NOT NULL AND p_slug_opt != '' THEN
        SET v_slug = p_slug_opt;
    ELSE
        SET v_slug = p_name;
    END IF;
    SET v_slug = LOWER(v_slug);
    SET v_slug = REPLACE(v_slug, ' ', '-');
    SET v_slug = REGEXP_REPLACE(v_slug, '[^a-z0-9-]', '');
    
    -- Validar unicidad del Slug
    IF v_is_new_product AND EXISTS(SELECT 1 FROM products WHERE slug = v_slug) THEN
        SET v_slug = CONCAT(v_slug, '-', (SELECT FLOOR(1000 + RAND() * 9000)));
    ELSEIF NOT v_is_new_product AND EXISTS(SELECT 1 FROM products WHERE slug = v_slug AND id != v_product_id) THEN
        SET v_slug = CONCAT(v_slug, '-', (SELECT FLOOR(1000 + RAND() * 9000)));
    END IF;

    START TRANSACTION;

    -- Upsert del producto principal
    IF v_is_new_product THEN
        INSERT INTO products (
            name, slug, sku_short, sku_long, description, short_description, care_instructions, category_id, 
            allow_photo, photo_price, price, sale_price, stock, has_variants, status, specifications
        ) VALUES (
            p_name, v_slug, 'TEMP_SKU', 'TEMP_SKU_LONG', p_description, p_short_description, p_care_instructions, p_category_id,
            p_allow_photo, p_photo_price, p_price, p_sale_price, p_stock, p_has_variants, p_status, p_specifications
        );
        SET v_product_id = LAST_INSERT_ID();
        
        -- Generar SKUs
        SET v_sku_short = CONCAT(COALESCE(p_sku_short_prefix, 'P'), LPAD(v_product_id, 4, '0'));
        SET v_sku_long = CONCAT(COALESCE(p_sku_long_prefix, 'PROD'), '-', v_sku_short);
        UPDATE products SET sku_short = v_sku_short, sku_long = v_sku_long WHERE id = v_product_id;
    ELSE
        UPDATE products SET
            name = p_name,
            slug = v_slug,
            description = p_description,
            short_description = p_short_description,
            care_instructions = p_care_instructions,
            category_id = p_category_id,
            allow_photo = p_allow_photo,
            photo_price = p_photo_price,
            price = p_price,
            sale_price = p_sale_price,
            stock = p_stock,
            has_variants = p_has_variants,
            status = p_status,
            specifications = p_specifications
        WHERE id = v_product_id;
        
        SELECT sku_short, sku_long INTO v_sku_short, v_sku_long FROM products WHERE id = v_product_id;
    END IF;

    SET o_product_id = v_product_id;
    SET o_slug = v_slug;
    SET o_sku_short = v_sku_short;

    -- Manejar Tags
    UPDATE product_tags SET is_deleted = 1, deleted_at = NOW() WHERE product_id = v_product_id;
    SET i = 0;
    WHILE i < JSON_LENGTH(p_tag_ids_json) DO
        SET v_tag_id = JSON_UNQUOTE(JSON_EXTRACT(p_tag_ids_json, CONCAT('$[', i, ']')));
        INSERT INTO product_tags (product_id, tag_id) VALUES (v_product_id, v_tag_id)
        ON DUPLICATE KEY UPDATE is_deleted = 0, deleted_at = NULL;
        SET i = i + 1;
    END WHILE;

    -- Manejar Ocasiones
    UPDATE product_occasions SET is_deleted = 1, deleted_at = NOW() WHERE product_id = v_product_id;
    SET i = 0;
    WHILE i < JSON_LENGTH(p_occasion_ids_json) DO
        SET v_occasion_id = JSON_UNQUOTE(JSON_EXTRACT(p_occasion_ids_json, CONCAT('$[', i, ']')));
        INSERT INTO product_occasions (product_id, occasion_id) VALUES (v_product_id, v_occasion_id)
        ON DUPLICATE KEY UPDATE is_deleted = 0, deleted_at = NULL;
        SET i = i + 1;
    END WHILE;

    -- Manejar Imágenes Principales
    UPDATE product_images SET is_deleted = 1, deleted_at = NOW() WHERE product_id = v_product_id;
    SET i = 0;
    WHILE i < JSON_LENGTH(p_images_json) DO
        SET v_image_json = JSON_EXTRACT(p_images_json, CONCAT('$[', i, ']'));
        INSERT INTO product_images (product_id, image_url, alt_text, is_primary)
        VALUES (v_product_id, JSON_UNQUOTE(JSON_EXTRACT(v_image_json, '$.src')), JSON_UNQUOTE(JSON_EXTRACT(v_image_json, '$.alt')), i=0);
        SET i = i + 1;
    END WHILE;

    -- Manejar Variantes
    UPDATE product_variants SET is_deleted = 1, deleted_at = NOW() WHERE product_id = v_product_id;
    SET i = 0;
    WHILE i < JSON_LENGTH(p_variants_json) DO
        SET v_variant_json = JSON_EXTRACT(p_variants_json, CONCAT('$[', i, ']'));
        
        -- Insertar o actualizar la variante
        INSERT INTO product_variants (
            product_id, name, price, sale_price, stock, sku_short, short_description, specifications, description
        ) VALUES (
            v_product_id,
            JSON_UNQUOTE(JSON_EXTRACT(v_variant_json, '$.name')),
            JSON_UNQUOTE(JSON_EXTRACT(v_variant_json, '$.price')),
            JSON_UNQUOTE(JSON_EXTRACT(v_variant_json, '$.sale_price')),
            JSON_UNQUOTE(JSON_EXTRACT(v_variant_json, '$.stock')),
            CONCAT(v_sku_short, '-V', i + 1), -- Generar SKU para la variante
            JSON_UNQUOTE(JSON_EXTRACT(v_variant_json, '$.short_description')),
            JSON_EXTRACT(v_variant_json, '$.specifications'),
            JSON_UNQUOTE(JSON_EXTRACT(v_variant_json, '$.description'))
        );
        
        -- Aquí manejarías las imágenes de la variante si las tuviera
        
        SET i = i + 1;
    END WHILE;

    COMMIT;
    SET o_result = 1;
    SET o_message = 'Producto guardado exitosamente';

END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_User_Update`(
    IN p_user_id INT,
    IN p_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_role ENUM('customer', 'admin', 'delivery'),
    IN p_profile_pic_url VARCHAR(2048)
)
BEGIN
    UPDATE users SET
        `name` = COALESCE(p_name, `name`),
        `email` = COALESCE(p_email, `email`),
        `phone` = COALESCE(p_phone, `phone`),
        `role` = COALESCE(p_role, `role`),
        `profile_pic_url` = COALESCE(p_profile_pic_url, `profile_pic_url`)
    WHERE id = p_user_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_address_insert` AFTER INSERT ON `addresses` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, new_values)
    VALUES (@audit_user_id, 'addresses', NEW.id, 'INSERT', JSON_OBJECT(
        'user_id', NEW.user_id, 'address_name', NEW.address_name, 'recipient_name', NEW.recipient_name, 'postal_code', NEW.postal_code
    ));
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_address_update` AFTER UPDATE ON `addresses` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, old_values, new_values)
    VALUES (@audit_user_id, 'addresses', NEW.id, 'UPDATE', 
            JSON_OBJECT('recipient_name', OLD.recipient_name, 'postal_code', OLD.postal_code),
            JSON_OBJECT('recipient_name', NEW.recipient_name, 'postal_code', NEW.postal_code)
    );
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_category_insert` AFTER INSERT ON `categories` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, new_values)
    VALUES (@audit_user_id, 'categories', NEW.id, 'INSERT', JSON_OBJECT('name', NEW.name, 'slug', NEW.slug));
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_category_update` AFTER UPDATE ON `categories` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, old_values, new_values)
    VALUES (@audit_user_id, 'categories', NEW.id, 'UPDATE', 
            JSON_OBJECT('name', OLD.name, 'is_deleted', OLD.is_deleted),
            JSON_OBJECT('name', NEW.name, 'is_deleted', NEW.is_deleted)
    );
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_coupon_insert` AFTER INSERT ON `coupons` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, new_values)
    VALUES (@audit_user_id, 'coupons', NEW.id, 'INSERT', JSON_OBJECT('code', NEW.code, 'discount_value', NEW.discount_value, 'scope', NEW.scope));
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_coupon_update` AFTER UPDATE ON `coupons` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, old_values, new_values)
    VALUES (@audit_user_id, 'coupons', NEW.id, 'UPDATE', 
            JSON_OBJECT('code', OLD.code, 'discount_value', OLD.discount_value, 'is_deleted', OLD.is_deleted),
            JSON_OBJECT('code', NEW.code, 'discount_value', NEW.discount_value, 'is_deleted', NEW.is_deleted)
    );
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_order_insert` AFTER INSERT ON `orders` FOR EACH ROW
BEGIN
    -- Log a la tabla de auditoría
    INSERT INTO audit_log (user_id, table_name, row_pk, action, new_values)
    VALUES (@audit_user_id, 'orders', NEW.id, 'INSERT', JSON_OBJECT('user_id', NEW.user_id, 'total', NEW.total, 'status_id', NEW.order_status_id));
    
    -- Sumar puntos de lealtad
    UPDATE users SET loyalty_points = loyalty_points + NEW.loyalty_points_earned WHERE id = NEW.user_id;

    -- Registrar el movimiento de puntos de lealtad
    IF NEW.loyalty_points_earned > 0 THEN
        INSERT INTO loyalty_history (user_id, order_id, points, transaction_type, notes)
        VALUES (NEW.user_id, NEW.id, NEW.loyalty_points_earned, 'ganado', CONCAT('Puntos ganados por la orden #', NEW.id));
    END IF;
    
    -- Si se usó un cupón, incrementar su contador de usos
    IF NEW.coupon_id IS NOT NULL THEN
        UPDATE coupons SET uses_count = uses_count + 1 WHERE id = NEW.coupon_id;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_order_status_update` AFTER UPDATE ON `orders` FOR EACH ROW
BEGIN
    IF OLD.order_status_id <> NEW.order_status_id THEN
        INSERT INTO audit_log (user_id, table_name, row_pk, action, old_values, new_values)
        VALUES (@audit_user_id, 'orders', NEW.id, 'UPDATE', 
            JSON_OBJECT('status_id', OLD.order_status_id),
            JSON_OBJECT('status_id', NEW.order_status_id)
        );
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_product_insert` AFTER INSERT ON `products` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, new_values)
    VALUES (@audit_user_id, 'products', NEW.id, 'INSERT', JSON_OBJECT('name', NEW.name, 'price', NEW.price, 'stock', NEW.stock));
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_product_update` AFTER UPDATE ON `products` FOR EACH ROW
BEGIN
    IF OLD.is_deleted <> NEW.is_deleted OR OLD.name <> NEW.name OR OLD.price <> NEW.price OR OLD.stock <> NEW.stock THEN
        INSERT INTO audit_log (user_id, table_name, row_pk, action, old_values, new_values)
        VALUES (@audit_user_id, 'products', NEW.id, 'UPDATE', 
            JSON_OBJECT('name', OLD.name, 'price', OLD.price, 'stock', OLD.stock, 'is_deleted', OLD.is_deleted), 
            JSON_OBJECT('name', NEW.name, 'price', NEW.price, 'stock', NEW.stock, 'is_deleted', NEW.is_deleted)
        );
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_user_insert` AFTER INSERT ON `users` FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, table_name, row_pk, action, new_values)
    VALUES (@audit_user_id, 'users', NEW.id, 'INSERT', JSON_OBJECT('name', NEW.name, 'email', NEW.email, 'role', NEW.role));
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_after_user_update` AFTER UPDATE ON `users` FOR EACH ROW
BEGIN
    -- Este trigger se activa solo si hay cambios en los campos especificados
    IF OLD.is_deleted <> NEW.is_deleted OR OLD.name <> NEW.name OR OLD.email <> NEW.email OR OLD.role <> NEW.role THEN
        INSERT INTO audit_log (user_id, table_name, row_pk, action, old_values, new_values)
        VALUES (@audit_user_id, 'users', NEW.id, 'UPDATE', 
            JSON_OBJECT('name', OLD.name, 'email', OLD.email, 'role', OLD.role, 'is_deleted', OLD.is_deleted), 
            JSON_OBJECT('name', NEW.name, 'email', NEW.email, 'role', NEW.role, 'is_deleted', NEW.is_deleted)
        );
    END IF;
END$$
DELIMITER ;
-- Insertar datos iniciales
INSERT INTO `order_statuses` (`id`, `code`, `name`) VALUES
(1, 'pendiente', 'Pendiente'),
(2, 'procesando', 'Procesando'),
(3, 'en_reparto', 'En Reparto'),
(4, 'completado', 'Completado'),
(5, 'cancelado', 'Cancelado');

INSERT INTO `payment_statuses` (`id`, `code`, `name`) VALUES
(1, 'pendiente', 'Pendiente'),
(2, 'exitoso', 'Exitoso'),
(3, 'fallido', 'Fallido');
