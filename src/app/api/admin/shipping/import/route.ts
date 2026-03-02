import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { shippingZoneService } from '@/services/shippingZoneService';
import * as XLSX from 'xlsx';
import { z, ZodError } from 'zod';

const normalizeBool = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'sí' || normalized === 'si';
  }
  return undefined;
};

const normalizeNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    let cleaned = value.trim().replace(/[\$\s]/g, '');
    if (!cleaned.length) return undefined;

    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && !hasDot) {
      // Format like 1.234,56 -> drop thousands (.) and use , as decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formats like 1,234.56 or 1234.56 -> drop commas only
      cleaned = cleaned.replace(/,/g, '');
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return value;
};

const normalizeString = (max: number) =>
  z
    .preprocess((value) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      }
      return value ?? undefined;
    }, z.string().max(max))
    .optional()
    .nullable();

const excelRowSchema = z.object({
  postalCode: z.string().min(3).max(10),
  locality: z.string().min(2).max(150),
  shippingCost: z.preprocess(normalizeNumber, z.number().nonnegative()),
  isActive: z.preprocess(normalizeBool, z.boolean()).optional().default(true),
  settlementType: normalizeString(100),
  municipality: normalizeString(150),
  state: normalizeString(100),
  stateCode: normalizeString(5),
  municipalityCode: normalizeString(5),
  postalOfficeCode: normalizeString(10),
  zone: normalizeString(50),
});

export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return errorHandler(new Error('Debes adjuntar un archivo CSV (.csv).'), 400);
    }

    const filename = file.name?.toLowerCase() ?? '';
    if (!filename.endsWith('.csv')) {
      return errorHandler(new Error('Solo se permiten archivos CSV.'), 400);
    }

    const csvContent = await file.text();
    const workbook = XLSX.read(csvContent, { type: 'string', raw: true });
    const [firstSheetName] = workbook.SheetNames;
    if (!firstSheetName) {
      return errorHandler(new Error('El archivo no contiene hojas.'), 400);
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rows.length) {
      return errorHandler(new Error('El archivo no contiene datos.'), 400);
    }

    const parsedZones: any[] = [];
    const errors: { row: number; message: string }[] = [];

    rows.forEach((row, index) => {
      try {
        parsedZones.push(excelRowSchema.parse(row));
      } catch (error) {
        const zodError = error as ZodError;
        errors.push({
          row: index + 2,
          message: zodError.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
        });
      }
    });

    if (errors.length) {
      return errorHandler(new Error(`Se encontraron errores al validar el archivo: ${errors.map((e) => `Fila ${e.row} -> ${e.message}`).join(' | ')}`), 400);
    }

    const result = await shippingZoneService.replaceAllShippingZones(parsedZones, session.dbId);

    return successResponse({
      inserted: result.inserted,
      message: `Se reemplazaron ${result.inserted} zonas de envío correctamente.`,
    });
  } catch (error) {
    console.error('[API_ADMIN_SHIPPING_IMPORT_ERROR]', error);
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    return errorHandler(error);
  }
}
