import { prisma } from "@/lib/prisma";
import { UserFacingError } from '@/utils/errors';
import { saveProfilePicture } from "@/services/file.service";
import bcrypt from "bcryptjs";
import { assertPasswordStrength } from "@/utils/passwordPolicy";

export const userService = {

  async getUserById(userId: number) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        isDeleted: false,
      },
      include: {
        addresses: {
          where: { isDeleted: false },
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!user) return null;

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateUser(userId: number, data: any) {
    let profilePicUrl: string | undefined;

    const shouldUploadProfilePic =
      typeof data.profilePic === "string" &&
      data.profilePic.startsWith("data:image");

    if (shouldUploadProfilePic) {
      profilePicUrl = await saveProfilePicture(userId, data.profilePic);
    }

    return prisma.$transaction(async (tx) => {

      /* =========================
         1. Validar usuario
      ========================== */
      const user = await tx.user.findFirst({
        where: {
          id: userId,
          isDeleted: false,
        },
      });

      if (!user) {
        throw new UserFacingError("Usuario no encontrado");
      }

      /* =========================
         2. Validar email
      ========================== */
      if (data.email) {
        const used = await tx.user.findFirst({
          where: {
            email: data.email,
            id: { not: userId },
            isDeleted: false,
          },
        });

        if (used) {
          throw new UserFacingError("Este correo ya está en uso");
        }
      }

      /* =========================
         3. Update usuario
      ========================== */
      const userUpdateData: any = {
        name: data.name,
        phone: data.phone,
        birthdate: data.birthdate
          ? new Date(data.birthdate)
          : undefined,
        acceptsMarketing: data.acceptsMarketing,
      };

      if (profilePicUrl) {
        userUpdateData.profilePicUrl = profilePicUrl;
      }

      if (data.email) {
        userUpdateData.email = data.email;
      }

      await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
      });

      /* =========================
        4. Direcciones
      ========================== */
      if (Array.isArray(data.addresses)) {

        for (const address of data.addresses) {

          /* Si es default → limpiar anteriores */
          if (address.isDefault === true) {
            await tx.address.updateMany({
              where: {
                userId,
                isDeleted: false,
              },
              data: {
                isDefault: false,
              },
            });
          }

          /* UPDATE */
          if (address.id) {

            await tx.address.updateMany({
              where: {
                id: address.id,
                userId,
                isDeleted: false,
              },
              data: {
                alias: address.alias,
                recipientName: address.recipientName,
                recipientPhone: address.recipientPhone,
                streetName: address.streetName,
                streetNumber: address.streetNumber,
                interiorNumber: address.interiorNumber,
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                country: address.country,
                postalCode: address.postalCode,
                addressType: address.addressType,
                referenceNotes: address.referenceNotes,
                isDefault: address.isDefault,
                latitude: address.latitude,
                longitude: address.longitude,
                googlePlaceId: address.googlePlaceId,
              },
            });

          } 
          /* CREATE */
          else {

            await tx.address.create({
              data: {
                userId,
                alias: address.alias,
                recipientName: address.recipientName,
                recipientPhone: address.recipientPhone,
                streetName: address.streetName,
                streetNumber: address.streetNumber,
                interiorNumber: address.interiorNumber,
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                country: address.country || "México",
                postalCode: address.postalCode,
                addressType: address.addressType || "HOME",
                referenceNotes: address.referenceNotes,
                isDefault: address.isDefault || false,
                latitude: address.latitude,
                longitude: address.longitude,
                googlePlaceId: address.googlePlaceId,
              },
            });

          }
        }
      }

      /* =========================
        5. Retornar completo
      ========================== */
      return tx.user.findFirst({
        where: {
          id: userId,
          isDeleted: false,
        },
        include: {
          addresses: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              isDefault: "desc",
            },
          },
        },
      });

    });

  },

  async deleteAddress(userId: number, addressId: number) {

    return prisma.address.updateMany({
      where: {
        id: addressId,
        userId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isDefault: false,
      },
    });

  },

  async deleteUser(userId: number) {
    const timestamp = new Date().getTime();
    return prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        email: `deleted_${timestamp}_${userId}@example.com`,
        firebaseUid: `deleted_${timestamp}_${userId}`,
      },
    });
  },

  async getAllUsersForAdmin({ status, searchTerm, roles }: { status: 'active' | 'deleted' | 'all'; searchTerm: string; roles: string[] }) {
    const where: any = {};

    if (status === 'active') where.isDeleted = false;
    else if (status === 'deleted') where.isDeleted = true;

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm } },
        { email: { contains: searchTerm } },
      ];
    }

    if (roles.length > 0) {
      where.role = { in: roles.map(r => r.toUpperCase()) };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return users.map(({ passwordHash, ...u }) => u);
  },

  async createUserByAdmin(data: any, adminId: number) {
    const existing = await prisma.user.findFirst({ where: { email: data.email.toLowerCase(), isDeleted: false } });
    if (existing) throw new UserFacingError('El correo electrónico ya está en uso.');

    const rawPassword = data.password || 'Florarte2024!';
    if (data.password) {
      assertPasswordStrength(data.password);
    }

    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        role: (data.role || 'CUSTOMER').toUpperCase() as any,
        passwordHash,
        firebaseUid: data.uid || `user_${Date.now()}`,
        loyaltyPoints: 0,
        acceptsMarketing: false,
      },
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return userSafe;
  },

  async updateUserByAdmin(userId: number, data: any, adminId: number) {
    if (data.email) {
      const existing = await prisma.user.findFirst({ where: { email: data.email.toLowerCase(), isDeleted: false, id: { not: userId } } });
      if (existing) throw new UserFacingError('El correo electrónico ya está en uso por otra cuenta.');
    }

    const updateData: any = {
      name: data.name,
      phone: data.phone || null,
      role: (data.role || 'CUSTOMER').toUpperCase() as any,
    };

    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.password) {
      assertPasswordStrength(data.password);
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
    const { passwordHash: _, ...userSafe } = updated;
    return userSafe;
  },

  async bulkDeleteUsers(userIds: number[], adminId: number) {
    const errors: { id: number; error: string }[] = [];
    let deletedCount = 0;

    for (const id of userIds) {
      try {
        const timestamp = Date.now();
        await prisma.user.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            email: `deleted_${timestamp}_${id}@example.com`,
            firebaseUid: `deleted_${timestamp}_${id}`,
          },
        });
        deletedCount++;
      } catch (err: any) {
        errors.push({ id, error: err.message });
      }
    }

    return { deletedCount, errors };
  },

  async redeemLoyaltyPoints(userId: number, quantity: number): Promise<{ coupons_created: number; new_coupon_ids: number[] }> {
    // TODO: Implement loyalty points redemption logic
    throw new UserFacingError('La función de canje de puntos no está disponible aún.');
  },

};
