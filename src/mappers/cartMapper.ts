// src/mappers/cartMapper.ts
import type { CartItem } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';

/**
 * Pasa el valor del timeSlot tal como viene de la BD.
 * El formato para la UI se hará en el frontend.
 * @param timeSlot El rango de tiempo de la BD.
 * @returns El rango de tiempo de la BD.
 */
function passThroughTimeSlot(timeSlot: string | null | undefined): string {
    if (!timeSlot) return 'No especificado';
    return timeSlot;
}

/**
 * Mapea una fila del resultado del SP sp_Cart_GetContents a un objeto CartItem.
 * @param dbItem - El objeto de la fila de la base de datos.
 * @returns Un objeto CartItem para usar en el frontend.
 */
export function mapDbCartItemToCartItem(dbItem: any): CartItem {
  // Prioriza la imagen de la variante, si no, usa la del producto, y si no, un placeholder.
  const imageUrl = dbItem.variant_image 
    ? getPublicUrlForPath(dbItem.variant_image)
    : dbItem.product_image
    ? getPublicUrlForPath(dbItem.product_image)
    : '/placehold.webp';


  return {
    id: dbItem.product_id,
    cartItemId: dbItem.id.toString(), // El ID único del renglón en el carrito
    name: dbItem.product_name,
    slug: dbItem.product_slug,
    code: dbItem.variant_code || dbItem.product_sku_short,
    description: null, 
    price: parseFloat(dbItem.unit_price), 
    sale_price: null, 
    stock: -1,
    has_variants: !!dbItem.variant_id,
    status: 'publicado',
    category: {
      id: 0, 
      name: dbItem.category_name,
      slug: dbItem.category_slug,
      prefix: '',
      description: '',
      image_url: '',
      show_on_home: false,
    },
    image: imageUrl,
    quantity: parseInt(dbItem.quantity, 10),
    variants: dbItem.variant_id ? [{
      id: dbItem.variant_id,
      name: dbItem.variant_name,
      price: parseFloat(dbItem.unit_price),
      stock: -1,
    }] : [],
    deliveryDate: dbItem.delivery_date ? dbItem.delivery_date : 'No especificada',
    deliveryTime: dbItem.delivery_time_slot,
    photoOption: dbItem.custom_photo_url ? 'Con Foto' : 'Sin Foto',
    customPhotoUrl: dbItem.custom_photo_url ? getPublicUrlForPath(dbItem.custom_photo_url) : undefined,
    isComplement: !!dbItem.is_complement,
    parentCartItemId: dbItem.parent_cart_item_id
  };
}
