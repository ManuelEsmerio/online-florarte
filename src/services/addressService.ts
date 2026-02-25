import { prisma } from "@/lib/prisma";
import { AddressType } from "@prisma/client";

interface AddressData {
  id?: number;
  userId?: number;
  alias: string;
  recipientName: string;
  recipientPhone?: string;
  streetName: string;
  streetNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  country?: string;
  postalCode: string;
  addressType?: AddressType;
  referenceNotes?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
}

export const addressService = {

  async addOrUpdateAddress(userId: number, data: AddressData) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDeleted: false },
        data: { isDefault: false },
      });
    }

    if (data.id) {
      // Update
      const existingAddress = await prisma.address.findFirst({
        where: { id: data.id, userId, isDeleted: false },
      });

      if (!existingAddress) {
        throw new Error("Address not found or access denied");
      }

      const updatedAddress = await prisma.address.update({
        where: { id: data.id },
        data: {
          alias: data.alias,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          streetName: data.streetName,
          streetNumber: data.streetNumber,
          interiorNumber: data.interiorNumber,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          country: data.country || "México",
          postalCode: data.postalCode,
          addressType: data.addressType || "HOME",
          referenceNotes: data.referenceNotes,
          isDefault: data.isDefault || false,
          latitude: data.latitude,
          longitude: data.longitude,
          googlePlaceId: data.googlePlaceId,
        },
      });
      return updatedAddress;

    } else {
      // Create
      const newAddress = await prisma.address.create({
        data: {
          userId,
          alias: data.alias,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          streetName: data.streetName,
          streetNumber: data.streetNumber,
          interiorNumber: data.interiorNumber,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          country: data.country || "México",
          postalCode: data.postalCode,
          addressType: data.addressType || "HOME",
          referenceNotes: data.referenceNotes,
          isDefault: data.isDefault || false,
          latitude: data.latitude,
          longitude: data.longitude,
          googlePlaceId: data.googlePlaceId,
        },
      });
      return newAddress;
    }
  },

  async deleteAddress(userId: number, addressId: number) {
    const existingAddress = await prisma.address.findFirst({
        where: { id: addressId, userId, isDeleted: false },
      });

      if (!existingAddress) {
        throw new Error("Address not found or access denied");
      }

    return prisma.address.update({
      where: { id: addressId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isDefault: false, // Ensure deleted not default
      },
    });
  },
  
  async getAddressById(userId: number, addressId: number) {
      return prisma.address.findFirst({
          where: {
              id: addressId,
              userId: userId,
              isDeleted: false
          }
      })
  },

  async getUserAddresses(userId: number) {
      return prisma.address.findMany({
          where: {
              userId: userId,
              isDeleted: false
          },
          orderBy: {
              isDefault: 'desc'
          }
      })
  }
};
