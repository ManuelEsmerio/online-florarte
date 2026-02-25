import { prisma } from "@/lib/prisma";
import { saveProfilePicture } from "@/services/file.service";

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
        throw new Error("Usuario no encontrado");
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
          throw new Error("Este correo ya está en uso");
        }
      }

      /* =========================
         3. Guardar foto
      ========================== */
      let profilePicUrl: string | undefined;

      if (
        data.profilePic &&
        typeof data.profilePic === "string" &&
        data.profilePic.startsWith("data:image")
      ) {
        profilePicUrl = await saveProfilePicture(
          userId,
          data.profilePic
        );
      }

      /* =========================
         4. Update usuario
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
         5. Direcciones
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
         6. Retornar completo
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
  }

};
