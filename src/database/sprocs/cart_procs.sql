
-- =============================================
-- sp_Cart_GetContents
-- Obtiene el contenido completo del carrito para un usuario o sesión.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Cart_GetContents;
DELIMITER $$
CREATE PROCEDURE sp_Cart_GetContents(
  IN p_session_id VARCHAR(64),
  IN p_user_id INT UNSIGNED
)
proc:BEGIN
  -- 1. Obtener la lista de items del carrito con detalles del producto
  SELECT
    ci.id AS cart_item_id,
    p.id AS product_id,
    p.name AS product_name,
    COALESCE(v.name, p.name) AS item_name,
    p.slug,
    ci.quantity,
    ci.unit_price,
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_url,
    c.name as category_name,
    c.slug as category_slug,
    ci.variant_id,
    v.name AS variant_name,
    ci.custom_photo_id,
    ci.custom_photo_url
  FROM cart_items_stage ci
  JOIN products p ON ci.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  LEFT JOIN product_variants v ON ci.variant_id = v.id
  WHERE
    ((p_user_id IS NOT NULL AND ci.user_id = p_user_id) OR (p_user_id IS NULL AND ci.session_id = p_session_id))
    AND ci.is_deleted = 0
    AND p.is_deleted = 0
    AND p.status = 'publicado';

  -- 2. Calcular los totales por separado
  SELECT
    COALESCE(SUM(ci.quantity), 0) AS total_items,
    ROUND(COALESCE(SUM(ci.quantity * ci.unit_price), 0), 2) AS subtotal
  FROM cart_items_stage ci
  WHERE
    ((p_user_id IS NOT NULL AND ci.user_id = p_user_id) OR (p_user_id IS NULL AND ci.session_id = p_session_id))
    AND ci.is_deleted = 0;
END $$
DELIMITER ;


-- =============================================
-- sp_Cart_SyncAndGet
-- Sincroniza el carrito de invitado con el de usuario y devuelve el contenido.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Cart_SyncAndGet;
DELIMITER $$
CREATE PROCEDURE sp_Cart_SyncAndGet(
  IN p_session_id VARCHAR(64),
  IN p_user_id INT UNSIGNED
)
proc:BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_product_id INT;
  DECLARE v_variant_id INT;
  DECLARE v_custom_photo_id BIGINT;
  DECLARE v_quantity INT;
  DECLARE v_custom_photo_url VARCHAR(512);

  -- Cursor para iterar sobre los items del carrito de invitado
  DECLARE guest_cart_cursor CURSOR FOR
    SELECT product_id, variant_id, custom_photo_id, quantity, custom_photo_url
    FROM cart_items_stage
    WHERE session_id = p_session_id AND user_id IS NULL AND is_deleted = 0;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- Iniciar transacción
  START TRANSACTION;

  -- Abrir el cursor
  OPEN guest_cart_cursor;

  -- Iterar y fusionar cada ítem
  read_loop: LOOP
    FETCH guest_cart_cursor INTO v_product_id, v_variant_id, v_custom_photo_id, v_quantity, v_custom_photo_url;
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- Usar sp_Cart_UpsertItem en modo 'add' para fusionar
    CALL sp_Cart_UpsertItem(
      p_session_id,
      p_user_id,
      'add',
      v_product_id,
      v_variant_id,
      v_quantity,
      v_custom_photo_id,
      v_custom_photo_url,
      @item_id, @items, @subtotal, @ok, @msg
    );
    -- Si el upsert falla por alguna razón, hacemos rollback y salimos
    IF @ok = 0 THEN
      ROLLBACK;
      -- Puedes añadir un SELECT para devolver el mensaje de error si lo necesitas
      -- SELECT 0 as success, @msg as message;
      LEAVE proc;
    END IF;

  END LOOP;

  -- Cerrar el cursor
  CLOSE guest_cart_cursor;

  -- Eliminar los items del carrito de invitado que ya fueron migrados
  DELETE FROM cart_items_stage WHERE session_id = p_session_id AND user_id IS NULL;

  -- Confirmar la transacción
  COMMIT;

  -- Finalmente, devolver el contenido del carrito del usuario ya unificado
  CALL sp_Cart_GetContents(p_session_id, p_user_id);

END $$
DELIMITER ;


-- =============================================
-- sp_Cart_UpsertItem
-- Añade, actualiza o elimina un ítem del carrito de compras.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Cart_UpsertItem;
DELIMITER $$
CREATE PROCEDURE sp_Cart_UpsertItem(
  IN  p_session_id        VARCHAR(64),
  IN  p_user_id           INT UNSIGNED,        -- NULL si invitado
  IN  p_mode              VARCHAR(4),          -- 'add' o 'set'
  IN  p_product_id        INT UNSIGNED,
  IN  p_variant_id        INT UNSIGNED,        -- NULL si sin variante
  IN  p_quantity          INT SIGNED,          -- cantidad a sumar o fijar (según modo)
  IN  p_custom_photo_id   BIGINT UNSIGNED,     -- NULL si no aplica
  IN  p_custom_photo_url  VARCHAR(512),        -- NULL si no aplica

  OUT p_out_item_id       INT UNSIGNED,
  OUT p_out_items         INT UNSIGNED,
  OUT p_out_subtotal      DECIMAL(10,2),
  OUT p_out_result        TINYINT,
  OUT p_out_message       VARCHAR(255)
)
proc:BEGIN
  DECLARE v_now DATETIME DEFAULT NOW();
  DECLARE v_price DECIMAL(10,2) DEFAULT 0.00;
  DECLARE v_is_published TINYINT DEFAULT 0;
  DECLARE v_current_qty INT SIGNED DEFAULT 0;
  DECLARE v_new_qty INT SIGNED DEFAULT 0;

  SET p_out_item_id = NULL;
  SET p_out_items = 0;
  SET p_out_subtotal = 0.00;
  SET p_out_result = 0;
  SET p_out_message = NULL;

  /* -------- 1) Validaciones básicas -------- */
  IF p_mode IS NULL OR (p_mode <> 'add' AND p_mode <> 'set') THEN
    SET p_out_message = 'Modo inválido (usa add|set)'; 
    LEAVE proc;
  END IF;

  IF p_quantity IS NULL THEN SET p_quantity = 0; END IF;
  IF p_mode = 'add' AND p_quantity < 1 THEN
    SET p_out_message = 'Cantidad inválida para agregar';
    LEAVE proc;
  END IF;

  /* Producto publicado */
  SELECT CASE WHEN p.status='publicado' AND p.is_deleted=0 THEN 1 ELSE 0 END
    INTO v_is_published
    FROM products p
   WHERE p.id = p_product_id
   LIMIT 1;

  IF v_is_published <> 1 OR v_is_published IS NULL THEN
    SET p_out_message = 'Producto no disponible (oculto/borrador/eliminado)';
    LEAVE proc;
  END IF;

  /* Resolver precio vigente (variant > product; sale_price > price) */
  IF p_variant_id IS NOT NULL THEN
    SELECT ROUND(COALESCE(v.sale_price, v.price, 0.00),2)
      INTO v_price
      FROM product_variants v
     WHERE v.id = p_variant_id
       AND v.product_id = p_product_id
       AND v.is_deleted = 0
     LIMIT 1;
  ELSE
    SELECT ROUND(COALESCE(p.sale_price, p.price, 0.00),2)
      INTO v_price
      FROM products p
     WHERE p.id = p_product_id
     LIMIT 1;
  END IF;

  IF v_price IS NULL OR v_price < 0 THEN
    SET p_out_message = 'Precio inválido';
    LEAVE proc;
  END IF;

  START TRANSACTION;

  /* -------- 2) Buscar si ya existe la línea "equivalente" -------- */
  SELECT id, quantity
    INTO p_out_item_id, v_current_qty
    FROM cart_items_stage
   WHERE ((user_id = p_user_id) OR (p_user_id IS NULL AND session_id = p_session_id))
     AND product_id = p_product_id
     AND ((variant_id IS NULL AND p_variant_id IS NULL) OR (variant_id = p_variant_id))
     AND ((custom_photo_id IS NULL AND p_custom_photo_id IS NULL) OR (custom_photo_id = p_custom_photo_id))
     AND is_deleted = 0
   LIMIT 1
   FOR UPDATE;

  /* -------- 3) Calcular nueva cantidad según modo -------- */
  IF p_mode = 'add' THEN
    IF p_out_item_id IS NULL THEN
      SET v_new_qty = GREATEST(1, p_quantity);
    ELSE
      SET v_new_qty = GREATEST(0, v_current_qty + p_quantity);
    END IF;
  ELSE /* p_mode = 'set' */
    SET v_new_qty = GREATEST(0, p_quantity);
  END IF;

  /* -------- 4) Insertar/Actualizar/Eliminar -------- */
  IF v_new_qty = 0 THEN
    IF p_out_item_id IS NOT NULL THEN
      DELETE FROM cart_items_stage WHERE id = p_out_item_id;
      SET p_out_item_id = NULL;
    END IF;
    SET p_out_result = 1;
    SET p_out_message = 'Ítem eliminado';
  ELSE
    IF p_out_item_id IS NULL THEN
      INSERT INTO cart_items_stage(
        session_id, user_id, product_id, variant_id,
        custom_photo_id, quantity, unit_price, custom_photo_url,
        created_at, updated_at
      ) VALUES (
        p_session_id, p_user_id, p_product_id, p_variant_id,
        p_custom_photo_id, v_new_qty, v_price, p_custom_photo_url,
        v_now, v_now
      );
      SET p_out_item_id = LAST_INSERT_ID();
    ELSE
      UPDATE cart_items_stage
         SET quantity       = v_new_qty,
             unit_price     = v_price,
             custom_photo_url = COALESCE(p_custom_photo_url, custom_photo_url),
             updated_at     = v_now
       WHERE id = p_out_item_id;
    END IF;

    /* Ligar foto personalizada si aplica */
    IF p_custom_photo_id IS NOT NULL THEN
      UPDATE custom_photos
         SET cart_item_id = p_out_item_id, updated_at = v_now
       WHERE id = p_custom_photo_id;
    END IF;

    SET p_out_result  = 1;
    SET p_out_message = 'Carrito actualizado';
  END IF;

  /* -------- 5) Totales seguros -------- */
  SELECT
    COALESCE(SUM(ci.quantity),0) AS items,
    ROUND(COALESCE(SUM(ci.quantity * ci.unit_price),0),2) AS subtotal
    INTO p_out_items, p_out_subtotal
  FROM cart_items_stage ci
  WHERE ((ci.user_id = p_user_id) OR (p_user_id IS NULL AND ci.session_id = p_session_id))
    AND ci.is_deleted = 0;

  COMMIT;
END $$
DELIMITER ;
