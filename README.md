# Florería Florarte - Tienda en Línea

Este proyecto es una aplicación de comercio electrónico full-stack construida con Next.js, TypeScript y Tailwind CSS.

## Tecnologías Utilizadas

- **Framework:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** ShadCN UI
- **Formularios:** React Hook Form + Zod
- **Estado Global:** React Context API
- **Iconos:** Lucide React
- **Tablas:** TanStack Table

---

## Checklist para Puesta en Producción

Antes de lanzar tu sitio web, asegúrate de completar los siguientes pasos:

### 1. Reemplazar Imágenes de Platzhalter

Recorre los archivos del proyecto (especialmente en `src/lib/` y `src/components/`) y sustituye todas las URLs de `https://placehold.co/...` por las imágenes reales de tus productos y categorías.

### 2. Configurar la API Key de Google Maps

El mapa en la página de checkout necesita una clave de API para funcionar.

1.  Obtén una clave de API desde la [Consola de Google Cloud](https://console.cloud.google.com/google/maps-apis/overview).
2.  Crea un archivo `.env.local` en la raíz del proyecto.
3.  Añade la clave a ese archivo:
    ```
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="TU_API_KEY_AQUI"
    ```

### 3. Actualizar la URL del Sitio

Asegúrate de que la URL de tu dominio esté correctamente configurada en los siguientes archivos para un SEO óptimo:

- `src/app/sitemap.ts`
- `src/app/robots.ts`

### 4. Configurar Base de Datos y Stripe (Test Mode)

La aplicación usa Prisma + MySQL y Stripe en modo prueba para checkout real.

1. Crea un archivo `.env.local` tomando como base `.env.example`.
2. Completa al menos estas variables:

   ```
   DATABASE_URL="mysql://usuario:password@localhost:3306/online_florarte"
   NEXT_PUBLIC_APP_URL="http://localhost:9002"
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   RESEND_API_KEY="re_..."
   EMAIL_FROM="Florarte <no-reply@tudominio.com>"
   ADMIN_EMAIL="admin@tudominio.com"
   ```

3. Ejecuta migraciones de Prisma:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. Levanta el proyecto:

   ```bash
   npm run dev
   ```

5. En otra terminal, conecta Stripe CLI al webhook local:

   ```bash
   stripe listen --forward-to localhost:9002/api/stripe/webhook
   ```

6. Pruebas rápidas de pago:
   - **Éxito:** `4242 4242 4242 4242`
   - **Tarjeta declinada:** `4000 0000 0000 9995`
   - Fecha futura y CVC de 3 dígitos.

### 5. Configurar Mercado Pago en Sandbox

Además de Stripe, puedes probar el checkout con Mercado Pago.

1. En tu `.env.local`, agrega las credenciales sandbox:

   ```
   MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
   MERCADO_PAGO_WEBHOOK_SECRET="tu-secreto-webhook"
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TEST-..."
   ```

2. Asegúrate de exponer públicamente tu entorno local (ngrok u otro túnel) y registra la URL del webhook en el panel de Mercado Pago apuntando a `https://TU_TUNEL/api/mercadopago/webhook`.

3. Para pruebas manuales puedes usar las tarjetas sandbox oficiales de Mercado Pago:
   - **Aprobada:** `5031 7557 3453 0604`
   - **Rechazada:** `4926 7222 1111 9083`
   - Usa cualquier CVC y una fecha futura.

4. Si necesitas simular un webhook aprobado manualmente:

   ```bash
   curl -X POST https://api.mercadopago.com/v1/payments \
     -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "transaction_amount": 100,
       "token": "TEST-...",
       "installments": 1,
       "payment_method_id": "visa",
       "payer": { "email": "test_user_XXXX@testuser.com" },
       "external_reference": "<ORDER_ID>"
     }'
   ```

   Reemplaza `<ORDER_ID>` por el ID real de la orden y revisa los logs del webhook para confirmar el flujo completo.

5. Se necesita un SP para poder liberar cupones y stock si la compra falla

DELIMITER $$

CREATE PROCEDURE expire_pending_orders()
BEGIN

    DECLARE done INT DEFAULT FALSE;
    DECLARE v_order_id INT;

    DECLARE cur CURSOR FOR
        SELECT id
        FROM orders
        WHERE status = 'PENDING'
        AND createdAt <= (NOW() - INTERVAL 30 MINUTE);

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP

        FETCH cur INTO v_order_id;

        IF done THEN
            LEAVE read_loop;
        END IF;

        -- 1️⃣ Restaurar stock
        UPDATE product_variants pv
        JOIN order_items oi ON oi.variantId = pv.id
        SET pv.stock = pv.stock + oi.quantity
        WHERE oi.orderId = v_order_id;

        UPDATE products p
        JOIN order_items oi ON oi.productId = p.id
        SET p.stock = p.stock + oi.quantity
        WHERE oi.orderId = v_order_id
        AND oi.variantId IS NULL;

        -- 2️⃣ Liberar cupón (decrementar uso)
        UPDATE coupons c
        JOIN orders o ON o.couponId = c.id
        SET c.usesCount = GREATEST(c.usesCount - 1,0)
        WHERE o.id = v_order_id;

        -- 3️⃣ Marcar orden como expirada
        UPDATE orders
        SET status = 'EXPIRED'
        WHERE id = v_order_id;

    END LOOP;

    CLOSE cur;

END$$

DELIMITER ;
