// src/app/api/peak-dates/is-peak/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { peakDateService } from '@/services/peakDateService';

/**
 * GET /api/peak-dates/is-peak
 * Verifica si una fecha dada es una fecha pico.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return errorHandler(new Error('El parámetro de fecha es requerido.'), 400);
    }

    const isPeak = await peakDateService.isPeakDay(date);
    return successResponse({ isPeak });

  } catch (error) {
    console.error('[API_IS_PEAK_DATE_ERROR]', error);
    return errorHandler(error);
  }
}
