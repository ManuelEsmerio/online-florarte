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
import { PrismaClient, Prisma, Role, ProductStatus } from '@prisma/client';
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

type SampleProductVariantConfig = {
  name: string;
  price: number;
  stock: number;
  shortDescription?: string;
  description?: string;
  code?: string;
};

type SampleProductConfig = {
  code: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  stock: number;
  badgeText?: string;
  categorySlug: string;
  mainImage: string;
  imageGallery?: string[];
  allowPhoto?: boolean;
  photoPrice?: number;
  occasionSlugs?: string[];
  variants?: SampleProductVariantConfig[];
};

const sampleProducts: SampleProductConfig[] = [
  {
    code: 'ARR-DEMO-001',
    name: 'Aurora Pastel Premium',
    description: 'Composición artesanal con rosas pastel, lisianthus y follaje eucalipto diseñada para celebraciones memorables.',
    shortDescription: 'Ramo pastel con rosas importadas y textura romántica.',
    price: 1899,
    stock: 12,
    badgeText: 'Más vendido',
    categorySlug: 'arreglos-florales',
    mainImage: '/sample/products/aurora-pastel-1.webp',
    imageGallery: ['/sample/products/aurora-pastel-1.webp', '/sample/products/aurora-pastel-2.webp'],
    occasionSlugs: [slugify('Cumpleaños'), slugify('Amor / Romance')],
  },
  {
    code: 'RAM-DEMO-002',
    name: 'Bouquet Amanecer Citrino',
    description: 'Bouquet vibrante con rosas amarillas, girasoles y toques blancos perfecto para levantar el ánimo al instante.',
    shortDescription: 'Girasoles y rosas amarillas en envoltura de lino.',
    price: 1099,
    salePrice: 999,
    stock: 15,
    badgeText: 'Oferta',
    categorySlug: 'ramos-florales',
    mainImage: '/sample/products/amanecer-citrino-1.webp',
    imageGallery: ['/sample/products/amanecer-citrino-1.webp'],
    occasionSlugs: [slugify('Felicitaciones'), slugify('Sorpresa')],
  },
  {
    code: 'PLT-DEMO-003',
    name: 'Monstera Esmeralda XL',
    description: 'Monstera deliciosa de vivero premium entregada en maceta de cerámica mate lista para interiores luminosos.',
    shortDescription: 'Planta de interior tropical de 80 cm.',
    price: 799,
    stock: 10,
    categorySlug: 'plantas',
    mainImage: '/sample/products/monstera-esmeralda-1.webp',
    imageGallery: ['/sample/products/monstera-esmeralda-1.webp'],
    occasionSlugs: [slugify('Nacimiento')],
  },
  {
    code: 'PLT-DEMO-008',
    name: 'Terrario Suculentas Duo',
    description: 'Terrario ovalado con suculentas seleccionadas, piedras de río y arena volcánica para oficinas o mesas auxiliares.',
    shortDescription: 'Terrario moderno listo para regalar.',
    price: 549,
    stock: 18,
    categorySlug: 'plantas',
    mainImage: '/sample/products/terrario-duo-1.webp',
    imageGallery: ['/sample/products/terrario-duo-1.webp'],
    occasionSlugs: [slugify('Felicitaciones')],
  },
  {
    code: 'PAQ-DEMO-004',
    name: 'Kit Celebración Dulce',
    description: 'Caja experiencia con mini bouquet, botella espumosa y tabla de postres artesanales para festejar en casa.',
    shortDescription: 'Mini bouquet + postres + bebida espumosa.',
    price: 1699,
    stock: 6,
    categorySlug: 'paquetes',
    mainImage: '/sample/products/kit-celebracion-1.webp',
    imageGallery: ['/sample/products/kit-celebracion-1.webp', '/sample/products/kit-celebracion-2.webp'],
    occasionSlugs: [slugify('Aniversario'), slugify('Graduación')],
    variants: [
      {
        name: 'Standard',
        price: 1699,
        stock: 6,
        shortDescription: 'Incluye 6 postres y bouquet compacto.',
        description: 'Selección estándar con mini bouquet y tabla de 6 postres.',
      },
      {
        name: 'Deluxe',
        price: 2099,
        stock: 4,
        shortDescription: 'Incluye postres extra y cava rosada.',
        description: 'Versión deluxe con botella rosé y bouquet mediano.',
      },
    ],
  },
  {
    code: 'PEL-DEMO-005',
    name: 'Peluche Abrazo Gigante',
    description: 'Oso de felpa hipoalergénica de 60 cm con moño lavanda combinado con nuestras colecciones románticas.',
    shortDescription: 'Peluche premium de 60 cm.',
    price: 499,
    stock: 25,
    categorySlug: 'complementos-peluches',
    mainImage: '/sample/products/peluche-abrazo-1.webp',
    imageGallery: ['/sample/products/peluche-abrazo-1.webp'],
    occasionSlugs: [slugify('Amor / Romance'), slugify('San Valentín')],
  },
  {
    code: 'GLOB-DEMO-006',
    name: 'Set Globos Metálicos Solar',
    description: 'Set de 5 globos metálicos helio en tonos oro y coral con mensaje personalizable.',
    shortDescription: 'Set de globos helio listos para entrega.',
    price: 349,
    stock: 20,
    categorySlug: 'complementos-globos',
    mainImage: '/sample/products/globos-solar-1.webp',
    imageGallery: ['/sample/products/globos-solar-1.webp'],
    occasionSlugs: [slugify('Cumpleaños')],
  },
  {
    code: 'CHO-DEMO-007',
    name: 'Caja Trufas Artesanales Cacao 70%',
    description: 'Selección de 12 trufas artesanales con rellenos de licor y frutos rojos, elaboradas por Maison Román.',
    shortDescription: 'Caja gourmet de trufas mixtas.',
    price: 389,
    stock: 30,
    categorySlug: 'complementos-chocolates',
    mainImage: '/sample/products/trufas-artesanales-1.webp',
    imageGallery: ['/sample/products/trufas-artesanales-1.webp'],
    occasionSlugs: [slugify('Aniversario'), slugify('Sorpresa')],
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

async function seedSampleProducts() {
  console.log('🧪 Generando productos demo para pruebas...');

  const neededCategorySlugs = Array.from(new Set(sampleProducts.map((product) => product.categorySlug)));
  const categories = await prisma.productCategory.findMany({
    where: { slug: { in: neededCategorySlugs } },
  });
  const categoryMap = new Map(categories.map((category) => [category.slug, category.id]));

  if (categories.length !== neededCategorySlugs.length) {
    console.warn('⚠️ Algunas categorías para productos demo no existen todavía.');
  }

  const neededOccasionSlugs = Array.from(
    new Set(sampleProducts.flatMap((product) => product.occasionSlugs ?? []))
  );

  const occasionMap = new Map(
    neededOccasionSlugs.length
      ? (
          await prisma.occasion.findMany({
            where: { slug: { in: neededOccasionSlugs } },
          })
        ).map((occasion) => [occasion.slug, occasion.id])
      : []
  );

  for (const productConfig of sampleProducts) {
    const categoryId = categoryMap.get(productConfig.categorySlug);
    if (!categoryId) {
      console.warn(`⚠️ Omitiendo ${productConfig.name} porque falta la categoría ${productConfig.categorySlug}.`);
      continue;
    }

    const slug = slugify(productConfig.name);
    const existingProduct = await prisma.product.findUnique({ where: { slug } });
    if (existingProduct) {
      continue;
    }

    const product = await prisma.product.create({
      data: {
        name: productConfig.name,
        slug,
        code: productConfig.code,
        description: productConfig.description,
        shortDescription: productConfig.shortDescription,
        price: new Prisma.Decimal(productConfig.price),
        salePrice: productConfig.salePrice ? new Prisma.Decimal(productConfig.salePrice) : undefined,
        stock: productConfig.stock,
        hasVariants: Boolean(productConfig.variants?.length),
        status: ProductStatus.PUBLISHED,
        badgeText: productConfig.badgeText,
        categoryId,
        mainImage: productConfig.mainImage,
        allowPhoto: productConfig.allowPhoto ?? false,
        photoPrice: productConfig.photoPrice ? new Prisma.Decimal(productConfig.photoPrice) : undefined,
        images: productConfig.imageGallery?.length
          ? {
              create: productConfig.imageGallery.map((src, index) => ({
                src,
                alt: `${productConfig.name} ${index === 0 ? 'principal' : `detalle ${index + 1}`}`,
                isPrimary: index === 0,
                sortOrder: index,
              })),
            }
          : undefined,
        variants: productConfig.variants?.length
          ? {
              create: productConfig.variants.map((variant, index) => ({
                name: variant.name,
                productName: `${productConfig.name} - ${variant.name}`,
                code: variant.code ?? `${productConfig.code}-V${index + 1}`,
                price: new Prisma.Decimal(variant.price),
                stock: variant.stock,
                shortDescription: variant.shortDescription,
                description: variant.description,
              })),
            }
          : undefined,
      },
    });

    if (productConfig.occasionSlugs?.length) {
      for (const occasionSlug of productConfig.occasionSlugs) {
        const occasionId = occasionMap.get(occasionSlug);
        if (!occasionId) continue;

        await prisma.productOccasion.create({
          data: {
            productId: product.id,
            occasionId,
          },
        });
      }
    }

    console.log(`   • Producto demo creado: ${product.name}`);
  }

  console.log('✅ Productos demo listos.');
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
  /**
   * 🚨 Bloque temporal de productos demo para QA.
   * Eliminar esta sección cuando el catálogo real se gestione desde el panel.
   */
  await seedSampleProducts();
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
