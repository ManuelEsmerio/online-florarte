// src/lib/data/categories-data.ts
import type { ProductCategory } from '../definitions';

// Usamos `let` para que el array sea mutable en memoria por los repositorios mock.
export let productCategories: (ProductCategory & { is_deleted?: boolean, deleted_at?: string })[] = [
  // --- Categorías Principales ---
  { id: 1, name: 'Arreglos Florales', slug: 'arreglos-florales', prefix: 'ARR', description: 'Diseños únicos para toda ocasión.', image_url: 'images/categories/1/placeholder.webp', parent_id: null, show_on_home: true },
  { id: 2, name: 'Ramos Florales', slug: 'ramos-florales', prefix: 'RAM', description: 'La forma clásica de regalar flores.', image_url: 'images/categories/2/placeholder.webp', parent_id: null, show_on_home: true },
  { id: 3, name: 'Plantas', slug: 'plantas', prefix: 'PLA', description: 'Un regalo que perdura.', image_url: 'images/categories/3/placeholder.webp', parent_id: null, show_on_home: true },
  { id: 4, name: 'Paquetes', slug: 'paquetes', prefix: 'PAQ', description: 'Combina flores con regalos especiales.', image_url: 'images/categories/4/placeholder.webp', parent_id: null, show_on_home: true },
  { id: 5, name: 'Complementos', slug: 'complementos', prefix: 'COM', description: 'Añade un toque extra a tu regalo.', image_url: 'images/categories/5/placeholder.webp', parent_id: null, show_on_home: false },

  // --- Subcategorías ---

  // Arreglos (Parent ID: 1)
  { id: 6, name: 'Arreglos de Rosas', slug: 'arreglos-rosas', prefix: 'ARR', description: 'Arreglos elegantes con las mejores rosas.', image_url: 'images/categories/6/placeholder.webp', parent_id: 1, show_on_home: false },
  { id: 7, name: 'Arreglos de Girasoles', slug: 'arreglos-girasoles', prefix: 'ARR', description: 'Arreglos llenos de luz y alegría.', image_url: 'images/categories/7/placeholder.webp', parent_id: 1, show_on_home: false },
  
  // Ramos (Parent ID: 2)
  { id: 8, name: 'Ramos de Rosas', slug: 'ramos-rosas', prefix: 'RAM', description: 'El clásico gesto de amor y amistad.', image_url: 'images/categories/8/placeholder.webp', parent_id: 2, show_on_home: false },
  { id: 9, name: 'Ramos de Tulipanes', slug: 'ramos-tulipanes', prefix: 'RAM', description: 'Elegancia y sofisticación en un ramo.', image_url: 'images/categories/9/placeholder.webp', parent_id: 2, show_on_home: false },
  { id: 10, name: 'Bouquets Mixtos', slug: 'bouquets-mixtos', prefix: 'RAM', description: 'Combinaciones creativas de flores de temporada.', image_url: 'images/categories/10/placeholder.webp', parent_id: 2, show_on_home: false },

  // Complementos (Parent ID: 5)
  { id: 11, name: 'Peluches', slug: 'peluches', prefix: 'COM', description: 'Compañeros suaves y tiernos.', image_url: 'images/categories/11/placeholder.webp', parent_id: 5, show_on_home: false },
  { id: 12, name: 'Globos', slug: 'globos', prefix: 'COM', description: 'Un toque festivo para cualquier regalo.', image_url: 'images/categories/12/placeholder.webp', parent_id: 5, show_on_home: false },
  { id: 13, name: 'Chocolates y Dulces', slug: 'chocolates-dulces', prefix: 'CHOC', description: 'Endulza su día con lo mejor.', image_url: 'images/categories/13/placeholder.webp', parent_id: 5, show_on_home: false },
  { id: 14, name: 'Vinos y Licores', slug: 'vinos-licores', prefix: 'VINO', description: 'Para un brindis especial.', image_url: 'images/categories/14/placeholder.webp', parent_id: 5, show_on_home: false },
  { id: 15, name: 'Cajas Decorativas', slug: 'cajas-decorativas', prefix: 'CAJA', description: 'Presentación de lujo para tu regalo.', image_url: 'images/categories/15/placeholder.webp', parent_id: 5, show_on_home: false },
];
