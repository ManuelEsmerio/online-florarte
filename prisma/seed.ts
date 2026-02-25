import { PrismaClient, TestimonialStatus, Role, OrderStatus } from '@prisma/client';
import { productCategories } from '../src/lib/data/categories-data';
import { allOccasions } from '../src/lib/data/occasion-data';
import { testimonials } from '../src/lib/data/testimonials-data';
import { allShippingZones } from '../src/lib/data/shipping-zones';

const prisma = new PrismaClient();

const getTestimonialStatus = (status: string): TestimonialStatus => {
  switch (status.toLowerCase()) {
    case 'aprobado': return TestimonialStatus.APPROVED;
    case 'pendiente': return TestimonialStatus.PENDING;
    case 'rechazado': return TestimonialStatus.REJECTED;
    default: return TestimonialStatus.PENDING;
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
        imageUrl: cat.image_url,
        parentId: cat.parent_id,
        showOnHome: cat.show_on_home,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        prefix: cat.prefix,
        description: cat.description,
        imageUrl: cat.image_url,
        parentId: cat.parent_id,
        showOnHome: cat.show_on_home,
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
        imageUrl: occasion.image_url,    // Mapeo: image_url -> imageUrl
        showOnHome: occasion.show_on_home, // Mapeo: show_on_home -> showOnHome
      },
      create: {
        id: occasion.id,
        name: occasion.name,
        slug: occasion.slug,
        description: occasion.description,
        imageUrl: occasion.image_url,
        showOnHome: occasion.show_on_home,
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
        postalCode: zone.postal_code,
        locality: zone.locality,
        shippingCost: zone.shipping_cost,
      },
      create: {
        id: zone.id,
        postalCode: zone.postal_code,
        locality: zone.locality,
        shippingCost: zone.shipping_cost,
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