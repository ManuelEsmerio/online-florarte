// src/app/api/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { couponService } from '@/services/couponService';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';
import { occasionService } from '@/services/occasionService';
import { shippingZoneService } from '@/services/shippingZoneService';

type DataFetcher = (from?: string, to?: string) => Promise<any[]>;

// Mapea el tipo de dato a la función que obtiene los datos
const dataFetchers: Record<string, DataFetcher> = {
  products: async () => (await productService.getAdminProductList()).products,
  orders: async (from, to) => orderService.getAllOrdersForAdmin({ search: '', status: [], from, to }),
  users: async (from, to) => userService.getAllUsersForAdmin({ status: 'all', searchTerm: '', roles: [], from, to }),
  coupons: async () => (await couponService.getAllCoupons({ search: '', status: [], page: 1, limit: 9999 })).coupons,
  categories: async () => categoryService.getAllCategories(),
  tags: async () => tagService.getAllTags(),
  occasions: async () => occasionService.getAllOccasions(),
  shipping_zones: async () => shippingZoneService.getAllShippingZones(),
};

/**
 * Convierte un array de objetos a una cadena de texto en formato CSV.
 */
function convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    // Añadir el BOM (Byte Order Mark) para que Excel reconozca UTF-8
    const csvRows = ['\uFEFF' + headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) {
                return '';
            }
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * GET /api/admin/export
 * Endpoint para exportar datos en formato CSV.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const { searchParams } = new URL(req.url);
    const dataType = searchParams.get('dataType');
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    if (!dataType || !dataFetchers[dataType]) {
      return errorHandler(new Error('Tipo de dato no válido.'), 400);
    }
    
    const data = await dataFetchers[dataType](from, to);
    
    if (data.length === 0) {
        return errorHandler(new Error('No hay datos para exportar con los filtros seleccionados.'), 404);
    }
    
    const csv = convertToCSV(data);

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="export_${dataType}_${new Date().toISOString()}.csv"`,
        },
    });

  } catch (error) {
    console.error('[API_ADMIN_EXPORT_ERROR]', error);
    return errorHandler(error);
  }
}
