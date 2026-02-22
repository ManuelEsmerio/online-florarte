
// src/mappers/userMapper.ts
import type { DbUser, User, Address } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';

/**
 * Mapea una fila de la tabla `users` (DbUser) a un objeto `User` limpio
 * para ser usado en el frontend de la aplicación.
 * Soporta tanto la estructura de DB real como la de user-data.ts (Modo Demo).
 */
export function mapDbUserToUser(row: any): User {
  return {
    id: row.id,
    uid: row.uid || row.firebase_uid,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    profilePic: getPublicUrlForPath(row.profilePic || row.profile_pic_url),
    loyalty_points: row.loyalty_points || 0,
    is_deleted: !!row.is_deleted,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    dbId: row.dbId || row.id
  };
}


export function mapDbAddressToAddress(row: any): Address {
  return {
    id: row.id,
    user_id: row.user_id,
    alias: row.address_name || row.alias,
    recipientName: row.recipient_name || row.recipientName,
    phone: row.recipient_phone || row.phone,
    streetName: row.street_name || row.streetName,
    streetNumber: row.street_number || row.streetNumber,
    interiorNumber: row.interior_number || row.interiorNumber,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code || row.postalCode,
    addressType: row.address_type || row.addressType,
    reference_notes: row.reference_notes,
  }
}
