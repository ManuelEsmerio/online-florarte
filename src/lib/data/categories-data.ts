// src/lib/data/categories-data.ts
import type { ProductCategory } from '../definitions';

// Usamos `let` para que el array sea mutable en memoria por los repositorios mock.
export let productCategories: (ProductCategory & { is_deleted?: boolean, deleted_at?: string })[] = [
  // --- Categorías Principales ---
  { id: 1, name: 'Arreglos Florales', slug: 'arreglos-florales', prefix: 'ARR', description: 'Diseños únicos para toda ocasión.', imageUrl: '/placehold.webp', parentId: null, showOnHome: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: 'Ramos Florales', slug: 'ramos-florales', prefix: 'RAM', description: 'La forma clásica de regalar flores.', imageUrl: '/placehold.webp', parentId: null, showOnHome: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: 'Plantas', slug: 'plantas', prefix: 'PLA', description: 'Un regalo que perdura.', imageUrl: '/placehold.webp', parentId: null, showOnHome: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: 'Paquetes', slug: 'paquetes', prefix: 'PAQ', description: 'Combina flores con regalos especiales.', imageUrl: '/placehold.webp', parentId: null, showOnHome: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 5, name: 'Complementos', slug: 'complementos', prefix: 'COM', description: 'Añade un toque extra a tu regalo.', imageUrl: '/placehold.webp', parentId: null, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },

  // --- Subcategorías ---

  // Arreglos (Parent ID: 1)
  { id: 6, name: 'Arreglos de Rosas', slug: 'arreglos-rosas', prefix: 'ARR', description: 'Arreglos elegantes con las mejores rosas.', imageUrl: '/placehold.webp', parentId: 1, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 7, name: 'Arreglos de Girasoles', slug: 'arreglos-girasoles', prefix: 'ARR', description: 'Arreglos llenos de luz y alegría.', imageUrl: '/placehold.webp', parentId: 1, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  
  // Ramos (Parent ID: 2)
  { id: 8, name: 'Ramos de Rosas', slug: 'ramos-rosas', prefix: 'RAM', description: 'El clásico gesto de amor y amistad.', imageUrl: '/placehold.webp', parentId: 2, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 9, name: 'Ramos de Tulipanes', slug: 'ramos-tulipanes', prefix: 'RAM', description: 'Elegancia y sofisticación en un ramo.', imageUrl: '/placehold.webp', parentId: 2, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 10, name: 'Bouquets Mixtos', slug: 'bouquets-mixtos', prefix: 'RAM', description: 'Combinaciones creativas de flores de temporada.', imageUrl: '/placehold.webp', parentId: 2, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },

  // Complementos (Parent ID: 5)
  { id: 11, name: 'Peluches', slug: 'peluches', prefix: 'COM', description: 'Compañeros suaves y tiernos.', imageUrl: '/placehold.webp', parentId: 5, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 12, name: 'Globos', slug: 'globos', prefix: 'COM', description: 'Un toque festivo para cualquier regalo.', imageUrl: '/placehold.webp', parentId: 5, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 13, name: 'Chocolates y Dulces', slug: 'chocolates-dulces', prefix: 'CHOC', description: 'Endulza su día con lo mejor.', imageUrl: '/placehold.webp', parentId: 5, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 14, name: 'Vinos y Licores', slug: 'vinos-licores', prefix: 'VINO', description: 'Para un brindis especial.', imageUrl: '/placehold.webp', parentId: 5, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 15, name: 'Cajas Decorativas', slug: 'cajas-decorativas', prefix: 'CAJA', description: 'Presentación de lujo para tu regalo.', imageUrl: '/placehold.webp', parentId: 5, showOnHome: false, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
];
