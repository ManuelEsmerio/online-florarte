// src/app/api/admin/import/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { z, ZodError } from 'zod';
import { Readable } from 'stream';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { occasionService } from '@/services/occasionService';
import { tagService } from '@/services/tagService';
import { shippingZoneService } from '@/services/shippingZoneService';
import { peakDateService } from '@/services/peakDateService';
import { couponService } from '@/services/couponService';

// --- Esquemas de Validación para cada tipo de dato ---
const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.coerce.number(),
  stock: z.coerce.number().int(),
  category_slug: z.string(), // Usamos slug para encontrar la categoría
});

const categorySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  parent_slug: z.string().optional(),
  show_on_home: z.preprocess((val) => String(val).toLowerCase() === 'true' || val === '1', z.boolean()),
});

const occasionSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  show_on_home: z.preprocess((val) => String(val).toLowerCase() === 'true' || val === '1', z.boolean()),
});

const tagSchema = z.object({
  name: z.string().min(3),
});

const shippingZoneSchema = z.object({
    postalCode: z.string().length(5),
    locality: z.string().min(3),
    shippingCost: z.coerce.number().int()
});

const peakDateSchema = z.object({
    name: z.string().min(3),
    peak_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    is_coupon_restricted: z.preprocess((val) => String(val).toLowerCase() === 'true' || val === '1', z.boolean())
});

const couponSchema = z.object({
    code: z.string().min(3),
    description: z.string().min(5),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.coerce.number(),
    scope: z.enum(['global', 'users', 'categories', 'products']),
    max_uses: z.coerce.number().int().optional().nullable(),
    valid_until: z.string().optional().nullable(),
});

const importSchemas = {
  products: productSchema,
  categories: categorySchema,
  occasions: occasionSchema,
  tags: tagSchema,
  shipping_zones: shippingZoneSchema,
  peak_dates: peakDateSchema,
  coupons: couponSchema,
  customers: z.object({ email: z.string().email(), name: z.string().min(3) }),
};

// --- Función Principal del Endpoint ---
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const formData = await req.formData();
    const dataType = formData.get('dataType') as keyof typeof importSchemas;
    const file = formData.get('file') as File | null;

    if (!dataType || !importSchemas[dataType]) {
      return errorHandler(new Error('Tipo de dato a importar no válido.'), 400);
    }
    if (!file) return errorHandler(new Error('No se subió ningún archivo.'), 400);

    const text = await file.text();
    const rows = parseCsv(text);
    const headers = rows.shift();
    
    if(!headers || rows.length === 0) return errorHandler(new Error('El archivo CSV está vacío o no tiene cabeceras.'), 400);
    
    let processed = 0;
    let inserted = 0;
    let skipped = 0;
    const errors: { row: number; message: string }[] = [];

    // --- Procesamiento de Filas ---
    for (const [index, row] of rows.entries()) {
      const rowData: Record<string, any> = headers.reduce((obj, header, i) => {
        obj[header] = row[i];
        return obj;
      }, {} as Record<string, any>);

      try {
        // Validación con Zod
        const validatedData = importSchemas[dataType].parse(rowData);
        
        // --- Lógica de creación por tipo ---
        // Se podría refactorizar en un mapa de funciones, pero por claridad lo dejamos explícito
        if (dataType === 'categories') {
            await categoryService.createCategory(validatedData, null, session.dbId);
        } else if (dataType === 'occasions') {
            await occasionService.createOccasion(validatedData, null, session.dbId);
        } else if (dataType === 'tags') {
            await tagService.createTag(validatedData, session.dbId);
        } else if (dataType === 'shipping_zones') {
            await shippingZoneService.createShippingZone({
                postal_code: validatedData.postalCode,
                locality: validatedData.locality,
                shipping_cost: validatedData.shippingCost
            }, session.dbId);
        } else if(dataType === 'peak_dates') {
            await peakDateService.createPeakDate(validatedData, session.dbId);
        } else if (dataType === 'coupons') {
            const couponData = {
                ...validatedData,
                validity: { from: new Date(), to: validatedData.valid_until ? new Date(validatedData.valid_until) : null },
                noExpiry: !validatedData.valid_until,
            }
            await couponService.createCoupon(couponData, session.dbId);
        } else if (dataType === 'customers') {
            await userService.createUserByAdmin({
                ...validatedData,
                firebase_uid: `csv_import_${Date.now()}`,
                role: 'customer',
            }, session.dbId);
        }
        // ... añadir más casos para otros tipos de datos
        
        inserted++;
      } catch (error: any) {
        if (error.message.includes('ya existe')) {
          skipped++;
        } else if (error instanceof ZodError) {
          errors.push({ row: index + 2, message: formatZodError(error) });
        } else {
          errors.push({ row: index + 2, message: error.message });
        }
      } finally {
        processed++;
      }
    }
    
    return successResponse({
      processed,
      inserted,
      skipped,
      errors,
    });

  } catch (error) {
    console.error('[API_ADMIN_IMPORT_ERROR]', error);
    return errorHandler(error);
  }
}

// --- Funciones de Ayuda ---
function parseCsv(text: string): string[][] {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    return lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });
}

function formatZodError(error: ZodError): string {
    return error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}
