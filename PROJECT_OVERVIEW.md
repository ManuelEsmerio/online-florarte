
# Resumen del Proyecto: Florería Florarte E-commerce

Este documento proporciona un resumen técnico completo de la aplicación de comercio electrónico para la Florería Florarte, diseñado para ser utilizado como contexto por una IA.

## 1. Stack Tecnológico Principal

- **Framework Frontend:** Next.js 15+ con App Router.
- **Lenguaje:** TypeScript.
- **Estilos:** Tailwind CSS.
- **Componentes UI:** ShadCN UI, con íconos de `lucide-react`.
- **Formularios:** React Hook Form con Zod para validación.
- **Gestión de Estado Global:** React Context API (`AuthContext`, `CartContext`).
- **Backend/API:** Rutas de API de Next.js (`/src/api`).
- **Base de Datos:** MySQL.
- **ORM/Acceso a BD:** `mysql2/promise` (acceso directo, sin ORM completo).
- **Autenticación:** JWT (JSON Web Tokens) con cookies `httpOnly` para `accessToken` y `refreshToken`.
- **Inteligencia Artificial:** Genkit (aunque actualmente no está implementado en flujos específicos).

## 2. Arquitectura General

La aplicación sigue una arquitectura monolítica con una separación lógica clara entre el frontend (componentes de React en `/src/app` y `/src/components`) y el backend (rutas de API en `/src/api`).

- **Frontend (Cliente y Admin):**
  - **Tienda Pública:** Ubicada en `/src/app`, incluye páginas para ver productos, categorías, carrito, checkout, blog y páginas legales.
  - **Panel de Administración:** Ubicado en `/src/app/admin`, protegido por `AuthContext` para requerir rol de 'admin'. Permite la gestión de productos, pedidos, cupones y usuarios.
- **Backend (API):**
  - Ubicado en `/src/api`, expone endpoints RESTful para interactuar con la base de datos.
  - Sigue un patrón de **Controlador -> Servicio**.
    - **Controladores (`/src/lib/controllers`):** Manejan la lógica de la petición HTTP, validación y orquestación.
    - **Servicios (`/src/lib/services`):** Contienen la lógica de negocio pura y las interacciones directas con la base de datos.
- **Base de Datos:**
  - El esquema se define en `database.sql`.
  - Incluye tablas para `users`, `products`, `categories`, `orders`, `order_items`, `coupons`, `addresses`, y tablas de auditoría y tokens.
  - Utiliza **claves foráneas** para mantener la integridad relacional y **triggers** para la auditoría automática.

## 3. Flujos de Datos Clave

### Flujo de Carrito Híbrido (Invitado y Usuario)

La aplicación implementa un sistema de carrito híbrido para permitir a los usuarios agregar productos sin iniciar sesión, reduciendo la fricción. La autenticación solo se requiere en el checkout.

- **Carrito de Invitado**: Se gestiona mediante un `session_id` único almacenado en una cookie.
- **Fusión de Carrito**: Al iniciar sesión, el carrito de invitado se fusiona automáticamente con el carrito persistente del usuario.
- **Checkout Protegido**: El paso final de la compra requiere autenticación.

**Para una explicación detallada de esta arquitectura, consulta el documento: `docs/Hybrid-Cart-Architecture.md`**

### Flujo de Autenticación

1.  **Login (`/api/users/login`):**
    - El usuario envía `email` y `password`.
    - `user.controller` llama a `userService.validatePassword`.
    - Si las credenciales son válidas, se generan un `accessToken` (15 min) y un `refreshToken` (7 días).
    - Los tokens se guardan en cookies `httpOnly`.
    - Se devuelve al cliente la información del usuario y un `accessToken` no-httpOnly para uso en el estado del cliente (`AuthContext`).
2.  **Protección de Rutas:**
    - `getDecodedToken` en `auth.ts` se usa en las rutas de API para verificar el `accessToken`.
    - `AuthContext` en el frontend protege las rutas del cliente (`/profile`, `/orders`) y del admin (`/admin`).
3.  **Refresco de Token (`/api/auth/refresh`):**
    - Si el `accessToken` expira, el `apiFetch` (helper en `AuthContext`) intenta automáticamente obtener uno nuevo usando el `refreshToken`.

### Flujo de Creación/Edición de Productos (Admin)

1.  **UI (`product-form.tsx`):**
    - El administrador llena el formulario. El `Select` de categoría muestra los nombres (`category.name`) pero su valor es el ID numérico (`category.id`).
    - Las imágenes se suben y se previsualizan.
2.  **Subida de Imágenes (`/api/products/upload`):**
    - Antes de guardar el producto, si hay nuevas imágenes, se envían a este endpoint.
    - `file-utils.ts` las guarda en `/public/assets/products` y devuelve las URLs públicas.
3.  **Guardado de Producto (`/api/products` o `/api/products/[slug]`):**
    - `product.controller` recibe los datos del producto, incluyendo las URLs de las imágenes y el `category_id` (como número).
    - `productSchema` (Zod) valida todos los campos.
    - Se llama a `productService.create` o `productService.update`.
    - **Servicio (`product.service.ts`):**
        - Se conecta a la BD.
        - Llama al procedimiento almacenado `CreateProduct` o `UpdateProduct` con los 11 parámetros exactos requeridos.
        - Maneja la inserción/actualización de etiquetas (`tags`) y de las URLs de las imágenes en las tablas correspondientes (`product_tags`, `product_images`).
        - Registra la acción en la tabla de auditoría (`audit_log`).
        - Devuelve el producto creado/actualizado.

### Flujo de Compra (Checkout)

1.  **Carrito (`CartContext.tsx`):** El estado del carrito se gestiona en el lado del cliente y se persiste en `localStorage`.
2.  **Página de Checkout (`checkout/page.tsx`):**
    - El usuario debe estar autenticado (`useAuth`).
    - Selecciona una dirección de envío guardada o crea una nueva.
    - Puede aplicar un cupón (`/api/coupons/validate`).
    - Llena los datos de pago (simulados).
3.  **Confirmación del Pedido (`/api/checkout`):**
    - El `checkout.controller` recibe el payload del pedido.
    - **Validación crítica:** Se verifican los productos y su stock en la base de datos para evitar que se compre algo no disponible.
    - `orderService.createOrder` es llamado:
        - Inicia una transacción de base de datos.
        - Llama al procedimiento `CreateFullOrder` para insertar el pedido en la tabla `orders`.
        - Inserta los productos del carrito en `order_items`.
        - Si se usó un cupón, `couponService.incrementUseCount` actualiza su contador de usos.
        - `paymentService.recordPayment` registra el pago.
    - `emailService` envía correos de confirmación al cliente y de notificación al admin.
    - Se confirma la transacción (commit).

## 4. Estructura de la Base de Datos (`database.sql`)

-   **`products`**: Almacena detalles del producto. `category_id` es una FK a `categories`.
-   **`categories`**: Lista de categorías de productos.
-   **`product_images`**: Almacena múltiples imágenes por producto (relación uno a muchos).
-   **`tags`** y **`product_tags`**: Manejan las etiquetas de productos (relación muchos a muchos).
-   **`users`**: Contiene información de usuarios y administradores.
-   **`addresses`**: Múltiples direcciones por usuario.
-   **`orders`**: Cabecera de los pedidos. FK a `users`, `addresses`, `coupons`.
-   **`order_items`**: Detalle de los productos en cada pedido. FK a `orders` y `products`.
-   **`coupons`**: Almacena cupones de descuento.
-   **`user_coupons`**: Asocia cupones específicos a usuarios.
-   **`payments`**: Registro de transacciones de pago.
-   **`audit_log`**: Tabla de auditoría poblada por triggers.
-   **`refresh_tokens`**: Gestiona los tokens de refresco para la autenticación.
-   **Procedimientos Almacenados:**
    - `CreateProduct`, `UpdateProduct`, `DeleteUser`, `CreateFullOrder`: Encapsulan lógica de negocio compleja y transacciones, asegurando consistencia.
-   **Triggers:**
    - `before_product_update`, `after_product_delete`, `after_user_update`, etc.: Automatizan la creación de registros de auditoría.

Este resumen cubre los aspectos más críticos del proyecto. Utilízalo como base de conocimiento para entender el funcionamiento interno y las interdependencias entre las distintas partes del sistema.
