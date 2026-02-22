DROP PROCEDURE IF EXISTS sp_Cart_UpsertItem;
DELIMITER $$

CREATE PROCEDURE sp_Cart_UpsertItem(
  -- IN (9)
  IN p_mode                 VARCHAR(10),      -- 'add' | 'set'
  IN p_session_id           VARCHAR(100),
  IN p_user_id              INT UNSIGNED,
  IN p_product_id           INT UNSIGNED,
  IN p_variant_id           INT UNSIGNED,     -- NULL/0 si no aplica
  IN p_quantity             INT,              -- cantidad solicitada
  IN p_custom_photo_url     VARCHAR(512),     -- NULL si no aplica
  IN p_is_complement        TINYINT(1),       -- 0/1
  IN p_parent_cart_item_id  INT UNSIGNED,     -- NULL si no aplica

  -- OUT (5)
  OUT o_cart_item_id        INT UNSIGNED,
  OUT o_result              INT,
  OUT o_message             VARCHAR(255),
  OUT o_subtotal            DECIMAL(10,2),
  OUT o_total               DECIMAL(10,2)
)
BEGIN
  DECLARE v_now                     DATETIME DEFAULT NOW();
  DECLARE v_available_stock         INT;
  DECLARE v_product_price           DECIMAL(10,2);
  DECLARE v_existing_cart_item_id   INT UNSIGNED;
  DECLARE v_current_cart_quantity   INT DEFAULT 0;
  DECLARE v_target_qty              INT;
  DECLARE v_allow_photo             TINYINT;

  -- Handler de errores
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET o_result  = 0;
    SET o_message = 'Error SQL al insertar/actualizar el carrito';
  END;

  -- Inicializar OUTs
  SET o_cart_item_id = NULL;
  SET o_result  = 0;
  SET o_message = '';
  SET o_subtotal = 0.00;
  SET o_total    = 0.00;

  -- Bloque principal etiquetado para permitir LEAVE
  main: BEGIN

    START TRANSACTION;

    /* ===========================
       1) Resolver producto/variante publicado + precio/stock + allow_photo
       =========================== */
    IF p_variant_id IS NOT NULL AND p_variant_id > 0 THEN
      -- Variante (validar producto publicado; si manejas status en la variante, descomenta la línea)
      SELECT 
        pv.stock,
        COALESCE(pv.sale_price, pv.price) AS eff_price,
        p.allow_photo
      INTO v_available_stock, v_product_price, v_allow_photo
      FROM products p
      JOIN product_variants pv 
        ON p.id = pv.product_id AND pv.id = p_variant_id
      WHERE p.id = p_product_id
        AND p.status = 'publicado'
        AND IFNULL(p.is_deleted,0) = 0
        AND IFNULL(pv.is_deleted,0) = 0
        /* AND pv.status = 'publicado' */  -- <- descomenta si existe esta columna
      LIMIT 1;
    ELSE
      -- Producto sin variante
      SELECT 
        p.stock,
        COALESCE(p.sale_price, p.price) AS eff_price,
        p.allow_photo
      INTO v_available_stock, v_product_price, v_allow_photo
      FROM products p
      WHERE p.id = p_product_id
        AND p.status = 'publicado'
        AND IFNULL(p.is_deleted,0) = 0
      LIMIT 1;
    END IF;

    IF v_available_stock IS NULL OR v_product_price IS NULL THEN
      SET o_result  = -1;
      SET o_message = 'Producto no disponible (no publicado o no encontrado).';
      ROLLBACK;
      LEAVE main;
    END IF;

    -- Validación de foto personalizada
    IF p_custom_photo_url IS NOT NULL AND v_allow_photo = 0 THEN
      SET o_result  = -3;
      SET o_message = 'El producto no permite foto personalizada.';
      ROLLBACK;
      LEAVE main;
    END IF;

    /* ===========================
       2) Buscar si el ítem ya existe en el carrito
       =========================== */
    SELECT id, quantity
      INTO v_existing_cart_item_id, v_current_cart_quantity
    FROM cart_items_stage
    WHERE product_id = p_product_id
      AND IFNULL(variant_id,0) = IFNULL(p_variant_id,0)
      AND IFNULL(custom_photo_url,'') = IFNULL(p_custom_photo_url,'')
      AND (
           (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND user_id IS NULL AND session_id = p_session_id)
      )
      AND IFNULL(is_deleted,0) = 0
    LIMIT 1;

    /* ===========================
       3) Calcular cantidad objetivo según p_mode y validar stock
       =========================== */
    SET v_target_qty = IFNULL(p_quantity, 1);
    IF v_target_qty <= 0 THEN SET v_target_qty = 1; END IF;

    IF LOWER(p_mode) = 'add' THEN
      SET v_target_qty = IFNULL(v_current_cart_quantity, 0) + v_target_qty;
    ELSEIF LOWER(p_mode) <> 'set' THEN
      -- Modo no válido
      SET o_result  = -4;
      SET o_message = 'Modo inválido. Use "add" o "set".';
      ROLLBACK;
      LEAVE main;
    END IF;

    IF v_available_stock <= 0 OR v_available_stock < v_target_qty THEN
      SET o_result  = -2;
      SET o_message = CONCAT('Stock insuficiente. Disponibles: ', IFNULL(v_available_stock,0));
      ROLLBACK;
      LEAVE main;
    END IF;

    /* ===========================
       4) Upsert
       =========================== */
    IF v_existing_cart_item_id IS NOT NULL THEN
      UPDATE cart_items_stage
         SET quantity             = v_target_qty,
             unit_price           = v_product_price,
             is_complement        = IFNULL(p_is_complement,0),
             parent_cart_item_id  = p_parent_cart_item_id,
             updated_at           = v_now
       WHERE id = v_existing_cart_item_id;

      SET o_cart_item_id = v_existing_cart_item_id;
      SET o_message = 'Cantidad actualizada en el carrito.';
    ELSE
      INSERT INTO cart_items_stage
        (session_id, user_id, product_id, variant_id, quantity, unit_price,
         custom_photo_url, is_complement, parent_cart_item_id,
         created_at, updated_at)
      VALUES
        (p_session_id, p_user_id, p_product_id, p_variant_id, v_target_qty, v_product_price,
         p_custom_photo_url, IFNULL(p_is_complement,0), p_parent_cart_item_id,
         v_now, v_now);

      SET o_cart_item_id = LAST_INSERT_ID();
      SET o_message = 'Producto agregado al carrito.';
    END IF;

    /* ===========================
       5) Subtotal y Total del carrito
       =========================== */
    SELECT COALESCE(SUM(quantity * unit_price), 0)
      INTO o_subtotal
    FROM cart_items_stage
    WHERE 
      (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND user_id IS NULL AND session_id = p_session_id)
      )
      AND IFNULL(is_deleted,0) = 0;

    SET o_total  = o_subtotal;  -- En etapa de carrito, total = subtotal
    SET o_result = 1;

    COMMIT;

  END main;
END$$

DELIMITER ;
