// src/repositories/addressRepository.ts
import { allUsers } from '@/lib/data/user-data';
import type { Address } from '@/lib/definitions';
import type { PoolConnection } from '@/lib/db';

// Helper to generate IDs
const generateId = () => {
    let maxId = 0;
    allUsers.forEach(u => {
        if (u.addresses) {
            u.addresses.forEach(a => {
                if (a.id > maxId) maxId = a.id;
            });
        }
    });
    return maxId + 1;
};

export const addressRepository = {
  /**
   * Crea o actualiza una dirección.
   */
  async upsert(connection: PoolConnection, address: Partial<Address> & { user_id: number }): Promise<number> {
    const user = allUsers.find(u => u.id === address.user_id);
    if (!user) throw new Error('User not found');

    if (!user.addresses) {
        user.addresses = [];
    }

    if (address.id && address.id > 0) {
        const index = user.addresses.findIndex(a => a.id === address.id);
        if (index !== -1) {
            user.addresses[index] = { ...user.addresses[index], ...address } as Address;
            return Promise.resolve(address.id);
        }
    }

    // Create
    const newId = generateId();
    const newAddress = {
        ...address,
        id: newId,
        user_id: address.user_id,
        // Fill defaults if missing
        recipientName: address.recipientName || '',
        phone: address.phone || '',
        streetName: address.streetName || '',
        streetNumber: address.streetNumber || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        addressType: address.addressType || 'casa',
    } as Address;

    user.addresses.push(newAddress);
    return Promise.resolve(newId);
  },

  /**
   * Realiza un borrado lógico de una dirección.
   */
  async softDelete(connection: PoolConnection, addressId: number): Promise<boolean> {
    for (const user of allUsers) {
        if (user.addresses) {
            const index = user.addresses.findIndex(a => a.id === addressId);
            if (index !== -1) {
                // In a real soft delete we mark it. 
                // Since our User type's Address array might not have is_deleted, we can either splice it or add the flag if supported.
                // Looking at definitions, Address usually doesn't have is_deleted on the frontend type, but DB has it.
                // I'll just remove it from the array for "mock" deletion to keep it simple, 
                // OR check if I can add the property.
                // user.addresses.splice(index, 1);
                // Better:
                const addr = user.addresses[index] as any;
                addr.is_deleted = true;
                addr.deleted_at = new Date().toISOString();
                return Promise.resolve(true);
            }
        }
    }
    return Promise.resolve(false);
  }
};
