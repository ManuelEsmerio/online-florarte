
// src/services/userService.ts
import { userRepository } from '../repositories/userRepository';
import { addressRepository } from '../repositories/addressRepository';
import { loyaltyRepository } from '../repositories/loyaltyRepository';
import { mapDbUserToUser, mapDbAddressToAddress } from '../mappers/userMapper';
import type { User, CreateUserDTO, UpdateUserDTO, Address } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';
import { saveProfilePicture } from './file.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio de Usuario (Modo Demo)
 * Gestiona todas las operaciones relacionadas con usuarios utilizando el repositorio local.
 */
export const userService = {

  async getAllUsersForAdmin(filters: { status: 'active' | 'deleted' | 'all', searchTerm: string, roles: string[], from?: string, to?: string }): Promise<User[]> {
    const dbUsers = await userRepository.findAllForAdmin(filters);
    return dbUsers.map(mapDbUserToUser);
  },

  async loginUser(credentials: { email: string }): Promise<User> {
    const dbUser = await userRepository.findByEmail(credentials.email);

    if (!dbUser || dbUser.is_deleted) {
      throw new Error('Usuario no encontrado o inactivo.');
    }

    const user = await this.getUserById(dbUser.id);
    if (!user) throw new Error('No se pudieron obtener los detalles del usuario.');

    return user;
  },

  async registerUser(data: { email: string, name: string, password?: string }): Promise<User> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error(`El correo ${data.email} ya está registrado.`);
    }

    const userToCreate: any = {
      uid: uuidv4(),
      email: data.email,
      name: data.name,
      password: data.password || 'password123',
      role: 'customer',
      profilePic: null,
      loyalty_points: 0,
      is_deleted: false,
    };

    const newUserId = await userRepository.create(userToCreate);
    const newUser = await userRepository.findById(newUserId);
    if (!newUser) throw new Error('Error al crear el usuario.');

    return mapDbUserToUser(newUser);
  },

  async createUserByAdmin(data: CreateUserDTO, creatorId: number): Promise<User> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error(`El correo ${data.email} ya está en uso.`);
    }

    const userToCreate: any = {
      uid: data.uid || uuidv4(),
      email: data.email,
      name: data.name,
      role: data.role || 'customer',
      password: data.password || 'password123',
      phone: data.phone || null,
      profilePic: data.profilePic || null,
      loyalty_points: 0,
      is_deleted: false,
    };

    const newUserId = await userRepository.create(userToCreate);
    const newUser = await userRepository.findById(newUserId);
    if (!newUser) throw new Error('Error al crear el usuario.');

    return mapDbUserToUser(newUser);
  },

  async updateUserByAdmin(userId: number, data: UpdateUserDTO, editorId: number): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("Usuario no encontrado.");

    if (data.email && data.email !== user.email) {
        const existing = await userRepository.findByEmail(data.email);
        if (existing && existing.id !== userId) {
            throw new Error("El correo electrónico ya está en uso por otra cuenta.");
        }
    }

    const updatePayload: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role
    };

    if (data.password) {
        updatePayload.password = data.password;
    }

    await userRepository.update(userId, updatePayload);
    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) throw new Error("No se pudo obtener el usuario actualizado.");

    return updatedUser;
  },

  async getUserById(id: number): Promise<User | null> {
    const dbUser = await userRepository.findById(id);
    if (!dbUser) return null;

    const dbAddresses = await userRepository.findAddressesByUserId(id);
    const addresses = dbAddresses.map(mapDbAddressToAddress);
    const user = mapDbUserToUser(dbUser);
    user.addresses = addresses;

    if (user.profilePic) {
      user.profilePic = getPublicUrlForPath(user.profilePic);
    }

    return user;
  },

  async updateUser(userId: number, data: UpdateUserDTO): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("Usuario no encontrado.");

    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing && existing.id !== userId) {
        throw new Error("El correo electrónico ya está en uso.");
      }
    }

    let profileUrl: string | undefined = undefined;
    if (data.profilePic && data.profilePic.startsWith('data:image')) {
      // Mock de procesamiento de imagen
      profileUrl = `images/profiles/${userId}/avatar.webp`;
    }

    const dataToUpdate: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
    };

    if (profileUrl) {
      dataToUpdate.profilePic = profileUrl;
    }

    await userRepository.update(userId, dataToUpdate);
    
    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) throw new Error("No se pudo obtener el usuario actualizado.");

    return updatedUser;
  },

  async addOrUpdateAddress(userId: number, address: Partial<Address>): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    if (!user.addresses) user.addresses = [];

    if (address.id && address.id > 0) {
        user.addresses = user.addresses.map(a => a.id === address.id ? { ...a, ...address } : a);
    } else {
        const newAddress = { ...address, id: Date.now(), user_id: userId } as Address;
        user.addresses.push(newAddress);
    }

    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) throw new Error('No se pudo obtener el usuario actualizado.');

    return updatedUser;
  },

  async deleteAddress(userId: number, addressId: number): Promise<User> {
    const user = await userRepository.findById(userId);
    if (user && user.addresses) {
        user.addresses = user.addresses.filter(a => a.id !== addressId);
    }

    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) throw new Error('No se pudo obtener el usuario actualizado.');

    return updatedUser;
  },

  async deleteUser(userId: number, deleterId?: number): Promise<void> {
    const success = await userRepository.softDelete(userId);
    if (!success) throw new Error("No se pudo eliminar el usuario.");
  },

  async bulkDeleteUsers(userIds: number[], deleterId: number): Promise<{ deletedCount: number, errors: string[] }> {
    let deletedCount = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        await this.deleteUser(userId, deleterId);
        deletedCount++;
      } catch (error) {
        errors.push(`Usuario ID ${userId}: Error`);
      }
    }
    return { deletedCount, errors };
  },

  async redeemLoyaltyPoints(userId: number, quantity: number): Promise<{ coupons_created: number, new_coupon_ids: number[] }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("Usuario no encontrado.");

    const pointsNeeded = quantity * 3000;
    if (user.loyalty_points < pointsNeeded) {
      throw new Error("Puntos insuficientes.");
    }
    
    user.loyalty_points -= pointsNeeded;
    
    return {
        coupons_created: quantity,
        new_coupon_ids: [Date.now()]
    };
  },
};
