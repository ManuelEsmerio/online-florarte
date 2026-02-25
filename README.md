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
