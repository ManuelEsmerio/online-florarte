
// src/repositories/userRepository.ts
import { allUsers } from '@/lib/data/user-data';
import type { DbUser, User } from '@/lib/definitions';

export const userRepository = {
  async findAllForAdmin(filters: { status: 'active' | 'deleted' | 'all', searchTerm: string, roles: string[] }) {
    return allUsers.filter(u => {
        // Filtro de estado
        if (filters.status === 'active' && u.is_deleted) return false;
        if (filters.status === 'deleted' && !u.is_deleted) return false;
        
        // Filtro de búsqueda (nombre o email)
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            const matchesName = u.name.toLowerCase().includes(term);
            const matchesEmail = u.email.toLowerCase().includes(term);
            if (!matchesName && !matchesEmail) return false;
        }
        
        // Filtro de roles
        if (filters.roles.length > 0 && !filters.roles.includes(u.role)) {
            return false;
        }

        return true;
    }) as any[];
  },

  async findByFirebaseUid(uid: string) {
    return allUsers.find(u => u.uid === uid && !u.is_deleted) || null;
  },

  async findByEmail(email: string) {
    return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && !u.is_deleted) || null;
  },
  
  async findById(id: number) {
    return allUsers.find(u => u.id === id && !u.is_deleted) || null;
  },

  async findAddressesByUserId(userId: number) {
    const user = allUsers.find(u => u.id === userId);
    return user?.addresses || [];
  },

  async create(data: any) {
    const newId = Math.max(...allUsers.map(u => u.id), 0) + 1;
    const newUser = { 
        ...data, 
        id: newId, 
        dbId: newId,
        is_deleted: false,
        loyalty_points: data.loyalty_points || 0,
        addresses: data.addresses || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    allUsers.push(newUser);
    return newId;
  },

  async update(id: number, data: any) {
    const index = allUsers.findIndex(u => u.id === id);
    if (index > -1) {
        allUsers[index] = { 
            ...allUsers[index], 
            ...data, 
            updated_at: new Date().toISOString() 
        };
        return true;
    }
    return false;
  },
  
  async softDelete(id: number) {
    const index = allUsers.findIndex(u => u.id === id);
    if (index > -1) {
        allUsers[index].is_deleted = true;
        allUsers[index].updated_at = new Date().toISOString();
        return true;
    }
    return false;
  },
};
