-- =================================================================
--  PROCEDURE PARA CREAR UN PRODUCTO COMPLETO
-- =================================================================
DROP PROCEDURE IF EXISTS sp_Product_CreateFull;
DELIMITER $$
CREATE PROCEDURE sp_Product_CreateFull(
  -- Parámetros base del producto
  IN  p_name                  VARCHAR(255),
  IN  p_slug_opt              VARCHAR(255),
  IN  p_description           MEDIUMTEXT,
  IN  p_short_description     VARCHAR(160),
  IN  p_care_instructions     MEDIUMTEXT,
  IN  p_category_id           INT UNSIGNED,
  IN  p_allow_photo           TINYINT,
  IN  p_photo_price           DECIMAL(10,2),
  IN  p_price                 DECIMAL(10,2),
  IN  p_sale_price            DECIMAL(10,2),
  IN  p_stock                 INT,
  IN  p_has_variants          TINYINT,
  IN  p_status                VARCHAR(20),
  IN  p_specifications        JSON,
  -- Parámetros para relaciones (en formato JSON)
  IN  p_tag_ids_json          JSON,
  IN  p_occasion_ids_json     JSON,
  IN  p_images_json           JSON,
  IN  p_variants_json         JSON,
  -- Parámetros de salida
  OUT o_product_id            INT UNSIGNED,
  OUT o_sku_short             VARCHAR(64),
  OUT o_slug                  VARCHAR(255),
  OUT o_result                VARCHAR(20),
  OUT o_message               VARCHAR(255)
)
BEGIN
  -- Declaraciones
  DECLARE v_now DATETIME DEFAULT NOW();
  DECLARE v_slug VARCHAR(255);
  DECLARE v_len INT;
  DECLARE i INT;
  DECLARE v_var_id INT UNSIGNED;
  DECLARE v_had_error TINYINT DEFAULT 0;

  -- Manejador de errores para la transacción
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN
    SET v_had_error = 1;
    ROLLBACK;
    SET o_result = 'error';
    SET o_message = 'E1: Error SQL al crear el producto.';
  END;

  START TRANSACTION;

  -- 1. Insertar el producto principal
  -- El trigger 'trg_products_bi' se encargará del slug inicial
  INSERT INTO products (
    name, slug, description, short_description, care_instructions,
    category_id, allow_photo, photo_price, price, sale_price, stock,
    has_variants, status, specifications, created_at, updated_at
  ) VALUES (
    p_name, p_slug_opt, p_description, p_short_description, p_care_instructions,
    p_category_id, p_allow_photo, p_photo_price, p_price, p_sale_price, p_stock,
    p_has_variants, p_status, p_specifications, v_now, v_now
  );
  SET o_product_id = LAST_INSERT_ID();

  -- 2. Forzar actualización para que el trigger 'trg_products_bu' genere los SKUs correctos
  UPDATE products SET updated_at = v_now WHERE id = o_product_id;

  -- 3. Obtener los datos generados para devolverlos
  SELECT slug, sku_short INTO o_slug, o_sku_short FROM products WHERE id = o_product_id;

  -- 4. Insertar Tags
  IF JSON_VALID(p_tag_ids_json) AND JSON_LENGTH(p_tag_ids_json) > 0 THEN
    SET v_len = JSON_LENGTH(p_tag_ids_json);
    SET i = 0;
    WHILE i < v_len DO
      INSERT INTO product_tags (product_id, tag_id)
      VALUES (o_product_id, JSON_UNQUOTE(JSON_EXTRACT(p_tag_ids_json, CONCAT('$[', i, ']'))));
      SET i = i + 1;
    END WHILE;
  END IF;

  -- 5. Insertar Ocasiones
  IF JSON_VALID(p_occasion_ids_json) AND JSON_LENGTH(p_occasion_ids_json) > 0 THEN
    SET v_len = JSON_LENGTH(p_occasion_ids_json);
    SET i = 0;
    WHILE i < v_len DO
      INSERT INTO product_occasions (product_id, occasion_id)
      VALUES (o_product_id, JSON_UNQUOTE(JSON_EXTRACT(p_occasion_ids_json, CONCAT('$[', i, ']'))));
      SET i = i + 1;
    END WHILE;
  END IF;

  -- 6. Insertar Imágenes del Producto
  IF JSON_VALID(p_images_json) AND JSON_LENGTH(p_images_json) > 0 THEN
    SET v_len = JSON_LENGTH(p_images_json);
    SET i = 0;
    WHILE i < v_len DO
      INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
      VALUES (
        o_product_id,
        JSON_UNQUOTE(JSON_EXTRACT(p_images_json, CONCAT('$[', i, '].image_url'))),
        JSON_UNQUOTE(JSON_EXTRACT(p_images_json, CONCAT('$[', i, '].alt_text'))),
        JSON_UNQUOTE(JSON_EXTRACT(p_images_json, CONCAT('$[', i, '].display_order'))),
        IF(i = 0, 1, 0) -- La primera imagen es la principal
      );
      SET i = i + 1;
    END WHILE;
  END IF;

  -- 7. Insertar Variantes (y sus imágenes)
  IF p_has_variants = 1 AND JSON_VALID(p_variants_json) AND JSON_LENGTH(p_variants_json) > 0 THEN
    SET v_len = JSON_LENGTH(p_variants_json);
    SET i = 0;
    WHILE i < v_len DO
      -- Insertar la variante
      INSERT INTO product_variants (
        product_id, name, price, sale_price, stock, description, short_description, specifications
      ) VALUES (
        o_product_id,
        JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].name'))),
        JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].price'))),
        JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].sale_price'))),
        JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].stock'))),
        JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].description'))),
        JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].short_description'))),
        JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].specifications'))
      );
      SET v_var_id = LAST_INSERT_ID();
      
      -- Forzar trigger de variante para SKU
      UPDATE product_variants SET updated_at = v_now WHERE id = v_var_id;

      -- Insertar imágenes de la variante
      SET @variant_images = JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].images'));
      IF JSON_VALID(@variant_images) AND JSON_LENGTH(@variant_images) > 0 THEN
        SET @j = 0;
        WHILE @j < JSON_LENGTH(@variant_images) DO
          INSERT INTO product_variant_images (variant_id, image_url, alt_text, display_order, is_primary)
          VALUES (
            v_var_id,
            JSON_UNQUOTE(JSON_EXTRACT(@variant_images, CONCAT('$[', @j, '].image_url'))),
            JSON_UNQUOTE(JSON_EXTRACT(@variant_images, CONCAT('$[', @j, '].alt_text'))),
            JSON_UNQUOTE(JSON_EXTRACT(@variant_images, CONCAT('$[', @j, '].display_order'))),
            IF(@j = 0, 1, 0)
          );
          SET @j = @j + 1;
        END WHILE;
      END IF;

      SET i = i + 1;
    END WHILE;
  END IF;

  -- Finalizar transacción
  IF v_had_error = 0 THEN
    COMMIT;
    SET o_result = 'ok';
    SET o_message = 'Producto creado correctamente.';
  END IF;

END$$
DELIMITER ;


-- =================================================================
--  PROCEDURE PARA ACTUALIZAR UN PRODUCTO DE FORMA SELECTIVA
-- =================================================================
DROP PROCEDURE IF EXISTS sp_Product_UpdateSelective;
DELIMITER $$
CREATE PROCEDURE sp_Product_UpdateSelective(
  IN  p_product_id            INT UNSIGNED,
  -- Parámetros base (NULL = no tocar)
  IN  p_name                  VARCHAR(255),
  IN  p_slug_opt              VARCHAR(255),
  IN  p_description           MEDIUMTEXT,
  IN  p_short_description     VARCHAR(160),
  IN  p_care_instructions     MEDIUMTEXT,
  IN  p_category_id           INT UNSIGNED,
  IN  p_allow_photo           TINYINT,
  IN  p_photo_price           DECIMAL(10,2),
  IN  p_price                 DECIMAL(10,2),
  IN  p_sale_price            DECIMAL(10,2),
  IN  p_stock                 INT,
  IN  p_has_variants          TINYINT,
  IN  p_status                VARCHAR(20),
  IN  p_specifications        JSON,
  -- JSON para colecciones (NULL=no tocar, []=limpiar, [...]=reemplazar)
  IN  p_tag_ids_json          JSON,
  IN  p_occasion_ids_json     JSON,
  IN  p_images_json           JSON,
  IN  p_variants_json         JSON,
  -- Parámetros de salida
  OUT o_sku_short             VARCHAR(64),
  OUT o_slug                  VARCHAR(255),
  OUT o_result                VARCHAR(20),
  OUT o_message               VARCHAR(255)
)
BEGIN
    DECLARE v_sql_update TEXT DEFAULT 'UPDATE products SET ';
    DECLARE v_update_fields TEXT DEFAULT '';
    DECLARE v_params_count INT DEFAULT 0;
    DECLARE v_now DATETIME DEFAULT NOW();
    DECLARE v_len INT;
    DECLARE i INT;
    DECLARE v_had_error TINYINT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN
        SET v_had_error = 1;
        ROLLBACK;
        SET o_result = 'error';
        SET o_message = 'E2: Error SQL al actualizar el producto.';
    END;

    START TRANSACTION;

    -- Construcción dinámica del UPDATE para la tabla 'products'
    IF p_name IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'name = ', QUOTE(p_name), ', '); END IF;
    IF p_slug_opt IS NOT NULL AND p_slug_opt != '' THEN SET v_update_fields = CONCAT(v_update_fields, 'slug = ', QUOTE(p_slug_opt), ', '); END IF;
    IF p_description IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'description = ', QUOTE(p_description), ', '); END IF;
    IF p_short_description IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'short_description = ', QUOTE(p_short_description), ', '); END IF;
    IF p_care_instructions IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'care_instructions = ', QUOTE(p_care_instructions), ', '); END IF;
    IF p_category_id IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'category_id = ', p_category_id, ', '); END IF;
    IF p_allow_photo IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'allow_photo = ', p_allow_photo, ', '); END IF;
    IF p_photo_price IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'photo_price = ', p_photo_price, ', '); END IF;
    IF p_price IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'price = ', p_price, ', '); END IF;
    IF p_sale_price IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'sale_price = ', p_sale_price, ', '); END IF;
    IF p_stock IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'stock = ', p_stock, ', '); END IF;
    IF p_has_variants IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'has_variants = ', p_has_variants, ', '); END IF;
    IF p_status IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'status = ', QUOTE(p_status), ', '); END IF;
    IF p_specifications IS NOT NULL THEN SET v_update_fields = CONCAT(v_update_fields, 'specifications = ', QUOTE(p_specifications), ', '); END IF;

    -- Si hay campos para actualizar, ejecuta el UPDATE
    IF LENGTH(v_update_fields) > 0 THEN
        SET v_sql_update = CONCAT(v_sql_update, LEFT(v_update_fields, LENGTH(v_update_fields) - 2), ' WHERE id = ', p_product_id);
        SET @sql_stmt = v_sql_update;
        PREPARE stmt FROM @sql_stmt;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    -- Lógica para Tags (si no es NULL)
    IF p_tag_ids_json IS NOT NULL THEN
        DELETE FROM product_tags WHERE product_id = p_product_id;
        IF JSON_LENGTH(p_tag_ids_json) > 0 THEN
            SET v_len = JSON_LENGTH(p_tag_ids_json);
            SET i = 0;
            WHILE i < v_len DO
                INSERT INTO product_tags (product_id, tag_id) VALUES (p_product_id, JSON_UNQUOTE(JSON_EXTRACT(p_tag_ids_json, CONCAT('$[', i, ']'))));
                SET i = i + 1;
            END WHILE;
        END IF;
    END IF;

    -- Lógica para Ocasiones (si no es NULL)
    IF p_occasion_ids_json IS NOT NULL THEN
        DELETE FROM product_occasions WHERE product_id = p_product_id;
        IF JSON_LENGTH(p_occasion_ids_json) > 0 THEN
            SET v_len = JSON_LENGTH(p_occasion_ids_json);
            SET i = 0;
            WHILE i < v_len DO
                INSERT INTO product_occasions (product_id, occasion_id) VALUES (p_product_id, JSON_UNQUOTE(JSON_EXTRACT(p_occasion_ids_json, CONCAT('$[', i, ']'))));
                SET i = i + 1;
            END WHILE;
        END IF;
    END IF;
    
    -- Lógica para Imágenes de Producto (si no es NULL)
    IF p_images_json IS NOT NULL THEN
        DELETE FROM product_images WHERE product_id = p_product_id;
        IF JSON_LENGTH(p_images_json) > 0 THEN
             SET v_len = JSON_LENGTH(p_images_json);
             SET i = 0;
             WHILE i < v_len DO
                 INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
                 VALUES (p_product_id, JSON_UNQUOTE(JSON_EXTRACT(p_images_json, CONCAT('$[', i, '].image_url'))), NULL, i, IF(i=0,1,0));
                 SET i = i + 1;
             END WHILE;
        END IF;
    END IF;

    -- Lógica para Variantes (si no es NULL)
    IF p_variants_json IS NOT NULL THEN
        DELETE FROM product_variants WHERE product_id = p_product_id; -- Simplificado: borra y re-inserta
        IF JSON_LENGTH(p_variants_json) > 0 THEN
             SET v_len = JSON_LENGTH(p_variants_json);
             SET i = 0;
             WHILE i < v_len DO
                INSERT INTO product_variants (product_id, name, price, sale_price, stock, description, specifications) 
                VALUES (p_product_id, JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].name'))), JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].price'))), JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].sale_price'))), JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].stock'))), JSON_UNQUOTE(JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].description'))), JSON_EXTRACT(p_variants_json, CONCAT('$[', i, '].specifications')));
                SET i = i + 1;
             END WHILE;
        END IF;
    END IF;

    -- Devolver datos actualizados
    SELECT sku_short, slug INTO o_sku_short, o_slug FROM products WHERE id = p_product_id;
    SET o_product_id = p_product_id;

    IF v_had_error = 0 THEN
        COMMIT;
        SET o_result = 'ok';
        SET o_message = 'Producto actualizado correctamente.';
    END IF;

END$$
DELIMITER ;
