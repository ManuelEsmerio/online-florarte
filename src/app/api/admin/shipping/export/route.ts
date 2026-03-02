import { NextRequest, NextResponse } from 'next/server';
import { errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { shippingZoneService } from '@/services/shippingZoneService';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const zones = await shippingZoneService.getAllShippingZones();
    if (!zones.length) {
      return errorHandler(new Error('No existen zonas de envío para exportar.'), 404);
    }

    const worksheetData = zones.map((zone) => ({
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

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const csvContent = `\uFEFF${XLSX.utils.sheet_to_csv(worksheet)}`;

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
