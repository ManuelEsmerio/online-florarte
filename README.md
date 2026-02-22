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

### 4. Conectar Base de Datos y Pasarela de Pago

La aplicación utiliza datos de prueba guardados en memoria. Para una funcionalidad completa, necesitarás:
-   **Conectar una Base de Datos:** Reemplaza la lógica en `src/lib/`, `src/context/AuthContext.tsx`, etc., para conectar con una base de datos de producción (ej. Firebase Firestore, Supabase, MongoDB).
-   **Integrar una Pasarela de Pago:** Implementa un servicio de pago real (ej. Stripe, Mercado Pago) en la página `src/app/checkout/page.tsx` para procesar las transacciones.
