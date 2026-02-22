import { NextRequest } from 'next/server';
import { errorHandler, successResponse } from '@/utils/api-utils';
import { shippingZoneService } from '@/services/shippingZoneService';

/**
 * GET /api/shipping
 * Obtiene la lista de zonas de envío. Este endpoint es público.
 */
export async function GET(req: NextRequest) {
  try {
    const shippingData = await shippingZoneService.getAllShippingZones();
    return successResponse(shippingData);
  } catch (error) {
    console.error('[API_SHIPPING_GET_ERROR]', error);
    return errorHandler(error);
  }
}
