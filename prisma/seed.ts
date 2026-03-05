/**
 * prisma/seed.ts
 *
 * Seed mínimo para entorno de desarrollo.
 * Solo crea el usuario administrador inicial.
 *
 * El resto de la estructura del negocio (categorías, ocasiones, tags,
 * zonas de envío, productos) se administra desde el panel de administración.
 *
 * Variables de entorno opcionales:
 *   SEED_ADMIN_EMAIL    — default: admin@florarte.com
 *   SEED_ADMIN_PASSWORD — default: Admin@Florarte2024!
 *   SEED_ADMIN_NAME     — default: Administrador
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@florarte.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@Florarte2024!';
  const adminName     = process.env.SEED_ADMIN_NAME     ?? 'Administrador';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: {},
    create: {
      email:          adminEmail,
      name:           adminName,
      passwordHash:   hashedPassword,
      role:           Role.ADMIN,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✅ Usuario admin creado/verificado: ${admin.email}`);
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('   1. Inicia sesión en /admin con las credenciales del seed');
  console.log('   2. Crea categorías en /admin/categories');
  console.log('   3. Crea ocasiones en /admin/occasions');
  console.log('   4. Importa zonas de envío en /admin/shipping (CSV)');
  console.log('   5. Agrega productos en /admin/products');
  console.log('');
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
