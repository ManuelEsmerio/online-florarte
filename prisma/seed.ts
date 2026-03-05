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
import { PrismaClient, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();
const SHIPPING_ZONES_CSV_PATH = resolve(process.cwd(), 'public/data/zone_shipping.csv');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

type CategorySeedConfig = {
  name: string;
  slug: string;
  prefix: string;
  description: string;
  showOnHome?: boolean;
  parentSlug?: string;
};

const topLevelCategories: CategorySeedConfig[] = [
  {
    name: 'Arreglos Florales',
    slug: 'arreglos-florales',
    prefix: 'ARR',
    description: 'Arreglos florales artesanales diseñados para celebraciones y condolencias.',
    showOnHome: true,
  },
  {
    name: 'Ramos Florales',
    slug: 'ramos-florales',
    prefix: 'RAM',
    description: 'Ramos clásicos y modernos listos para regalar en cualquier ocasión.',
    showOnHome: true,
  },
  {
    name: 'Plantas',
    slug: 'plantas',
    prefix: 'PLT',
    description: 'Plantas de interior y exterior que mantienen vivo el detalle por más tiempo.',
    showOnHome: true,
  },
  {
    name: 'Paquetes',
    slug: 'paquetes',
    prefix: 'PAQ',
    description: 'Combos especiales que integran flores, presentes y experiencias.',
    showOnHome: true,
  },
  {
    name: 'Complementos',
    slug: 'complementos',
    prefix: 'COMP',
    description: 'Detalles adicionales que elevan la experiencia del regalo floral.',
    showOnHome: true,
  },
];

const complementChildren: CategorySeedConfig[] = [
  {
    name: 'Peluches',
    slug: 'complementos-peluches',
    prefix: 'PEL',
    description: 'Peluches premium que acompañan tus arreglos florales.',
    parentSlug: 'complementos',
  },
  {
    name: 'Globos',
    slug: 'complementos-globos',
    prefix: 'GLOB',
    description: 'Globos personalizados con mensajes para cada ocasión.',
    parentSlug: 'complementos',
  },
  {
    name: 'Chocolates',
    slug: 'complementos-chocolates',
    prefix: 'CHO',
    description: 'Chocolates artesanales que complementan el detalle floral.',
    parentSlug: 'complementos',
  },
];

const defaultOccasions = [
  {
    name: 'Cumpleaños',
    description: 'Arreglos florales perfectos para celebrar un cumpleaños y alegrar el día de alguien especial.',
    showOnHome: true,
  },
  {
    name: 'Amor / Romance',
    description: 'Flores ideales para expresar amor, pasión y momentos románticos inolvidables.',
    showOnHome: true,
  },
  {
    name: 'Día de las Madres',
    description: 'Hermosos arreglos para agradecer y celebrar a mamá en su día especial.',
    showOnHome: true,
  },
  {
    name: 'San Valentín',
    description: 'Ramos románticos perfectos para sorprender a tu pareja el 14 de febrero.',
    showOnHome: true,
  },
  {
    name: 'Condolencias',
    description: 'Arreglos florales elegantes para expresar respeto, apoyo y condolencias.',
    showOnHome: true,
  },
  {
    name: 'Graduación',
    description: 'Flores para felicitar y celebrar un logro académico importante.',
    showOnHome: true,
  },
  {
    name: 'Aniversario',
    description: 'Arreglos especiales para celebrar años de amor y momentos compartidos.',
    showOnHome: true,
  },
  {
    name: 'Nacimiento',
    description: 'Flores delicadas para dar la bienvenida a un nuevo integrante de la familia.',
    showOnHome: true,
  },
  {
    name: 'Felicitaciones',
    description: 'Arreglos florales ideales para celebrar logros, éxitos y buenas noticias.',
    showOnHome: true,
  },
  {
    name: 'Sorpresa',
    description: 'Flores perfectas para sorprender y alegrar el día de alguien especial.',
    showOnHome: true,
  },
];

type ShippingZoneRow = {
  postalCode: string;
  locality: string;
  settlementType: string | null;
  municipality: string | null;
  state: string | null;
  stateCode: string | null;
  municipalityCode: string | null;
  postalOfficeCode: string | null;
  zone: string | null;
  shippingCost: string;
};

async function seedDefaultCategories() {
  console.log('📦 Verificando categorías base...');

  const slugToId = new Map<string, number>();

  for (const category of topLevelCategories) {
    const result = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        prefix: category.prefix,
        description: category.description,
        showOnHome: category.showOnHome ?? false,
        isDeleted: false,
        deletedAt: null,
        parentId: null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        prefix: category.prefix,
        description: category.description,
        showOnHome: category.showOnHome ?? false,
      },
    });

    slugToId.set(category.slug, result.id);
  }

  for (const child of complementChildren) {
    const parentId = slugToId.get(child.parentSlug ?? '');
    if (!parentId) {
      console.warn(`⚠️ No se pudo crear la categoría hija ${child.name} porque falta el padre ${child.parentSlug}`);
      continue;
    }

    await prisma.productCategory.upsert({
      where: { slug: child.slug },
      update: {
        name: child.name,
        prefix: child.prefix,
        description: child.description,
        showOnHome: child.showOnHome ?? false,
        isDeleted: false,
        deletedAt: null,
        parentId,
      },
      create: {
        name: child.name,
        slug: child.slug,
        prefix: child.prefix,
        description: child.description,
        showOnHome: child.showOnHome ?? false,
        parentId,
      },
    });
  }

  console.log('✅ Categorías base listas.');
}

async function seedDefaultOccasions() {
  console.log('💌 Verificando ocasiones base...');

  for (const occasion of defaultOccasions) {
    const slug = slugify(occasion.name);
    await prisma.occasion.upsert({
      where: { slug },
      update: {
        name: occasion.name,
        description: occasion.description,
        showOnHome: occasion.showOnHome,
      },
      create: {
        name: occasion.name,
        slug,
        description: occasion.description,
        showOnHome: occasion.showOnHome,
      },
    });
  }

  console.log('✅ Ocasiones base listas.');
}

function parseShippingZonesCsv(filePath: string): ShippingZoneRow[] {
  const csvRaw = readFileSync(filePath, 'utf8');
  const lines = csvRaw.split(/\r?\n/);
  const rows: ShippingZoneRow[] = [];

  lines.forEach((line, index) => {
    if (index === 0 || !line.trim()) {
      return;
    }

    const columns = line.split(',').map((value) => value.trim());
    if (columns.length < 10) {
      console.warn(`⚠️ Línea ${index + 1} inválida en zone_shipping.csv (columnas: ${columns.length}).`);
      return;
    }

    const [
      postalCode,
      locality,
      settlementType,
      municipality,
      state,
      stateCode,
      municipalityCode,
      postalOfficeCode,
      zone,
      ...costParts
    ] = columns;

    const shippingCost = costParts.join('').trim();

    if (!postalCode || !locality || !shippingCost) {
      console.warn(`⚠️ Línea ${index + 1} sin valores requeridos, se omite.`);
      return;
    }

    rows.push({
      postalCode,
      locality,
      settlementType: settlementType || null,
      municipality: municipality || null,
      state: state || null,
      stateCode: stateCode || null,
      municipalityCode: municipalityCode || null,
      postalOfficeCode: postalOfficeCode || null,
      zone: zone || null,
      shippingCost,
    });
  });

  return rows;
}

async function seedShippingZonesFromCsv() {
  console.log('🚚 Importando zonas de envío desde CSV...');

  let zones: ShippingZoneRow[] = [];
  try {
    zones = parseShippingZonesCsv(SHIPPING_ZONES_CSV_PATH);
  } catch (error) {
    console.error('❌ No se pudieron leer las zonas de envío:', error);
    return;
  }

  if (!zones.length) {
    console.warn('⚠️ zone_shipping.csv no contiene registros.');
    return;
  }

  for (const zoneRow of zones) {
    const shippingCostDecimal = new Prisma.Decimal(zoneRow.shippingCost);

    await prisma.shippingZone.upsert({
      where: {
        postalCode_locality: {
          postalCode: zoneRow.postalCode,
          locality: zoneRow.locality,
        },
      },
      update: {
        settlementType: zoneRow.settlementType,
        municipality: zoneRow.municipality,
        state: zoneRow.state,
        stateCode: zoneRow.stateCode,
        municipalityCode: zoneRow.municipalityCode,
        postalOfficeCode: zoneRow.postalOfficeCode,
        zone: zoneRow.zone,
        shippingCost: shippingCostDecimal,
        isActive: true,
      },
      create: {
        postalCode: zoneRow.postalCode,
        locality: zoneRow.locality,
        settlementType: zoneRow.settlementType,
        municipality: zoneRow.municipality,
        state: zoneRow.state,
        stateCode: zoneRow.stateCode,
        municipalityCode: zoneRow.municipalityCode,
        postalOfficeCode: zoneRow.postalOfficeCode,
        zone: zoneRow.zone,
        shippingCost: shippingCostDecimal,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${zones.length} zonas de envío listas.`);
}

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
  await seedDefaultCategories();
  await seedDefaultOccasions();
  await seedShippingZonesFromCsv();
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('   1. Inicia sesión en /admin con las credenciales del seed');
  console.log('   2. Verifica categorías y ocasiones pre-cargadas en /admin');
  console.log('   3. Revisa zonas de envío en /admin/shipping');
  console.log('   4. Agrega productos en /admin/products');
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
