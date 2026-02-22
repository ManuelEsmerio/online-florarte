/**
 * Florería Florarte - Esquema de Base de Datos MongoDB
 *
 * Este documento define la estructura de datos propuesta para migrar la aplicación
 * a una base de datos MongoDB. Está diseñado como un plano para desarrolladores y
 * puede usarse como referencia para configurar modelos y validaciones (ej. con Mongoose).
 *
 * Leyenda:
 * - ObjectId("..."): Indica una referencia a un documento en otra colección.
 * - []: Indica un array de sub-documentos o valores.
 * - [ObjectId("...")]: Indica un array de referencias a documentos en otra colección.
 */

// -------------------------------------------
// Colección: users
// -------------------------------------------
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "role", "createdAt"],
      properties: {
        name: { bsonType: "string", description: "Nombre completo del usuario." },
        email: { bsonType: "string", description: "Correo electrónico único del usuario, usado para login." },
        phone: { bsonType: ["string", "null"], description: "Teléfono de contacto del usuario." },
        role: { enum: ["customer", "admin", "delivery"], description: "Rol del usuario en el sistema." },
        profilePicUrl: { bsonType: ["string", "null"], description: "URL de la imagen de perfil." },
        loyaltyPoints: { bsonType: "int", description: "Puntos de lealtad acumulados." },
        wishlist: {
          bsonType: "array",
          description: "Array de ObjectIds que referencian productos en la colección 'products'.",
          items: { bsonType: "objectId" }
        },
        addresses: {
          bsonType: "array",
          description: "Array de direcciones embebidas del usuario.",
          items: {
            bsonType: "object",
            required: ["alias", "recipientName", "phone", "streetName", "streetNumber", "neighborhood", "city", "state", "postalCode", "addressType"],
            properties: {
              alias: { bsonType: "string" },
              recipientName: { bsonType: "string" },
              phone: { bsonType: "string" },
              streetName: { bsonType: "string" },
              streetNumber: { bsonType: "string" },
              interiorNumber: { bsonType: ["string", "null"] },
              neighborhood: { bsonType: "string" },
              city: { bsonType: "string" },
              state: { bsonType: "string" },
              postalCode: { bsonType: "string" },
              addressType: { bsonType: "string" },
              reference_notes: { bsonType: ["string", "null"] }
            }
          }
        },
        isDeleted: { bsonType: "bool", default: false },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});
// Índices sugeridos para la colección `users`
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ "wishlist": 1 });


// -------------------------------------------
// Colección: products
// -------------------------------------------
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "code", "category", "status"],
      properties: {
        name: { bsonType: "string" },
        slug: { bsonType: "string" },
        code: { bsonType: "string", description: "SKU principal del producto." },
        description: { bsonType: "string" },
        shortDescription: { bsonType: ["string", "null"] },
        care: { bsonType: ["string", "null"] },
        status: { enum: ["publicado", "oculto", "borrador"] },
        category: { bsonType: "objectId", description: "Referencia al _id de un documento en la colección 'categories'." },
        tags: { bsonType: "array", items: { bsonType: "objectId" } },
        occasions: { bsonType: "array", items: { bsonType: "objectId" } },
        price: { bsonType: "double", description: "Precio para productos sin variantes." },
        salePrice: { bsonType: ["double", "null"], description: "Precio de oferta para productos sin variantes." },
        stock: { bsonType: "int", description: "Stock para productos sin variantes." },
        allowPhoto: { bsonType: "bool", default: false },
        photoPrice: { bsonType: ["double", "null"] },
        hasVariants: { bsonType: "bool" },
        variants: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name", "price", "stock"],
            properties: {
              name: { bsonType: "string" },
              price: { bsonType: "double" },
              salePrice: { bsonType: ["double", "null"] },
              stock: { bsonType: "int" },
              code: { bsonType: ["string", "null"], description: "SKU específico de la variante." },
              specifications: { bsonType: "array", items: { bsonType: "object", properties: { key: {bsonType: "string"}, value: {bsonType: "string"} } } }
            }
          }
        },
        images: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["src"],
            properties: {
              src: { bsonType: "string" },
              alt: { bsonType: "string" },
              isPrimary: { bsonType: "bool" }
            }
          }
        },
        isDeleted: { bsonType: "bool", default: false },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});
// Índices sugeridos para `products`
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ status: 1 });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "tags": 1 });
db.products.createIndex({ "occasions": 1 });
db.products.createIndex({ "name": "text", "description": "text", "tags.name": "text" }); // Para búsquedas de texto


// -------------------------------------------
// Colecciones de Taxonomía (Simples)
// -------------------------------------------
db.createCollection("categories");
db.categories.createIndex({ slug: 1 }, { unique: true });

db.createCollection("occasions");
db.occasions.createIndex({ slug: 1 }, { unique: true });

db.createCollection("tags");
db.tags.createIndex({ name: 1 }, { unique: true });


// -------------------------------------------
// Colección: orders
// -------------------------------------------
db.createCollection("orders", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["orderNumber", "userId", "status", "total", "createdAt"],
            properties: {
                orderNumber: { bsonType: "string", description: "Identificador legible para el cliente (ej. ORD1001)." },
                userId: { bsonType: "objectId", description: "Referencia al usuario que realizó el pedido." },
                status: { enum: ["pendiente", "procesando", "en_reparto", "completado", "cancelado"] },
                total: { bsonType: "double" },
                subtotal: { bsonType: "double" },
                shippingCost: { bsonType: "double" },
                couponDiscount: { bsonType: ["double", "null"] },
                couponCode: { bsonType: ["string", "null"] },
                shippingAddress: {
                    bsonType: "object",
                    description: "Copia de la dirección en el momento de la compra para mantener la inmutabilidad."
                    // Mismos campos que la dirección del usuario
                },
                items: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["productId", "name", "quantity", "price"],
                        properties: {
                            productId: { bsonType: "objectId" },
                            variantId: { bsonType: "objectId", "description": "Si aplica" },
                            name: { bsonType: "string" },
                            quantity: { bsonType: "int" },
                            price: { bsonType: "double", description: "Precio unitario en el momento de la compra." },
                            customPhotoUrl: { bsonType: ["string", "null"] }
                        }
                    }
                },
                deliveryDate: { bsonType: "date" },
                deliveryTimeSlot: { bsonType: "string" },
                dedication: { bsonType: ["string", "null"] },
                signature: { bsonType: ["string", "null"] },
                isAnonymous: { bsonType: "bool" },
                createdAt: { bsonType: "date" },
                updatedAt: { bsonType: "date" }
            }
        }
    }
});
// Índices sugeridos para `orders`
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });


// -------------------------------------------
// Colección: coupons
// -------------------------------------------
db.createCollection("coupons");
db.coupons.createIndex({ code: 1 }, { unique: true });
db.coupons.createIndex({ validUntil: 1 });


// -------------------------------------------
// Colección: testimonials
// -------------------------------------------
db.createCollection("testimonials");
db.testimonials.createIndex({ status: 1 });
db.testimonials.createIndex({ userId: 1 });
db.testimonials.createIndex({ orderId: 1 });


// -------------------------------------------
// Colecciones adicionales
// -------------------------------------------
db.createCollection("shipping_zones");
db.shipping_zones.createIndex({ postalCode: 1 }, { unique: true });

db.createCollection("loyalty_histories");
db.loyalty_histories.createIndex({ userId: 1 });

db.createCollection("announcements");
db.announcements.createIndex({ is_active: 1, start_at: 1, end_at: 1 });

db.createCollection("peak_days");
db.peak_days.createIndex({ peak_date: 1 });
