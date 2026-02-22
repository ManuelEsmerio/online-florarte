// src/lib/data/peak-date-data.ts
import type { PeakDate } from '@/lib/definitions';

export let peakDatesData: PeakDate[] = [
    {
        id: 1,
        name: "Día de San Valentín",
        peak_date: new Date("2025-02-14T06:00:00.000Z"),
        is_coupon_restricted: true
    },
    {
        id: 2,
        name: "Día de las Madres",
        peak_date: new Date("2025-05-10T06:00:00.000Z"),
        is_coupon_restricted: true
    },
    {
        id: 3,
        name: "Navidad",
        peak_date: new Date("2024-12-24T06:00:00.000Z"),
        is_coupon_restricted: false
    }
];
