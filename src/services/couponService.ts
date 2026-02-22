// src/services/couponService.ts
import { couponRepository } from '../repositories/couponRepository';
import { mapDbCouponToCoupon } from '../mappers/couponMapper';
import type { Coupon } from '@/lib/definitions';
// import { dbWithAudit } from '@/lib/db';
import { getCouponStatus } from '@/lib/business-logic/coupon-logic';
import { addMonths } from 'date-fns';

type GetAllParams = {
  search: string;
  status: string[];
  page: number;
  limit: number;
  withDetails?: boolean;
};

type ValidateCouponParams = {
  couponCode: string;
  userId: number | null;
  sessionId: string | null;
  deliveryDate: string | null;
}

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const couponService = {
  async getAllCoupons({ search, status, page, limit, withDetails = false }: GetAllParams) {
    const { coupons: dbCoupons, total } = await couponRepository.findAll({ search, status, page, limit });

    const coupons = await Promise.all(dbCoupons.map(async (dbCoupon) => {
        const coupon = mapDbCouponToCoupon(dbCoupon);
        if(withDetails) {
            coupon.details = {};
            if(coupon.scope === 'users') coupon.details.users = await couponRepository.findRelatedUsers(coupon.id);
            if(coupon.scope === 'products') coupon.details.products = await couponRepository.findRelatedProducts(coupon.id);
            if(coupon.scope === 'categories') coupon.details.categories = await couponRepository.findRelatedCategories(coupon.id);
        }
        return coupon;
    }));

    return { coupons, total };
  },

  async getCouponById(id: number): Promise<Coupon | null> {
    const dbCoupon = await couponRepository.findById(id);
    if (!dbCoupon) return null;

    const coupon = mapDbCouponToCoupon(dbCoupon);
    coupon.details = {};
    if(coupon.scope === 'users') coupon.details.users = await couponRepository.findRelatedUsers(id);
    if(coupon.scope === 'products') coupon.details.products = await couponRepository.findRelatedProducts(id);
    if(coupon.scope === 'categories') coupon.details.categories = await couponRepository.findRelatedCategories(id);

    return coupon;
  },
  
  async getCouponsByIds(ids: number[]): Promise<Coupon[]> {
    if (ids.length === 0) return [];
    const dbCoupons = await couponRepository.findCouponsByIds(ids);
    return dbCoupons.map(mapDbCouponToCoupon);
  },

  async getUserCoupons(userId: number): Promise<Coupon[]> {
    const dbCoupons = await couponRepository.findForUser(userId);
    return dbCoupons.map(mapDbCouponToCoupon);
  },

  async validateCoupon({ couponCode, userId, sessionId, deliveryDate }: ValidateCouponParams): Promise<Coupon> {
    const validationResult = await couponRepository.validateForCart({
      couponCode, userId, sessionId, deliveryDate
    });

    if (validationResult.o_applicable !== 1) {
      const reasonMessages: { [key: string]: string } = {
        'CUPON_NO_ENCONTRADO': 'El código de cupón no existe.',
        'FUERA_DE_VIGENCIA': 'Este cupón ha expirado o aún no está activo.',
        'SIN_EXISTENCIAS_USOS': 'Este cupón ha alcanzado su límite de usos.',
        'RESTRINGIDO_POR_DIA_PICO': 'Los cupones no son válidos para esta fecha de alta demanda.',
        'USUARIO_NO_ELEGIBLE': 'Este cupón no es válido para tu cuenta.',
        'CATEGORIA_NO_ELEGIBLE': 'Tu carrito no contiene productos de las categorías válidas para este cupón.',
        'PRODUCTO_NO_ELEGIBLE': 'Tu carrito no contiene los productos válidos para este cupón.',
        'CARRITO_VACIO': 'Tu carrito está vacío.',
        'FALTA_USER_O_SESSION': 'No se pudo identificar tu carrito.',
        'SCOPE_DESCONOCIDO': 'El cupón tiene una configuración no válida.',
        'DEFAULT': 'El cupón no es aplicable a tu compra actual.'
      };
      throw new Error(reasonMessages[validationResult.o_reason] || reasonMessages['DEFAULT']);
    }

    const dbCoupon = await couponRepository.findById(validationResult.o_coupon_id);
    if(!dbCoupon) throw new Error('Error interno: no se encontró el cupón después de validarlo.');

    return mapDbCouponToCoupon(dbCoupon);
  },

  async createCoupon(data: any, creatorId: number): Promise<Coupon> {
    const newCoupon = await dbWithAudit(creatorId, async () => {
      const created = await couponRepository.create(data);
      return created;
    });

    if (!newCoupon) throw new Error('Error al crear el cupón.');

    return newCoupon;
  },
  
  async updateCoupon(id: number, data: any, editorId: number): Promise<Coupon> {
    const updatedCoupon = await dbWithAudit(editorId, async () => {
        return await couponRepository.update(id, data);
    });

    if (!updatedCoupon) throw new Error('Error al actualizar el cupón.');
    
    return updatedCoupon;
  },
  
  async deleteCoupon(id: number, deleterId: number): Promise<boolean> {
    return dbWithAudit(deleterId, () => 
      couponRepository.delete(id)
    );
  },
  
  async bulkDeleteCoupons(ids: number[], deleterId: number): Promise<number> {
    return dbWithAudit(deleterId, () =>
      couponRepository.bulkDelete(ids)
    );
  },

};
