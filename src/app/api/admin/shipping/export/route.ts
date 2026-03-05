import { NextRequest, NextResponse } from 'next/server';
import { errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { shippingZoneService } from '@/services/shippingZoneService';

/** Escapa un valor para CSV: envuelve en comillas y escapa comillas internas. */
function csvCell(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(',')),
  ];
  return `\uFEFF${lines.join('\n')}`;
}

export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const zones = await shippingZoneService.getAllShippingZones();
    if (!zones.length) {
      return errorHandler(new Error('No existen zonas de envío para exportar.'), 404);
    }

    const rows = zones.map((zone) => ({
      postalCode: zone.postalCode,
      locality: zone.locality,
      shippingCost: zone.shippingCost,
      isActive: zone.isActive,
      settlementType: zone.settlementType ?? '',
      municipality: zone.municipality ?? '',
      state: zone.state ?? '',
      stateCode: zone.stateCode ?? '',
      municipalityCode: zone.municipalityCode ?? '',
      postalOfficeCode: zone.postalOfficeCode ?? '',
      zone: zone.zone ?? '',
    }));

    const csvContent = buildCSV(rows);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shipping_zones_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[API_ADMIN_SHIPPING_EXPORT_ERROR]', error);
    return errorHandler(error);
  }
}
