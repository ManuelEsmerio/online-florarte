// src/app/api/cart/add/route.ts
import { type NextRequest } from 'next/server';
import { cartService } from '@/services/cartService';
import { getIdentity, toIntOrThrow, toIntOrNull } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { productService } from '@/services/productService';
import { saveCartPhoto } from '@/services/file.service';
import { UserFacingError } from '@/utils/errors';

const MAX_CUSTOM_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_CUSTOM_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    if (!sessionId && !userId) throw new Error("Se requiere una sesión o un usuario para modificar el carrito.");

    const formData = await req.formData();
    const productId = toIntOrThrow(formData.get('productId'), 'productId');
    const quantity = toIntOrThrow(formData.get('quantity'), 'quantity');
    const variantId = toIntOrNull(formData.get('variantId'));
    const isComplement = formData.get('isComplement') === 'true';
    const parentCartItemId = formData.get('parentCartItemId') as string | null;
    const customPhotoFile = formData.get('customPhotoFile') as File | null;
    const deliveryDate = formData.get('deliveryDate') as string | null;
    const deliveryTimeSlot = formData.get('deliveryTimeSlot') as string | null;
    
    if (quantity < 1) throw new Error('La cantidad debe ser al menos 1.');

    const product = await productService.getCompleteProductDetailsById(productId);
    if (!product) throw new Error('Producto no encontrado.');
    
    let unitPrice = product.price;
    if (variantId) {
      const variant = product.variants?.find(v => v.id === variantId);
      if (variant) unitPrice = variant.sale_price ?? variant.price;
    } else if (product.sale_price) {
        unitPrice = product.sale_price;
    }

    let photoUrl: string | null = null;
    if (customPhotoFile) {
      if (!sessionId) {
        throw new UserFacingError('No pudimos asociar la fotografía personalizada con tu sesión. Vuelve a intentarlo.');
      }
      if (!ALLOWED_CUSTOM_PHOTO_TYPES.has(customPhotoFile.type)) {
        throw new UserFacingError('Solo se permiten imágenes JPG, PNG o WebP para las fotos personalizadas.');
      }
      if (customPhotoFile.size > MAX_CUSTOM_PHOTO_BYTES) {
        throw new UserFacingError('La foto personalizada no puede superar los 5MB.');
      }

      const { filePath } = await saveCartPhoto(customPhotoFile, sessionId, productId);
      photoUrl = filePath;
    }

    const { itemId } = await cartService.upsertItem({
      sessionId,
      userId,
      productId,
      variantId,
      quantity,
      unitPrice,
      isComplement,
      parentCartItemId,
      customPhotoUrl: photoUrl,
      deliveryDate,
      deliveryTimeSlot,
      mode: 'add',
    });

    return successResponse({ item_id: itemId }, 200);

  } catch (error: any) {
    console.error('[API_CART_ADD_ERROR]', error);
    return errorHandler(error, 400);
  }
}
