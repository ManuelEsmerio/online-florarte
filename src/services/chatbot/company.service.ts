// src/services/chatbot/company.service.ts
// Reads company metadata from the company_meta DB table.
// Falls back to env vars if the key is not in the DB.

import { prisma } from '@/lib/prisma';

const ENV_FALLBACKS: Record<string, string | undefined> = {
  name:      'Florarte',
  address:   process.env.COMPANY_ADDRESS,
  phone:     process.env.COMPANY_PHONE,
  hours:     process.env.COMPANY_HOURS,
  latitude:  process.env.COMPANY_LATITUDE,
  longitude: process.env.COMPANY_LONGITUDE,
  site_url:  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://online-florarte.vercel.app',
};

// In-memory cache (TTL: 5 minutes) to avoid a DB hit on every message
let cache: Record<string, string> | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export const companyService = {
  /** Returns all company meta as a key→value record. */
  async getAll(): Promise<Record<string, string>> {
    const now = Date.now();
    if (cache && now < cacheExpiresAt) return cache;

    const rows = await prisma.companyMeta.findMany();
    const fromDb: Record<string, string> = {};
    for (const row of rows) fromDb[row.key] = row.value;

    // Merge: DB values override env fallbacks
    cache = { ...ENV_FALLBACKS as Record<string, string>, ...fromDb };
    cacheExpiresAt = now + CACHE_TTL_MS;
    return cache;
  },

  /** Returns the value for a specific key, or undefined. */
  async get(key: string): Promise<string | undefined> {
    const all = await this.getAll();
    return all[key];
  },

  /** Upserts a key–value pair and busts the cache (used by admin API). */
  async upsert(key: string, value: string): Promise<void> {
    await prisma.companyMeta.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    cache = null; // bust cache
  },

  /** Deletes a key and busts the cache. */
  async delete(key: string): Promise<void> {
    await prisma.companyMeta.delete({ where: { key } }).catch(() => {});
    cache = null;
  },
};
