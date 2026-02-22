// src/mappers/productMapper.ts
import type { DbProduct, Product, Tag, ProductVariant } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';

/**
 * Mapea una fila de la tabla `products` a un objeto `Product` limpio.
 *
 * NOTA IMPORTANTE: Este mapper solo transforma los campos directos de la tabla `products`.
 * Las propiedades complejas como `category`, `images`, `tags`, `variants`, y `occasions`
 * deben ser añadidas al objeto resultante en la capa de SERVICIO, después de
 * haber hecho las consultas JOIN correspondientes.
 *
 * @param row El objeto DbProduct que viene directamente del repositorio.
 * @returns Un objeto Product parcial, listo para ser enriquecido en la capa de servicio.
 */
export function mapDbProductToProduct(row: DbProduct): Omit<Product, 'category' | 'image' | 'images'> {
  let specifications = null;
  try {
      if (row.specifications && typeof row.specifications === 'string') {
          specifications = JSON.parse(row.specifications);
      } else if (row.specifications) {
          specifications = row.specifications;
      }
  } catch (e) {
      console.error(`Error parsing specifications JSON for product ID ${row.id}:`, e);
      specifications = [{ key: "error", value: "Especificaciones inválidas" }];
  }
  
  const hasVariants = !!row.has_variants;
  
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    code: row.sku_short,
    description: row.description,
    short_description: row.short_description,
    specifications: specifications,
    price: hasVariants ? 0 : row.price ?? 0, // El precio se definirá por la variante
    sale_price: hasVariants ? null : row.sale_price,
    stock: hasVariants ? 0 : row.stock ?? 0, // El stock se definirá por la variante
    has_variants: hasVariants,
    status: row.status,
    is_deleted: !!row.is_deleted,
    care: row.care_instructions,
    allow_photo: !!row.allow_photo,
    photo_price: row.photo_price ?? undefined,
    
    tags: [],
    variants: [],
    occasions: [],
  };
}

export function mapDbVariantToVariant(row: any): ProductVariant {
    let specifications = null;
    try {
        if (row.specifications && typeof row.specifications === 'string') {
            specifications = JSON.parse(row.specifications);
        } else {
            specifications = row.specifications;
        }
    } catch (e) {
        specifications = null;
    }

    return {
        id: row.id,
        product_id: row.product_id,
        name: row.name,
        price: parseFloat(row.price),
        sale_price: row.sale_price ? parseFloat(row.sale_price) : null,
        stock: parseInt(row.stock, 10),
        code: row.sku_short,
        short_description: row.short_description,
        description: row.description,
        specifications: specifications,
        images: [],
    }
}

/**
 * Mapea el resultado de la vista `v_complement_products` a un objeto Product.
 * Esta función es especial porque la consulta puede devolver un producto base
 * o una variante aplanada como si fuera un producto.
 */
export function mapDbComplementToProduct(dbRow: any): Product {
    const imageUrl = dbRow.image_url ? getPublicUrlForPath(dbRow.image_url) : '/placehold.webp';

    return {
        id: dbRow.id, // Este es el product_id
        variantId: dbRow.variant_id, // Este es el id de la variante, o NULL
        name: dbRow.name,
        slug: dbRow.slug,
        code: dbRow.code,
        description: dbRow.description || null,
        price: parseFloat(dbRow.price),
        sale_price: dbRow.sale_price ? parseFloat(dbRow.sale_price) : null,
        stock: parseInt(dbRow.stock, 10),
        status: 'publicado',
        has_variants: !!dbRow.variant_id,
        category: {
            id: dbRow.category_id,
            name: dbRow.category_name,
            slug: dbRow.category_slug,
            prefix: '',
            description: '',
            image_url: '',
            show_on_home: false
        },
        image: imageUrl,
        images: [{ src: imageUrl, alt: dbRow.name, is_primary: true }],
    };
}