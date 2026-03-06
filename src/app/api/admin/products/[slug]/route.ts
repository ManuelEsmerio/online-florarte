// src/app/api/admin/products/[slug]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { productService } from '@/services/productService';
import type { ProductStatus } from '@/lib/definitions';
import { z, ZodError } from 'zod';

// Mismo schema que en products/route.ts POST — aplicado también al PUT
const productVariantSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(100).optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
}).passthrough();

const productUpdateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(300),
  slug: z.string().max(350).optional(),
  code: z.string().max(100).optional(),
  description: z.string().max(10000).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  price: z.number().nonnegative(),
  sale_price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  has_variants: z.boolean().optional(),
  status: z.enum(['PUBLISHED', 'HIDDEN', 'DRAFT', 'PUBLICADO', 'OCULTO', 'BORRADOR']).optional(),
  care: z.string().max(2000).optional().nullable(),
  badge_text: z.string().max(50).optional().nullable(),
  allow_photo: z.boolean().optional(),
  photo_price: z.number().nonnegative().optional().nullable(),
  category_id: z.number().int().positive('La categoría es obligatoria'),
  main_image: z.string().max(1000).optional().nullable(),
  images: z.array(z.unknown()).optional(),
  tag_ids: z.array(z.number().int().positive()).optional(),
  occasion_ids: z.array(z.number().int().positive()).optional(),
  specifications: z.array(z.record(z.unknown())).optional(),
  variants: z.array(productVariantSchema).optional(),
}).passthrough();

interface RouteParams {
  params: Promise<{ slug: string }>;
}


/**
 * GET /api/admin/products/[slug]
 * Endpoint protegido para obtener los detalles completos de un producto.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  let routeSlug = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { slug } = await params;
    routeSlug = slug;
    const product = await productService.getCompleteProductDetailsBySlug(slug);

    if (!product) {
      return errorHandler(new Error('Producto no encontrado.'), 404);
    }

    return successResponse(product);
  } catch (error) {
    console.error(`[API_ADMIN_PRODUCT_GET_ERROR] Slug: ${routeSlug}`, error);
    return errorHandler(error);
  }
}


/**
 * PUT /api/admin/products/[slug]
 * Endpoint protegido para actualizar un producto.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeSlug = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { slug } = await params;
    routeSlug = slug;
    
    // Check if it's a simple status update (from toggle) or a full form update
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        const body = await req.json();
        if (body.isStatusUpdate && body.productData?.status) {
             const updatedProduct = await productService.updateProductStatus(slug, body.productData.status, session.dbId);
             return successResponse(updatedProduct);
        }
    }

    const formData = await req.formData();
    const productDataString = formData.get('productData') as string;

    if (!productDataString) {
      return errorHandler(new Error('No se proporcionaron datos del producto.'), 400);
    }

    const productData = productUpdateSchema.parse(JSON.parse(productDataString));

    // Capturar todas las imágenes y asociarlas a sus variantes
    const imageFiles: { main: File[], variants: { index: number, files: File[] }[] } = {
        main: formData.getAll('images') as File[],
        variants: []
    };

    productData.variants?.forEach((variant: any, index: number) => {
        const variantImages = formData.getAll(`variant_${index}_images`) as File[];
        if (variantImages.length > 0) {
            imageFiles.variants.push({ index, files: variantImages });
        }
    });
    
    const upsertResult = await productService.updateProduct(slug, productData, imageFiles, session.dbId);

    return successResponse({
      product: {
        id: upsertResult.id,
        slug: upsertResult.slug,
        code: upsertResult.code,
      },
      dbResult: {
        result: upsertResult.result,
        message: upsertResult.message,
      }
    });

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    if (error instanceof SyntaxError) { // JSON.parse error
      return errorHandler(new Error('Los datos del producto tienen un formato JSON inválido.'), 400);
    }
    console.error(`[API_ADMIN_PRODUCT_UPDATE_ERROR] Slug: ${routeSlug}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/products/[slug]
 * Endpoint protegido para realizar un borrado lógico de un producto.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let routeSlug = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { slug } = await params;
    routeSlug = slug;
    const success = await productService.softDeleteProduct(slug, session.dbId);

    if (!success) {
      return errorHandler(new Error('No se pudo eliminar el producto.'), 404);
    }

    return successResponse({ message: 'Producto eliminado correctamente (borrado lógico).' });
  } catch (error) {
    console.error(`[API_ADMIN_PRODUCT_DELETE_ERROR] Slug: ${routeSlug}`, error);
    return errorHandler(error);
  }
}
