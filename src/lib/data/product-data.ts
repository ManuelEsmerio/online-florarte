// src/lib/data/product-data.ts
import type { Product, ProductCategory, Tag, Occasion } from "../definitions";
import { productCategories } from './categories-data';
import { allOccasions } from './occasion-data';
import { allTags } from './tag-data';

const findCat = (id: number): ProductCategory => productCategories.find(c => c.id === id)!;
const findOcc = (id: number): Occasion => allOccasions.find(o => o.id === id)!;
const findTag = (id: number): Tag => allTags.find(t => t.id === id)!;

const CARE_FLOWERS = 'Las flores vienen en un oasis floral hidrofílico. Verter un poco de agua en el centro diariamente, evitando mojar los pétalos directamente.';
const CARE_PLANTS = 'Colocar en un lugar con luz indirecta. Regar solo cuando la tierra esté seca al tacto. Evitar corrientes de aire frío.';

export const initialProducts: Product[] = [
  // --- PRODUCTOS CON VARIANTES (5) ---
  {
    id: 1, name: "Arreglo 'Jardín de Ensueño'", slug: 'arreglo-jardin-ensueno', code: 'ARR-VAR-001',
    description: 'Un espectacular diseño floral que crece contigo. Disponible en tres tamaños para adaptarse perfectamente a tu espacio y presupuesto.',
    short_description: 'Arreglo floral mixto disponible en varios tamaños.',
    tag_visible: 'NUEVO',
    price: 850, stock: 15, has_variants: true, status: 'publicado', category: findCat(1), tags: [findTag(2), findTag(4)],
    image: 'https://picsum.photos/seed/jardin-main/600/600',
    specifications: [
        { key: 'Flores', value: 'Rosas, Lilies y Follaje' },
        { key: 'Base', value: 'Cerámica Artesanal' },
        { key: 'Duración', value: '5 a 7 días' }
    ],
    care: CARE_FLOWERS,
    variants: [
      { id: 101, name: 'Chico', price: 850, stock: 5, code: 'ARR-VAR-001-CH', images: [{ src: 'https://picsum.photos/seed/jardin-ch-1/600/600', alt: 'Chico 1', is_primary: true }, { src: 'https://picsum.photos/seed/jardin-ch-2/600/600', alt: 'Chico 2', is_primary: false }, { src: 'https://picsum.photos/seed/jardin-ch-3/600/600', alt: 'Chico 3', is_primary: false }] },
      { id: 102, name: 'Mediano', price: 1450, stock: 8, code: 'ARR-VAR-001-MD', images: [{ src: 'https://picsum.photos/seed/jardin-md-1/600/600', alt: 'Mediano 1', is_primary: true }, { src: 'https://picsum.photos/seed/jardin-md-2/600/600', alt: 'Mediano 2', is_primary: false }, { src: 'https://picsum.photos/seed/jardin-md-3/600/600', alt: 'Mediano 3', is_primary: false }] },
      { id: 103, name: 'Grande', price: 2600, stock: 3, code: 'ARR-VAR-001-GD', images: [{ src: 'https://picsum.photos/seed/jardin-gd-1/600/600', alt: 'Grande 1', is_primary: true }, { src: 'https://picsum.photos/seed/jardin-gd-2/600/600', alt: 'Grande 2', is_primary: false }, { src: 'https://picsum.photos/seed/jardin-gd-3/600/600', alt: 'Grande 3', is_primary: false }] }
    ],
    occasions: [findOcc(1), findOcc(2)], allow_photo: true, photo_price: 45
  },
  {
    id: 6, name: 'Ramo de Rosas "Pasión"', slug: 'ramo-rosas-pasion', code: 'RAM-VAR-006',
    description: 'Nuestras mejores rosas seleccionadas a mano para expresar amor verdadero.',
    short_description: 'Ramo de rosas premium en diversas cantidades.',
    tag_visible: 'MÁS VENDIDO',
    price: 650, stock: 30, has_variants: true, status: 'publicado', category: findCat(2), tags: [findTag(1), findTag(3)],
    image: 'https://picsum.photos/seed/pasion-main/600/600',
    specifications: [
        { key: 'Tipo', value: 'Rosas de Exportación' },
        { key: 'Empaque', value: 'Papel Coreano de Lujo' }
    ],
    care: 'Cortar los tallos 2cm en diagonal y cambiar el agua cada 2 días.',
    variants: [
      { id: 601, name: '12 Rosas', price: 650, stock: 15, code: 'RAM-VAR-006-12', images: [{ src: 'https://picsum.photos/seed/rosas-12-1/600/600', alt: '12 Rosas 1', is_primary: true }, { src: 'https://picsum.photos/seed/rosas-12-2/600/600', alt: '12 Rosas 2', is_primary: false }, { src: 'https://picsum.photos/seed/rosas-12-3/600/600', alt: '12 Rosas 3', is_primary: false }] },
      { id: 602, name: '24 Rosas', price: 1150, stock: 10, code: 'RAM-VAR-006-24', images: [{ src: 'https://picsum.photos/seed/rosas-24-1/600/600', alt: '24 Rosas 1', is_primary: true }, { src: 'https://picsum.photos/seed/rosas-24-2/600/600', alt: '24 Rosas 2', is_primary: false }, { src: 'https://picsum.photos/seed/rosas-24-3/600/600', alt: '24 Rosas 3', is_primary: false }] },
      { id: 603, name: '50 Rosas', price: 2100, stock: 5, code: 'RAM-VAR-006-50', images: [{ src: 'https://picsum.photos/seed/rosas-50-1/600/600', alt: '50 Rosas 1', is_primary: true }, { src: 'https://picsum.photos/seed/rosas-50-2/600/600', alt: '50 Rosas 2', is_primary: false }, { src: 'https://picsum.photos/seed/rosas-50-3/600/600', alt: '50 Rosas 3', is_primary: false }] }
    ],
    occasions: [findOcc(3), findOcc(7)], allow_photo: false
  },
  {
    id: 11, name: 'Orquídea Phalaenopsis Premium', slug: 'orquidea-premium', code: 'PLA-VAR-011',
    description: 'La reina de las plantas de interior en maceta de cerámica artesanal.',
    short_description: 'Elegante orquídea de larga duración.',
    tag_visible: 'OFERTA',
    price: 750, stock: 20, has_variants: true, status: 'publicado', category: findCat(3), tags: [findTag(4), findTag(7)],
    image: 'https://picsum.photos/seed/orq-main/600/600',
    specifications: [
        { key: 'Tipo', value: 'Phalaenopsis' },
        { key: 'Maceta', value: 'Cerámica' }
    ],
    care: 'Riego moderado cada 10 días. Luz indirecta.',
    variants: [
      { id: 1101, name: '1 Vara', price: 750, sale_price: 650, stock: 10, code: 'PLA-VAR-011-1V', images: [{ src: 'https://picsum.photos/seed/orq-1v-1/600/600', alt: '1 vara 1', is_primary: true }, { src: 'https://picsum.photos/seed/orq-1v-2/600/600', alt: '1 vara 2', is_primary: false }, { src: 'https://picsum.photos/seed/orq-1v-3/600/600', alt: '1 vara 3', is_primary: false }] },
      { id: 1102, name: '2 Varas', price: 1200, stock: 7, code: 'PLA-VAR-011-2V', images: [{ src: 'https://picsum.photos/seed/orq-2v-1/600/600', alt: '2 varas 1', is_primary: true }, { src: 'https://picsum.photos/seed/orq-2v-2/600/600', alt: '2 varas 2', is_primary: false }, { src: 'https://picsum.photos/seed/orq-2v-3/600/600', alt: '2 varas 3', is_primary: false }] }
    ],
    occasions: [findOcc(2), findOcc(5)], allow_photo: false
  },
  {
    id: 16, name: 'Paquete "Celebración Total"', slug: 'paquete-celebracion', code: 'PAQ-VAR-016',
    description: 'Haz que su día sea inolvidable con este paquete escalable.',
    short_description: 'Flores combinadas con regalos.',
    price: 950, stock: 12, has_variants: true, status: 'publicado', category: findCat(4), tags: [findTag(1)],
    image: 'https://picsum.photos/seed/paq-main/600/600',
    specifications: [
        { key: 'Arreglo', value: 'Mix de Temporada' },
        { key: 'Complementos', value: 'Variables según opción' }
    ],
    care: CARE_FLOWERS,
    variants: [
      { id: 1601, name: 'Básico (Flores + Globo)', price: 950, stock: 10, code: 'PAQ-VAR-016-BA', images: [{ src: 'https://picsum.photos/seed/paq-ba-1/600/600', alt: 'Básico 1', is_primary: true }, { src: 'https://picsum.photos/seed/paq-ba-2/600/600', alt: 'Básico 2', is_primary: false }, { src: 'https://picsum.photos/seed/paq-ba-3/600/600', alt: 'Básico 3', is_primary: false }] },
      { id: 1602, name: 'Premium (Flores + Globo + Peluche)', price: 1650, stock: 5, code: 'PAQ-VAR-016-PR', images: [{ src: 'https://picsum.photos/seed/paq-pr-1/600/600', alt: 'Premium 1', is_primary: true }, { src: 'https://picsum.photos/seed/paq-pr-2/600/600', alt: 'Premium 2', is_primary: false }, { src: 'https://picsum.photos/seed/paq-pr-3/600/600', alt: 'Premium 3', is_primary: false }] }
    ],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 21, name: 'Oso de Felpa Abrazable', slug: 'oso-felpa', code: 'COM-VAR-021',
    description: 'Suave y tierno compañero de felpa de alta calidad.',
    short_description: 'Peluche de oso en varios tamaños.',
    price: 350, stock: 40, has_variants: true, status: 'publicado', category: findCat(11), tags: [findTag(1)],
    image: 'https://picsum.photos/seed/bear-main/600/600',
    specifications: [
        { key: 'Material', value: 'Felpa hipoalergénica' },
        { key: 'Color', value: 'Miel' }
    ],
    care: 'Lavar en seco.',
    variants: [
      { id: 2101, name: 'Pequeño (30cm)', price: 350, stock: 20, code: 'COM-VAR-021-30', images: [{ src: 'https://picsum.photos/seed/bear-30-1/600/600', alt: 'Pequeño 1', is_primary: true }, { src: 'https://picsum.photos/seed/bear-30-2/600/600', alt: 'Pequeño 2', is_primary: false }, { src: 'https://picsum.photos/seed/bear-30-3/600/600', alt: 'Pequeño 3', is_primary: false }] },
      { id: 2102, name: 'Gigante (100cm)', price: 1200, stock: 5, code: 'COM-VAR-021-100', images: [{ src: 'https://picsum.photos/seed/bear-100-1/600/600', alt: 'Gigante 1', is_primary: true }, { src: 'https://picsum.photos/seed/bear-100-2/600/600', alt: 'Gigante 2', is_primary: false }, { src: 'https://picsum.photos/seed/bear-100-3/600/600', alt: 'Gigante 3', is_primary: false }] }
    ],
    occasions: [findOcc(1), findOcc(3)], allow_photo: false
  },

  // --- PRODUCTOS NORMALES (Resto hasta 45) ---
  // ARREGLOS (4 más)
  {
    id: 2, name: 'Caja Corazón de Girasoles', slug: 'caja-corazon-girasoles', code: 'ARR-GIR-002',
    description: 'Caja rígida en forma de corazón con 10-12 girasoles frescos.',
    short_description: 'Caja corazón con girasoles.',
    tag_visible: 'MÁS VENDIDO',
    price: 850, stock: 15, has_variants: false, status: 'publicado', category: findCat(1), tags: [findTag(2)],
    image: 'https://picsum.photos/seed/gir1/600/600',
    specifications: [{ key: 'Flores', value: 'Girasoles' }, { key: 'Base', value: 'Caja Corazón' }],
    care: CARE_FLOWERS,
    images: [{ src: 'https://picsum.photos/seed/gir1/600/600', alt: 'Girasoles 1', is_primary: true }, { src: 'https://picsum.photos/seed/gir2/600/600', alt: 'Girasoles 2', is_primary: false }, { src: 'https://picsum.photos/seed/gir3/600/600', alt: 'Girasoles 3', is_primary: false }],
    occasions: [findOcc(1), findOcc(3)], allow_photo: true, photo_price: 50
  },
  {
    id: 3, name: 'Arreglo Tropical Exótico', slug: 'arreglo-tropical', code: 'ARR-TRO-003',
    description: 'Mezcla exótica de anturios y aves del paraíso.',
    price: 1200, stock: 8, has_variants: false, status: 'publicado', category: findCat(1), tags: [findTag(5)],
    image: 'https://picsum.photos/seed/tro1/600/600',
    specifications: [{ key: 'Estilo', value: 'Tropical' }],
    care: CARE_FLOWERS,
    images: [{ src: 'https://picsum.photos/seed/tro1/600/600', alt: 'Tropical 1', is_primary: true }, { src: 'https://picsum.photos/seed/tro2/600/600', alt: 'Tropical 2', is_primary: false }, { src: 'https://picsum.photos/seed/tro3/600/600', alt: 'Tropical 3', is_primary: false }],
    occasions: [findOcc(5)], allow_photo: false
  },
  {
    id: 4, name: 'Canasta Silvestre', slug: 'canasta-silvestre', code: 'ARR-CAM-004',
    description: 'Flores de campo en canasta de mimbre artesanal.',
    price: 750, stock: 20, has_variants: false, status: 'publicado', category: findCat(1), tags: [findTag(6)],
    image: 'https://picsum.photos/seed/cam1/600/600',
    specifications: [{ key: 'Base', value: 'Mimbre' }],
    care: CARE_FLOWERS,
    images: [{ src: 'https://picsum.photos/seed/cam1/600/600', alt: 'Silvestre 1', is_primary: true }, { src: 'https://picsum.photos/seed/cam2/600/600', alt: 'Silvestre 2', is_primary: false }, { src: 'https://picsum.photos/seed/cam3/600/600', alt: 'Silvestre 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 5, name: 'Arreglo Zen Blanco', slug: 'arreglo-zen', code: 'ARR-ZEN-005',
    description: 'Lirios y rosas blancas en base minimalista.',
    price: 950, stock: 12, has_variants: false, status: 'publicado', category: findCat(1), tags: [findTag(4)],
    image: 'https://picsum.photos/seed/zen1/600/600',
    specifications: [{ key: 'Color', value: 'Blanco' }],
    care: CARE_FLOWERS,
    images: [{ src: 'https://picsum.photos/seed/zen1/600/600', alt: 'Zen 1', is_primary: true }, { src: 'https://picsum.photos/seed/zen2/600/600', alt: 'Zen 2', is_primary: false }, { src: 'https://picsum.photos/seed/zen3/600/600', alt: 'Zen 3', is_primary: false }],
    occasions: [findOcc(6)], allow_photo: false
  },

  // RAMOS (4 más)
  {
    id: 7, name: 'Ramo Tulipanes Arcoíris', slug: 'tulipanes-arcoiris', code: 'RAM-TUL-007',
    description: 'Tulipanes de diversos colores importados directamente.',
    tag_visible: 'NUEVO',
    price: 980, stock: 15, has_variants: false, status: 'publicado', category: findCat(2), tags: [findTag(2)],
    image: 'https://picsum.photos/seed/tulip1/600/600',
    specifications: [{ key: 'Flores', value: 'Tulipanes' }],
    care: 'Cambiar agua fría diariamente.',
    images: [{ src: 'https://picsum.photos/seed/tulip1/600/600', alt: 'Tulipán 1', is_primary: true }, { src: 'https://picsum.photos/seed/tulip2/600/600', alt: 'Tulipán 2', is_primary: false }, { src: 'https://picsum.photos/seed/tulip3/600/600', alt: 'Tulipán 3', is_primary: false }],
    occasions: [findOcc(3)], allow_photo: false
  },
  {
    id: 8, name: 'Bouquet de Peonías', slug: 'bouquet-peonias', code: 'RAM-PEO-008',
    description: 'Exclusivas peonías en tonos pastel.',
    price: 1350, stock: 5, has_variants: false, status: 'publicado', category: findCat(2), tags: [findTag(4)],
    image: 'https://picsum.photos/seed/peo1/600/600',
    specifications: [{ key: 'Temporada', value: 'Primavera' }],
    care: 'Evitar sol directo.',
    images: [{ src: 'https://picsum.photos/seed/peo1/600/600', alt: 'Peonía 1', is_primary: true }, { src: 'https://picsum.photos/seed/peo2/600/600', alt: 'Peonía 2', is_primary: false }, { src: 'https://picsum.photos/seed/peo3/600/600', alt: 'Peonía 3', is_primary: false }],
    occasions: [findOcc(2)], allow_photo: false
  },
  {
    id: 9, name: 'Atado de Girasoles', slug: 'atado-girasoles', code: 'RAM-GIR-009',
    description: 'Girasoles y margaritas con papel rústico.',
    price: 650, stock: 30, has_variants: false, status: 'publicado', category: findCat(2), tags: [findTag(6)],
    image: 'https://picsum.photos/seed/girmar1/600/600',
    specifications: [{ key: 'Estilo', value: 'Rústico' }],
    care: 'Cambiar agua cada 2 días.',
    images: [{ src: 'https://picsum.photos/seed/girmar1/600/600', alt: 'Girasol 1', is_primary: true }, { src: 'https://picsum.photos/seed/girmar2/600/600', alt: 'Girasol 2', is_primary: false }, { src: 'https://picsum.photos/seed/girmar3/600/600', alt: 'Girasol 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 10, name: 'Gerberas Multicolor', slug: 'gerberas-multi', code: 'RAM-GER-010',
    description: 'Explosión de color con gerberas seleccionadas.',
    price: 580, stock: 20, has_variants: false, status: 'publicado', category: findCat(2), tags: [findTag(5)],
    image: 'https://picsum.photos/seed/ger1/600/600',
    specifications: [{ key: 'Flores', value: 'Gerberas' }],
    care: 'Agua moderada.',
    images: [{ src: 'https://picsum.photos/seed/ger1/600/600', alt: 'Gerbera 1', is_primary: true }, { src: 'https://picsum.photos/seed/ger2/600/600', alt: 'Gerbera 2', is_primary: false }, { src: 'https://picsum.photos/seed/ger3/600/600', alt: 'Gerbera 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },

  // PLANTAS (4 más)
  {
    id: 12, name: 'Anturio Rojo', slug: 'anturio-rojo', code: 'PLA-ANT-012',
    description: 'Planta de anturio rojo en maceta decorativa.',
    price: 650, stock: 15, has_variants: false, status: 'publicado', category: findCat(3), tags: [findTag(7)],
    image: 'https://picsum.photos/seed/ant1/600/600',
    specifications: [{ key: 'Luz', value: 'Indirecta' }],
    care: CARE_PLANTS,
    images: [{ src: 'https://picsum.photos/seed/ant1/600/600', alt: 'Anturio 1', is_primary: true }, { src: 'https://picsum.photos/seed/ant2/600/600', alt: 'Anturio 2', is_primary: false }, { src: 'https://picsum.photos/seed/ant3/600/600', alt: 'Anturio 3', is_primary: false }],
    occasions: [findOcc(5)], allow_photo: false
  },
  {
    id: 13, name: 'Jardín de Suculentas', slug: 'jardin-suculentas', code: 'PLA-SUC-013',
    description: 'Composición de suculentas en base de barro.',
    price: 480, stock: 25, has_variants: false, status: 'publicado', category: findCat(3), tags: [findTag(5)],
    image: 'https://picsum.photos/seed/suc1/600/600',
    specifications: [{ key: 'Riego', value: 'Mínimo' }],
    care: 'Regar cada 15 días.',
    images: [{ src: 'https://picsum.photos/seed/suc1/600/600', alt: 'Suculenta 1', is_primary: true }, { src: 'https://picsum.photos/seed/suc2/600/600', alt: 'Suculenta 2', is_primary: false }, { src: 'https://picsum.photos/seed/suc3/600/600', alt: 'Suculenta 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 14, name: 'Palo de Brasil', slug: 'palo-brasil', code: 'PLA-BRA-014',
    description: 'Planta de interior resistente y elegante.',
    price: 720, stock: 10, has_variants: false, status: 'publicado', category: findCat(3), tags: [findTag(5)],
    image: 'https://picsum.photos/seed/bra1/600/600',
    specifications: [{ key: 'Ambiente', value: 'Sombra' }],
    care: CARE_PLANTS,
    images: [{ src: 'https://picsum.photos/seed/bra1/600/600', alt: 'Brasil 1', is_primary: true }, { src: 'https://picsum.photos/seed/bra2/600/600', alt: 'Brasil 2', is_primary: false }, { src: 'https://picsum.photos/seed/bra3/600/600', alt: 'Brasil 3', is_primary: false }],
    occasions: [findOcc(4)], allow_photo: false
  },
  {
    id: 15, name: 'Cuna de Moisés', slug: 'cuna-moises', code: 'PLA-ESP-015',
    description: 'Planta purificadora con espatas blancas.',
    price: 550, stock: 18, has_variants: false, status: 'publicado', category: findCat(3), tags: [findTag(7)],
    image: 'https://picsum.photos/seed/esp1/600/600',
    specifications: [{ key: 'Beneficio', value: 'Purifica aire' }],
    care: CARE_PLANTS,
    images: [{ src: 'https://picsum.photos/seed/esp1/600/600', alt: 'Espatifilo 1', is_primary: true }, { src: 'https://picsum.photos/seed/esp2/600/600', alt: 'Espatifilo 2', is_primary: false }, { src: 'https://picsum.photos/seed/esp3/600/600', alt: 'Espatifilo 3', is_primary: false }],
    occasions: [findOcc(6)], allow_photo: false
  },

  // PAQUETES (4 más)
  {
    id: 17, name: 'Girasoles y Bombones', slug: 'girasoles-bombones', code: 'PAQ-CEL-017',
    description: 'Arreglo de girasoles con caja de chocolates belgas.',
    price: 1100, stock: 12, has_variants: false, status: 'publicado', category: findCat(4), tags: [findTag(7)],
    image: 'https://picsum.photos/seed/pcel1/600/600',
    specifications: [{ key: 'Incluye', value: '6 Girasoles + Chocolates' }],
    care: CARE_FLOWERS,
    images: [{ src: 'https://picsum.photos/seed/pcel1/600/600', alt: 'Girasol Choc 1', is_primary: true }, { src: 'https://picsum.photos/seed/pcel2/600/600', alt: 'Girasol Choc 2', is_primary: false }, { src: 'https://picsum.photos/seed/pcel3/600/600', alt: 'Girasol Choc 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 18, name: 'Tulipanes y Vino', slug: 'tulipanes-vino', code: 'PAQ-BRI-018',
    description: 'Ramo de tulipanes con botella de vino tinto.',
    price: 1680, stock: 8, has_variants: false, status: 'publicado', category: findCat(4), tags: [findTag(4)],
    image: 'https://picsum.photos/seed/pbri1/600/600',
    specifications: [{ key: 'Incluye', value: '10 Tulipanes + Vino Tinto' }],
    care: 'Mantener tulipanes en agua fría.',
    images: [{ src: 'https://picsum.photos/seed/pbri1/600/600', alt: 'Vino 1', is_primary: true }, { src: 'https://picsum.photos/seed/pbri2/600/600', alt: 'Vino 2', is_primary: false }, { src: 'https://picsum.photos/seed/pbri3/600/600', alt: 'Vino 3', is_primary: false }],
    occasions: [findOcc(2)], allow_photo: false
  },
  {
    id: 19, name: 'Mix Floral y Globos', slug: 'mix-globos', code: 'PAQ-GLO-019',
    description: 'Arreglo mixto con set de 3 globos de helio.',
    price: 950, stock: 15, has_variants: false, status: 'publicado', category: findCat(4), tags: [findTag(5)],
    image: 'https://picsum.photos/seed/pglo1/600/600',
    specifications: [{ key: 'Incluye', value: 'Arreglo + 3 Globos' }],
    care: CARE_FLOWERS,
    images: [{ src: 'https://picsum.photos/seed/pglo1/600/600', alt: 'Globo 1', is_primary: true }, { src: 'https://picsum.photos/seed/pglo2/600/600', alt: 'Globo 2', is_primary: false }, { src: 'https://picsum.photos/seed/pglo3/600/600', alt: 'Globo 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 20, name: 'Kit Bienvenida Bebé', slug: 'kit-bebe', code: 'PAQ-NAC-020',
    description: 'Flores blancas, peluche y globo temático.',
    price: 1400, stock: 6, has_variants: false, status: 'publicado', category: findCat(4), tags: [findTag(2)],
    image: 'https://picsum.photos/seed/pnac1/600/600',
    specifications: [{ key: 'Temática', value: 'Nacimiento' }],
    care: CARE_FLOWERS,
    images: [{ src: 'https://picsum.photos/seed/pnac1/600/600', alt: 'Bebé 1', is_primary: true }, { src: 'https://picsum.photos/seed/pnac2/600/600', alt: 'Bebé 2', is_primary: false }, { src: 'https://picsum.photos/seed/pnac3/600/600', alt: 'Bebé 3', is_primary: false }],
    occasions: [findOcc(5)], allow_photo: false
  },

  // PELUCHES (4 más)
  {
    id: 22, name: 'Panda con Corazón', slug: 'panda-corazon', code: 'COM-PEL-022',
    description: 'Panda de peluche con corazón rojo.',
    price: 450, stock: 20, has_variants: false, status: 'publicado', category: findCat(11), tags: [],
    image: 'https://picsum.photos/seed/panda1/600/600',
    specifications: [{ key: 'Tamaño', value: '45cm' }],
    care: 'Limpiar con trapo húmedo.',
    images: [{ src: 'https://picsum.photos/seed/panda1/600/600', alt: 'Panda 1', is_primary: true }, { src: 'https://picsum.photos/seed/panda2/600/600', alt: 'Panda 2', is_primary: false }, { src: 'https://picsum.photos/seed/panda3/600/600', alt: 'Panda 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 23, name: 'Conejito Blanco', slug: 'conejito-blanco', code: 'COM-PEL-023',
    description: 'Conejo de felpa extra suave.',
    price: 380, stock: 15, has_variants: false, status: 'publicado', category: findCat(11), tags: [],
    image: 'https://picsum.photos/seed/rabbit1/600/600',
    specifications: [{ key: 'Hipoalergénico', value: 'Sí' }],
    care: 'Lavado a mano.',
    images: [{ src: 'https://picsum.photos/seed/rabbit1/600/600', alt: 'Conejo 1', is_primary: true }, { src: 'https://picsum.photos/seed/rabbit2/600/600', alt: 'Conejo 2', is_primary: false }, { src: 'https://picsum.photos/seed/rabbit3/600/600', alt: 'Conejo 3', is_primary: false }],
    occasions: [findOcc(5)], allow_photo: false
  },
  {
    id: 24, name: 'Unicornio Mágico', slug: 'unicornio-magico', code: 'COM-PEL-024',
    description: 'Unicornio con detalles brillantes.',
    price: 550, stock: 12, has_variants: false, status: 'publicado', category: findCat(11), tags: [],
    image: 'https://picsum.photos/seed/uni1/600/600',
    specifications: [{ key: 'Acabado', value: 'Brillante' }],
    care: 'No mojar el cuerno.',
    images: [{ src: 'https://picsum.photos/seed/uni1/600/600', alt: 'Uni 1', is_primary: true }, { src: 'https://picsum.photos/seed/uni2/600/600', alt: 'Uni 2', is_primary: false }, { src: 'https://picsum.photos/seed/uni3/600/600', alt: 'Uni 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 25, name: 'León Safari', slug: 'leon-safari', code: 'COM-PEL-025',
    description: 'León amigable de melena esponjosa.',
    price: 420, stock: 8, has_variants: false, status: 'publicado', category: findCat(11), tags: [],
    image: 'https://picsum.photos/seed/lion1/600/600',
    specifications: [{ key: 'Colección', value: 'Safari' }],
    care: 'Cepillar melena.',
    images: [{ src: 'https://picsum.photos/seed/lion1/600/600', alt: 'León 1', is_primary: true }, { src: 'https://picsum.photos/seed/lion2/600/600', alt: 'León 2', is_primary: false }, { src: 'https://picsum.photos/seed/lion3/600/600', alt: 'León 3', is_primary: false }],
    occasions: [], allow_photo: false
  },

  // GLOBOS (5)
  {
    id: 26, name: 'Bouquet Cumpleaños', slug: 'bouquet-cumple', code: 'COM-GLO-026',
    description: 'Set de 5 globos con helio.',
    price: 350, stock: 50, has_variants: false, status: 'publicado', category: findCat(12), tags: [],
    image: 'https://picsum.photos/seed/ball1/600/600',
    specifications: [{ key: 'Gas', value: 'Helio' }],
    care: 'Evitar calor extremo.',
    images: [{ src: 'https://picsum.photos/seed/ball1/600/600', alt: 'Globo 1', is_primary: true }, { src: 'https://picsum.photos/seed/ball2/600/600', alt: 'Globo 2', is_primary: false }, { src: 'https://picsum.photos/seed/ball3/600/600', alt: 'Globo 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 27, name: 'Número Metálico', slug: 'globo-numero', code: 'COM-GLO-027',
    description: 'Globo de número gigante dorado.',
    price: 280, stock: 100, has_variants: false, status: 'publicado', category: findCat(12), tags: [],
    image: 'https://picsum.photos/seed/num1/600/600',
    specifications: [{ key: 'Tamaño', value: '1 metro' }],
    care: 'No soltar al aire.',
    images: [{ src: 'https://picsum.photos/seed/num1/600/600', alt: 'Num 1', is_primary: true }, { src: 'https://picsum.photos/seed/num2/600/600', alt: 'Num 2', is_primary: false }, { src: 'https://picsum.photos/seed/num3/600/600', alt: 'Num 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },
  {
    id: 28, name: 'Globo Amor Eterno', slug: 'globo-amor', code: 'COM-GLO-028',
    description: 'Corazón metálico con mensaje.',
    price: 150, stock: 60, has_variants: false, status: 'publicado', category: findCat(12), tags: [],
    image: 'https://picsum.photos/seed/love1/600/600',
    specifications: [{ key: 'Forma', value: 'Corazón' }],
    care: 'Uso interior.',
    images: [{ src: 'https://picsum.photos/seed/love1/600/600', alt: 'Love 1', is_primary: true }, { src: 'https://picsum.photos/seed/love2/600/600', alt: 'Love 2', is_primary: false }, { src: 'https://picsum.photos/seed/love3/600/600', alt: 'Love 3', is_primary: false }],
    occasions: [findOcc(3)], allow_photo: false
  },
  {
    id: 29, name: 'Estrellas Doradas', slug: 'globos-estrellas', code: 'COM-GLO-029',
    description: 'Set de 3 estrellas metálicas.',
    price: 220, stock: 45, has_variants: false, status: 'publicado', category: findCat(12), tags: [],
    image: 'https://picsum.photos/seed/star1/600/600',
    specifications: [{ key: 'Cantidad', value: '3 pzas' }],
    care: 'No mojar.',
    images: [{ src: 'https://picsum.photos/seed/star1/600/600', alt: 'Star 1', is_primary: true }, { src: 'https://picsum.photos/seed/star2/600/600', alt: 'Star 2', is_primary: false }, { src: 'https://picsum.photos/seed/star3/600/600', alt: 'Star 3', is_primary: false }],
    occasions: [findOcc(2)], allow_photo: false
  },
  {
    id: 30, name: 'Globo Personaje', slug: 'globo-personaje', code: 'COM-GLO-030',
    description: 'Globo con forma de personaje.',
    price: 180, stock: 30, has_variants: false, status: 'publicado', category: findCat(12), tags: [],
    image: 'https://picsum.photos/seed/char1/600/600',
    specifications: [{ key: 'Licencia', value: 'Original' }],
    care: 'Mantener lejos de objetos punzantes.',
    images: [{ src: 'https://picsum.photos/seed/char1/600/600', alt: 'Char 1', is_primary: true }, { src: 'https://picsum.photos/seed/char2/600/600', alt: 'Char 2', is_primary: false }, { src: 'https://picsum.photos/seed/char3/600/600', alt: 'Char 3', is_primary: false }],
    occasions: [findOcc(1)], allow_photo: false
  },

  // CHOCOLATES (5)
  {
    id: 31, name: 'Trufas de Licor', slug: 'trufas-licor', code: 'COM-CHOC-031',
    description: 'Trufas artesanales rellenas de tequila.',
    price: 580, stock: 20, has_variants: false, status: 'publicado', category: findCat(13), tags: [],
    image: 'https://picsum.photos/seed/trufa1/600/600',
    specifications: [{ key: 'Contenido', value: '12 pzas' }],
    care: 'Lugar fresco y seco.',
    images: [{ src: 'https://picsum.photos/seed/trufa1/600/600', alt: 'Trufa 1', is_primary: true }, { src: 'https://picsum.photos/seed/trufa2/600/600', alt: 'Trufa 2', is_primary: false }, { src: 'https://picsum.photos/seed/trufa3/600/600', alt: 'Trufa 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 32, name: 'Bombones Suizos', slug: 'bombones-suizos', code: 'COM-CHOC-032',
    description: 'Caja premium de bombones variados.',
    price: 420, stock: 35, has_variants: false, status: 'publicado', category: findCat(13), tags: [],
    image: 'https://picsum.photos/seed/choc1/600/600',
    specifications: [{ key: 'Origen', value: 'Suiza' }],
    care: 'No refrigerar.',
    images: [{ src: 'https://picsum.photos/seed/choc1/600/600', alt: 'Choc 1', is_primary: true }, { src: 'https://picsum.photos/seed/choc2/600/600', alt: 'Choc 2', is_primary: false }, { src: 'https://picsum.photos/seed/choc3/600/600', alt: 'Choc 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 33, name: 'Barra de Chocolate 70%', slug: 'barra-70', code: 'COM-CHOC-033',
    description: 'Barra de chocolate oscuro artesanal.',
    price: 180, stock: 50, has_variants: false, status: 'publicado', category: findCat(13), tags: [],
    image: 'https://picsum.photos/seed/bar1/600/600',
    specifications: [{ key: 'Cacao', value: '70%' }],
    care: 'Mantener tapado.',
    images: [{ src: 'https://picsum.photos/seed/bar1/600/600', alt: 'Barra 1', is_primary: true }, { src: 'https://picsum.photos/seed/bar2/600/600', alt: 'Barra 2', is_primary: false }, { src: 'https://picsum.photos/seed/bar3/600/600', alt: 'Barra 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 34, name: 'Macarrones Franceses', slug: 'macarrones', code: 'COM-CHOC-034',
    description: 'Set de 8 macarrones de sabores.',
    price: 390, stock: 12, has_variants: false, status: 'publicado', category: findCat(13), tags: [],
    image: 'https://picsum.photos/seed/mac1/600/600',
    specifications: [{ key: 'Sabores', value: 'Variados' }],
    care: 'Consumir pronto.',
    images: [{ src: 'https://picsum.photos/seed/mac1/600/600', alt: 'Mac 1', is_primary: true }, { src: 'https://picsum.photos/seed/mac2/600/600', alt: 'Mac 2', is_primary: false }, { src: 'https://picsum.photos/seed/mac3/600/600', alt: 'Mac 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 35, name: 'Dulces Regionales', slug: 'dulces-regionales', code: 'COM-CHOC-035',
    description: 'Dulces típicos de Tequila.',
    price: 480, stock: 15, has_variants: false, status: 'publicado', category: findCat(13), tags: [],
    image: 'https://picsum.photos/seed/mex1/600/600',
    specifications: [{ key: 'Tipo', value: 'Artesanal' }],
    care: 'Consumir en 1 mes.',
    images: [{ src: 'https://picsum.photos/seed/mex1/600/600', alt: 'Mex 1', is_primary: true }, { src: 'https://picsum.photos/seed/mex2/600/600', alt: 'Mex 2', is_primary: false }, { src: 'https://picsum.photos/seed/mex3/600/600', alt: 'Mex 3', is_primary: false }],
    occasions: [], allow_photo: false
  },

  // VINOS (5)
  {
    id: 36, name: 'Tequila Reposado', slug: 'tequila-reserva', code: 'COM-VIN-036',
    description: 'Tequila reposado 100% agave.',
    price: 1100, stock: 10, has_variants: false, status: 'publicado', category: findCat(14), tags: [],
    image: 'https://picsum.photos/seed/teq1/600/600',
    specifications: [{ key: 'Volumen', value: '750ml' }],
    care: 'Lugar fresco.',
    images: [{ src: 'https://picsum.photos/seed/teq1/600/600', alt: 'Teq 1', is_primary: true }, { src: 'https://picsum.photos/seed/teq2/600/600', alt: 'Teq 2', is_primary: false }, { src: 'https://picsum.photos/seed/teq3/600/600', alt: 'Teq 3', is_primary: false }],
    occasions: [findOcc(2)], allow_photo: false
  },
  {
    id: 37, name: 'Mezcal Joven', slug: 'mezcal-artesanal', code: 'COM-VIN-037',
    description: 'Mezcal ahumado tradicional.',
    price: 950, stock: 8, has_variants: false, status: 'publicado', category: findCat(14), tags: [],
    image: 'https://picsum.photos/seed/mez1/600/600',
    specifications: [{ key: 'Agave', value: 'Espadín' }],
    care: 'Evitar luz solar.',
    images: [{ src: 'https://picsum.photos/seed/mez1/600/600', alt: 'Mez 1', is_primary: true }, { src: 'https://picsum.photos/seed/mez2/600/600', alt: 'Mez 2', is_primary: false }, { src: 'https://picsum.photos/seed/mez3/600/600', alt: 'Mez 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 38, name: 'Vino Rosado', slug: 'vino-rosado-espumoso', code: 'COM-VIN-038',
    description: 'Vino rosado refrescante.',
    tag_visible: 'OFERTA',
    price: 680, sale_price: 550, stock: 15, has_variants: false, status: 'publicado', category: findCat(14), tags: [],
    image: 'https://picsum.photos/seed/ros1/600/600',
    specifications: [{ key: 'Uva', value: 'Garnacha' }],
    care: 'Servir frío.',
    images: [{ src: 'https://picsum.photos/seed/ros1/600/600', alt: 'Ros 1', is_primary: true }, { src: 'https://picsum.photos/seed/ros2/600/600', alt: 'Ros 2', is_primary: false }, { src: 'https://picsum.photos/seed/ros3/600/600', alt: 'Ros 3', is_primary: false }],
    occasions: [findOcc(3)], allow_photo: false
  },
  {
    id: 39, name: 'Champagne Moët', slug: 'champagne-premium', code: 'COM-VIN-039',
    description: 'Champagne premium para celebrar.',
    price: 1850, stock: 5, has_variants: false, status: 'publicado', category: findCat(14), tags: [],
    image: 'https://picsum.photos/seed/cha1/600/600',
    specifications: [{ key: 'Tipo', value: 'Brut' }],
    care: 'Mantener en cava.',
    images: [{ src: 'https://picsum.photos/seed/cha1/600/600', alt: 'Cha 1', is_primary: true }, { src: 'https://picsum.photos/seed/cha2/600/600', alt: 'Cha 2', is_primary: false }, { src: 'https://picsum.photos/seed/cha3/600/600', alt: 'Cha 3', is_primary: false }],
    occasions: [findOcc(2)], allow_photo: false
  },
  {
    id: 40, name: 'Vino Tinto Reserva', slug: 'vino-reserva', code: 'COM-VIN-040',
    description: 'Vino tinto elegante.',
    price: 540, stock: 25, has_variants: false, status: 'publicado', category: findCat(14), tags: [],
    image: 'https://picsum.photos/seed/tin1/600/600',
    specifications: [{ key: 'Barrica', value: '12 meses' }],
    care: 'Temperatura ambiente.',
    images: [{ src: 'https://picsum.photos/seed/tin1/600/600', alt: 'Tin 1', is_primary: true }, { src: 'https://picsum.photos/seed/tin2/600/600', alt: 'Tin 2', is_primary: false }, { src: 'https://picsum.photos/seed/tin3/600/600', alt: 'Tin 3', is_primary: false }],
    occasions: [], allow_photo: false
  },

  // CAJAS (5)
  {
    id: 41, name: 'Caja Terciopelo Rosa', slug: 'caja-terciopelo-rosa', code: 'COM-CAJA-041',
    description: 'Caja de presentación premium.',
    price: 450, stock: 20, has_variants: false, status: 'publicado', category: findCat(15), tags: [],
    image: 'https://picsum.photos/seed/crosa1/600/600',
    specifications: [{ key: 'Material', value: 'Terciopelo' }],
    care: 'No mojar.',
    images: [{ src: 'https://picsum.photos/seed/crosa1/600/600', alt: 'Caja 1', is_primary: true }, { src: 'https://picsum.photos/seed/crosa2/600/600', alt: 'Caja 2', is_primary: false }, { src: 'https://picsum.photos/seed/crosa3/600/600', alt: 'Caja 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 42, name: 'Caja Madera Rústica', slug: 'caja-madera-pino', code: 'COM-CAJA-042',
    description: 'Caja artesanal de madera.',
    price: 320, stock: 30, has_variants: false, status: 'publicado', category: findCat(15), tags: [],
    image: 'https://picsum.photos/seed/cmad1/600/600',
    specifications: [{ key: 'Material', value: 'Pino' }],
    care: 'Mantener seco.',
    images: [{ src: 'https://picsum.photos/seed/cmad1/600/600', alt: 'Madera 1', is_primary: true }, { src: 'https://picsum.photos/seed/cmad2/600/600', alt: 'Madera 2', is_primary: false }, { src: 'https://picsum.photos/seed/cmad3/600/600', alt: 'Madera 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 43, name: 'Caja Dorada Lujo', slug: 'caja-dorada-premium', code: 'COM-CAJA-043',
    description: 'Caja metálica dorada.',
    tag_visible: 'NUEVO',
    price: 550, stock: 10, has_variants: false, status: 'publicado', category: findCat(15), tags: [],
    image: 'https://picsum.photos/seed/cgold1/600/600',
    specifications: [{ key: 'Acabado', value: 'Espejo' }],
    care: 'Limpiar huellas.',
    images: [{ src: 'https://picsum.photos/seed/cgold1/600/600', alt: 'Gold 1', is_primary: true }, { src: 'https://picsum.photos/seed/cgold2/600/600', alt: 'Gold 2', is_primary: false }, { src: 'https://picsum.photos/seed/cgold3/600/600', alt: 'Gold 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 44, name: 'Caja Hexagonal Negra', slug: 'caja-hexagonal-mate', code: 'COM-CAJA-044',
    description: 'Diseño geométrico moderno.',
    price: 380, stock: 15, has_variants: false, status: 'publicado', category: findCat(15), tags: [],
    image: 'https://picsum.photos/seed/chex1/600/600',
    specifications: [{ key: 'Forma', value: 'Hexágono' }],
    care: 'No exponer a humedad.',
    images: [{ src: 'https://picsum.photos/seed/chex1/600/600', alt: 'Hex 1', is_primary: true }, { src: 'https://picsum.photos/seed/chex2/600/600', alt: 'Hex 2', is_primary: false }, { src: 'https://picsum.photos/seed/chex3/600/600', alt: 'Hex 3', is_primary: false }],
    occasions: [], allow_photo: false
  },
  {
    id: 45, name: 'Caja Vintage Maleta', slug: 'caja-vintage-viajero', code: 'COM-CAJA-045',
    description: 'Caja decorativa estilo maleta antigua.',
    price: 520, stock: 12, has_variants: false, status: 'publicado', category: findCat(15), tags: [],
    image: 'https://picsum.photos/seed/cvin1/600/600',
    specifications: [{ key: 'Estilo', value: 'Europeo' }],
    care: 'Limpiar herrajes.',
    images: [{ src: 'https://picsum.photos/seed/cvin1/600/600', alt: 'Vin 1', is_primary: true }, { src: 'https://picsum.photos/seed/cvin2/600/600', alt: 'Vin 2', is_primary: false }, { src: 'https://picsum.photos/seed/cvin3/600/600', alt: 'Vin 3', is_primary: false }],
    occasions: [], allow_photo: false
  }
].map(p => ({ 
    ...p, 
    is_deleted: false, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString() 
}));

const globalForProducts = global as unknown as { allProducts: Product[] };
export const allProducts = globalForProducts.allProducts || initialProducts;

if (process.env.NODE_ENV !== 'production') {
  globalForProducts.allProducts = allProducts;
}
