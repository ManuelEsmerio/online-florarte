// src/services/chatbot/company.service.ts
// Reads company metadata from the company_meta DB table.
// Falls back to env vars if the key is not in the DB.

import type { CompanyBankAccount, CompanyProfile } from '@prisma/client';

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

type ProfileWithAccounts = (CompanyProfile & { bankAccounts: CompanyBankAccount[] }) | null;

type CompanyCache = {
  record: Record<string, string>;
  profile: ProfileWithAccounts;
};

// In-memory cache (TTL: 5 minutes) to avoid a DB hit on every message
let cache: CompanyCache | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const isoOrEmpty = (date?: Date | null) => (date ? date.toISOString() : '');

function appendProfileSnapshot(target: Record<string, string>, profile: CompanyProfile & { bankAccounts: CompanyBankAccount[] }) {
  target.legal_name = profile.legalName;
  target.trade_name = profile.tradeName ?? '';
  target.rfc = profile.rfc;
  target.tax_regime = profile.taxRegime ?? '';
  target.fiscal_street = profile.fiscalStreet ?? '';
  target.fiscal_number = profile.fiscalNumber ?? '';
  target.fiscal_neighborhood = profile.fiscalNeighborhood ?? '';
  target.fiscal_city = profile.fiscalCity ?? '';
  target.fiscal_state = profile.fiscalState ?? '';
  target.fiscal_postal_code = profile.fiscalPostalCode ?? '';
  target.support_email = profile.supportEmail ?? '';
  target.billing_email = profile.billingEmail ?? '';
  target.support_phone = profile.supportPhone ?? '';
  target.website_url = profile.websiteUrl ?? '';
  target.csd_cert_path = profile.csdCertPath ?? '';
  target.csd_key_path = profile.csdKeyPath ?? '';
  target.csd_password = profile.csdPassword ?? '';
  target.csd_series = profile.csdSeries ?? '';
  target.csd_valid_from = isoOrEmpty(profile.csdValidFrom);
  target.csd_valid_to = isoOrEmpty(profile.csdValidTo);
  target.company_notes = profile.notes ?? '';

  const primaryBank = profile.bankAccounts.find((account) => account.isDefault) ?? profile.bankAccounts[0];
  if (primaryBank) {
    target.bank_alias = primaryBank.alias ?? '';
    target.bank_name = primaryBank.bankName;
    target.bank_account = primaryBank.accountNumber ?? '';
    target.bank_clabe = primaryBank.clabe ?? '';
    target.bank_owner = primaryBank.beneficiary ?? profile.legalName ?? profile.tradeName ?? '';
    target.bank_reference_hint = primaryBank.referenceHint ?? '';
    target.bank_swift = primaryBank.swiftCode ?? '';
  }
}

async function hydrateCache(): Promise<CompanyCache> {
  const now = Date.now();
  if (cache && now < cacheExpiresAt) return cache;

  const [metaRows, profile] = await Promise.all([
    prisma.companyMeta.findMany(),
    prisma.companyProfile.findFirst({
      include: {
        bankAccounts: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    }),
  ]);

  const record: Record<string, string> = { ...ENV_FALLBACKS as Record<string, string> };
  for (const row of metaRows) record[row.key] = row.value;

  if (profile) appendProfileSnapshot(record, profile);

  cache = { record, profile };
  cacheExpiresAt = now + CACHE_TTL_MS;
  return cache;
}

function bustCache() {
  cache = null;
  cacheExpiresAt = 0;
}

export const companyService = {
  /** Returns all company meta as a key→value record. */
  async getAll(): Promise<Record<string, string>> {
    const snapshot = await hydrateCache();
    return snapshot.record;
  },

  /** Returns the value for a specific key, or undefined. */
  async get(key: string): Promise<string | undefined> {
    const all = await this.getAll();
    return all[key];
  },

  /** Returns the structured company profile (includes bank accounts). */
  async getProfile(): Promise<ProfileWithAccounts> {
    const snapshot = await hydrateCache();
    return snapshot.profile;
  },

  /** Convenience helper to access every configured bank account. */
  async getBankAccounts(): Promise<CompanyBankAccount[]> {
    const profile = await this.getProfile();
    return profile?.bankAccounts ?? [];
  },

  /** Returns the primary bank account (default flag or first one). */
  async getPrimaryBankAccount(): Promise<CompanyBankAccount | null> {
    const accounts = await this.getBankAccounts();
    return accounts[0] ?? null;
  },

  /** Upserts a key–value pair and busts the cache (used by admin API). */
  async upsert(key: string, value: string): Promise<void> {
    await prisma.companyMeta.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    bustCache();
  },

  /** Deletes a key and busts the cache. */
  async delete(key: string): Promise<void> {
    await prisma.companyMeta.delete({ where: { key } }).catch(() => {});
    bustCache();
  },
};
