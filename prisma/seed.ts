import {
  PrismaClient,
  TestimonialStatus,
  Role,
  OrderStatus,
  ProductStatus,
  DiscountType,
  CouponStatus,
  CouponScope,
} from '@prisma/client';
import { productCategories } from '../src/lib/data/categories-data';
import { allOccasions } from '../src/lib/data/occasion-data';
import { allTags } from '../src/lib/data/tag-data';
import { testimonials } from '../src/lib/data/testimonials-data';
import { allShippingZones } from '../src/lib/data/shipping-zones';
import { initialProducts } from '../src/lib/data/product-data';

const prisma = new PrismaClient();

const getTestimonialStatus = (status: string): TestimonialStatus => {
  switch (status.toLowerCase()) {
    case 'aprobado': return TestimonialStatus.APPROVED;
    case 'pendiente': return TestimonialStatus.PENDING;
    case 'rechazado': return TestimonialStatus.REJECTED;
    default: return TestimonialStatus.PENDING;
  }
};

const mapProductStatus = (status: string): ProductStatus => {
  switch (status) {
    case 'publicado': return ProductStatus.PUBLISHED;
    case 'oculto':    return ProductStatus.HIDDEN;
    default:          return ProductStatus.DRAFT;
  }
};

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ===========================================
  // 1. Categorías de Productos
  // ===========================================
  console.log('... Insertando Categorías');

  // Ordenamos para asegurar que el ID 1 se cree antes que el 6 (que depende del 1)
  const sortedCategories = [...productCategories].sort((a, b) => a.id - b.id);

  for (const cat of sortedCategories) {
    await prisma.productCategory.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        prefix: cat.prefix,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId,
        showOnHome: cat.showOnHome,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        prefix: cat.prefix,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId,
        showOnHome: cat.showOnHome,
      },
    });
  }

  console.log(`✅ ${sortedCategories.length} categorías procesadas.`);

  // ===========================================
  // 2. Ocasiones
  // ===========================================
  console.log('... Insertando Ocasiones');

  for (const occasion of allOccasions) {
    await prisma.occasion.upsert({
      where: { id: occasion.id },
      update: {
        name: occasion.name,
        slug: occasion.slug,
        description: occasion.description,
        imageUrl: occasion.imageUrl,
        showOnHome: occasion.showOnHome,
      },
      create: {
        id: occasion.id,
        name: occasion.name,
        slug: occasion.slug,
        description: occasion.description,
        imageUrl: occasion.imageUrl,
        showOnHome: occasion.showOnHome,
      },
    });
  }

  console.log(`✅ ${allOccasions.length} ocasiones procesadas.`);

  // ===========================================
  // 3. Zonas de Envío
  // ===========================================
  console.log('... Insertando Zonas de Envío');

  for (const zone of allShippingZones) {
    await prisma.shippingZone.upsert({
      where: { id: zone.id },
      update: {
        postalCode: zone.postalCode,
        locality: zone.locality,
        shippingCost: zone.shippingCost,
      },
      create: {
        id: zone.id,
        postalCode: zone.postalCode,
        locality: zone.locality,
        shippingCost: zone.shippingCost,
      },
    });
  }
  console.log(`✅ ${allShippingZones.length} zonas de envío procesadas.`);

  // ===========================================
  // 4. Testimonios
  // ===========================================
  console.log('... Insertando Testimonios (y datos dependientes)');

  for (const t of testimonials) {
    // 4.1 Usuario (Necesario para el testimonio)
    await prisma.user.upsert({
      where: { id: t.userId },
      update: {
        profilePicUrl: t.userProfilePic,
      },
      create: {
        id: t.userId,
        name: t.userName,
        email: `user_seed_${t.userId}@florarte.com`, // Email dummy
        role: Role.CUSTOMER,
        profilePicUrl: t.userProfilePic,
      },
    });

    // 4.2 Orden (Necesaria para el testimonio)
    await prisma.order.upsert({
      where: { id: t.orderId },
      update: {},
      create: {
        id: t.orderId,
        userId: t.userId,
        subtotal: 0,
        total: 0,
        shippingCost: 0,
        deliveryDate: new Date(),
        deliveryTimeSlot: 'Mañana',
        status: OrderStatus.DELIVERED,
      },
    });

    // 4.3 Testimonio
    await prisma.testimonial.upsert({
      where: { orderId: t.orderId },
      update: {
        rating: t.rating,
        comment: t.comment,
        status: getTestimonialStatus(t.status),
        userId: t.userId,
      },
      create: {
        id: t.id,
        userId: t.userId,
        orderId: t.orderId,
        rating: t.rating,
        comment: t.comment,
        userName: t.userName,
        userProfilePic: t.userProfilePic,
        status: getTestimonialStatus(t.status),
        createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
      },
    });
  }
  console.log(`✅ ${testimonials.length} testimonios procesados.`);

  // ===========================================
  // 5. Tags
  // ===========================================
  console.log('... Insertando Tags');

  for (const tag of allTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: { id: tag.id, name: tag.name },
    });
  }

  console.log(`✅ ${allTags.length} tags procesados.`);

  // ===========================================
  // 6. Productos, Variantes e Imágenes
  // ===========================================
  console.log('... Insertando Productos');

  // Los datos de product-data.ts usan snake_case, los casteamos a `any`
  const products = initialProducts as any[];

  for (const p of products) {
    // Mapeo de campos snake_case → camelCase (Prisma)
    const categoryId       = p.category?.id ?? p.categoryId;
    const hasVariants      = p.has_variants ?? p.hasVariants ?? false;
    const shortDescription = p.short_description ?? p.shortDescription ?? null;
    const badgeText        = p.tag_visible ?? p.badgeText ?? null;
    const salePrice        = p.sale_price ?? p.salePrice ?? null;
    const mainImage        = p.image ?? p.mainImage ?? null;
    const allowPhoto       = p.allow_photo ?? p.allowPhoto ?? false;
    const photoPrice       = p.photo_price ?? p.photoPrice ?? null;

    // 6.1 Upsert del Producto
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name:             p.name,
        slug:             p.slug,
        code:             p.code,
        description:      p.description ?? null,
        shortDescription,
        price:            p.price,
        salePrice,
        stock:            p.stock,
        hasVariants,
        status:           mapProductStatus(p.status),
        care:             p.care ?? null,
        mainImage,
        badgeText,
        allowPhoto,
        photoPrice,
        categoryId,
      },
      create: {
        id: p.id,
        name:             p.name,
        slug:             p.slug,
        code:             p.code,
        description:      p.description ?? null,
        shortDescription,
        price:            p.price,
        salePrice,
        stock:            p.stock,
        hasVariants,
        status:           mapProductStatus(p.status),
        care:             p.care ?? null,
        mainImage,
        badgeText,
        allowPhoto,
        photoPrice,
        categoryId,
      },
    });

    // 6.2 Imágenes del Producto (solo para productos sin variantes)
    if (!hasVariants && p.images?.length) {
      await prisma.productImage.deleteMany({ where: { productId: p.id, variantId: null } });
      await prisma.productImage.createMany({
        data: p.images.map((img: any, idx: number) => ({
          productId: p.id,
          src:       img.src,
          alt:       img.alt,
          isPrimary: img.is_primary ?? img.isPrimary ?? false,
          sortOrder: idx,
        })),
      });
    }

    // 6.3 Especificaciones del Producto
    if (p.specifications?.length) {
      await prisma.productSpecification.deleteMany({ where: { productId: p.id, variantId: null } });
      await prisma.productSpecification.createMany({
        data: p.specifications.map((spec: any, idx: number) => ({
          productId: p.id,
          key:       spec.key,
          value:     spec.value,
          sortOrder: idx,
        })),
      });
    }

    // 6.4 Tags del Producto (tabla junction)
    await prisma.productTag.deleteMany({ where: { productId: p.id } });
    if (p.tags?.length) {
      await prisma.productTag.createMany({
        data: p.tags.map((tag: any) => ({
          productId: p.id,
          tagId:     tag.id,
        })),
      });
    }

    // 6.5 Ocasiones del Producto (tabla junction)
    await prisma.productOccasion.deleteMany({ where: { productId: p.id } });
    if (p.occasions?.length) {
      await prisma.productOccasion.createMany({
        data: p.occasions.map((occ: any) => ({
          productId:  p.id,
          occasionId: occ.id,
        })),
      });
    }

    // 6.6 Variantes (solo para productos con has_variants: true)
    if (hasVariants && p.variants?.length) {
      for (const v of p.variants) {
        const variantSalePrice = v.sale_price ?? v.salePrice ?? null;

        await prisma.productVariant.upsert({
          where: { id: v.id },
          update: {
            name:             v.name,
            code:             v.code ?? null,
            price:            v.price,
            salePrice:        variantSalePrice,
            stock:            v.stock,
            shortDescription: v.short_description ?? v.shortDescription ?? null,
            description:      v.description ?? null,
          },
          create: {
            id:               v.id,
            productId:        p.id,
            name:             v.name,
            code:             v.code ?? null,
            price:            v.price,
            salePrice:        variantSalePrice,
            stock:            v.stock,
            shortDescription: v.short_description ?? v.shortDescription ?? null,
            description:      v.description ?? null,
          },
        });

        // 6.7 Imágenes de la Variante
        if (v.images?.length) {
          await prisma.productImage.deleteMany({ where: { variantId: v.id } });
          await prisma.productImage.createMany({
            data: v.images.map((img: any, idx: number) => ({
              variantId: v.id,
              src:       img.src,
              alt:       img.alt,
              isPrimary: img.is_primary ?? img.isPrimary ?? false,
              sortOrder: idx,
            })),
          });
        }
      }
    }
  }

  console.log(`✅ ${products.length} productos procesados.`);

  // ===========================================
  // 7. Cupones
  // ===========================================
  console.log('... Insertando Cupones');

  // Cupones definidos inline (coupon-data.ts tiene dependencias rotas)
  const couponsData = [
    {
      id: 1,
      code: 'VERANO2024',
      description: '20% de descuento en toda la tienda para la temporada de verano.',
      discountType:  DiscountType.PERCENTAGE,
      discountValue: 20,
      validFrom:  new Date('2024-06-01T00:00:00Z'),
      validUntil: new Date('2025-08-31T23:59:59Z'),
      status: CouponStatus.EXPIRED,
      scope:  CouponScope.GLOBAL,
      maxUses: 100,
      usesCount: 25,
      userId: null,
    },
    {
      id: 2,
      code: 'BIENVENIDA10',
      description: '10% de descuento en tu primera compra.',
      discountType:  DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom:  new Date('2024-01-01T00:00:00Z'),
      validUntil: new Date('2025-12-31T23:59:59Z'),
      status: CouponStatus.EXPIRED,
      scope:  CouponScope.GLOBAL,
      maxUses: null,
      usesCount: 150,
      userId: null,
    },
    {
      id: 3,
      code: 'REGALOJUAN',
      description: 'Cupón especial de $150 para Juan Pérez.',
      discountType:  DiscountType.FIXED,
      discountValue: 150,
      validFrom:  new Date('2024-07-01T00:00:00Z'),
      validUntil: new Date('2024-07-31T23:59:59Z'),
      status: CouponStatus.EXPIRED,
      scope:  CouponScope.SPECIFIC,
      maxUses: 1,
      usesCount: 0,
      userId: 2,
    },
    {
      id: 4,
      code: 'AMORFLORAL',
      description: '15% de descuento en la categoría de Arreglos Florales.',
      discountType:  DiscountType.PERCENTAGE,
      discountValue: 15,
      validFrom:  new Date('2024-02-01T00:00:00Z'),
      validUntil: new Date('2024-02-14T23:59:59Z'),
      status: CouponStatus.EXPIRED,
      scope:  CouponScope.GLOBAL,
      maxUses: 200,
      usesCount: 180,
      userId: null,
    },
    {
      id: 5,
      code: 'CLIENTEVIP',
      description: '$200 de descuento para clientes VIP.',
      discountType:  DiscountType.FIXED,
      discountValue: 200,
      validFrom:  new Date('2024-07-01T00:00:00Z'),
      validUntil: new Date('2025-01-01T23:59:59Z'),
      status: CouponStatus.USED,
      scope:  CouponScope.SPECIFIC,
      maxUses: 1,
      usesCount: 1,
      userId: 3,
    },
    {
      id: 6,
      code: 'FLORARTE200',
      description: 'Cupón de regalo de $200 MXN en toda la tienda.',
      discountType:  DiscountType.FIXED,
      discountValue: 200,
      validFrom:  new Date('2024-07-01T00:00:00Z'),
      validUntil: new Date('2024-12-31T23:59:59Z'),
      status: CouponStatus.EXPIRED,
      scope:  CouponScope.GLOBAL,
      maxUses: null,
      usesCount: 5,
      userId: null,
    },
    {
      id: 7,
      code: 'JUANP35',
      description: '35% de descuento especial para Juan Pérez.',
      discountType:  DiscountType.PERCENTAGE,
      discountValue: 35,
      validFrom:  new Date('2024-07-01T00:00:00Z'),
      validUntil: new Date('2024-12-31T23:59:59Z'),
      status: CouponStatus.EXPIRED,
      scope:  CouponScope.SPECIFIC,
      maxUses: 1,
      usesCount: 0,
      userId: 2,
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { id: c.id },
      update: {
        code:          c.code,
        description:   c.description,
        discountType:  c.discountType,
        discountValue: c.discountValue,
        validFrom:     c.validFrom,
        validUntil:    c.validUntil,
        status:        c.status,
        scope:         c.scope,
        maxUses:       c.maxUses,
        usesCount:     c.usesCount,
      },
      create: {
        id:            c.id,
        code:          c.code,
        description:   c.description,
        discountType:  c.discountType,
        discountValue: c.discountValue,
        validFrom:     c.validFrom,
        validUntil:    c.validUntil,
        status:        c.status,
        scope:         c.scope,
        maxUses:       c.maxUses,
        usesCount:     c.usesCount,
      },
    });

    // CouponUser para cupones de scope SPECIFIC
    if (c.scope === CouponScope.SPECIFIC && c.userId != null) {
      await prisma.couponUser.upsert({
        where: { couponId_userId: { couponId: c.id, userId: c.userId } },
        update: {},
        create: { couponId: c.id, userId: c.userId },
      });
    }
  }

  console.log(`✅ ${couponsData.length} cupones procesados.`);

  console.log('🏁 Seed completado exitosamente.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
