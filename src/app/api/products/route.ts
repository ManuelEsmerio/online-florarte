// src/app/api/products/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';

/**
 * GET /api/products
 * Endpoint público para obtener productos con paginación.
 * Acepta parámetros para filtrar por categoría o por una lista de slugs.
 * Acepta el parámetro 'all=true' para devolver todos los productos para la búsqueda.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const slugsParam = searchParams.get('slugs');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const fetchAll = searchParams.get('all') === 'true';

    if (fetchAll) {
      // Returns published products for search — capped to prevent OOM on large catalogs.
      const CAP = 2000;
      const adminProductData = await productService.getAdminProductList();
      const activeAndPublished = adminProductData.products
        .filter(p => !p.isDeleted && p.status === 'PUBLISHED')
        .slice(0, CAP);
      return successResponse({
        products: activeAndPublished,
        total: activeAndPublished.length,
        categories: adminProductData.categories,
      });
    }

    let productsPromise;
    let totalPromise;

    if (slugsParam) {
      const slugs = slugsParam.split(',');
      const products = await productService.getProductsByIds(slugs.map(s => parseInt(s, 10)).filter(id => !isNaN(id)));
      return successResponse({ products, categories: [], total: products.length });
    } else if (categorySlug) {
        const { products, total } = await productService.getPublishedProductsByCategory(categorySlug, page, limit);
        productsPromise = Promise.resolve(products);
        totalPromise = Promise.resolve(total);
    } else {
        const { products, total } = await productService.getPublishedProducts(page, limit);
        productsPromise = Promise.resolve(products);
        totalPromise = Promise.resolve(total);
    }

    const [products, total, categories] = await Promise.all([
      productsPromise,
      totalPromise,
      categoryService.getAllCategories(),
    ]);

    const responseData = {
      products,
      total,
      categories,
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('[API_PRODUCTS_GET_ERROR]', error);
    return errorHandler(error);
  }
}
