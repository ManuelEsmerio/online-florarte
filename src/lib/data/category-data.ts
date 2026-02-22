
import type { ProductCategory } from '@/lib/definitions';

export const allCategories: ProductCategory[] = [
  {
    id: 1,
    name: 'Arreglos Florales',
    description: 'Composiciones frescas y elegantes para toda ocasión.',
    image: '/images/categories/arreglos.jpg',
  },
  {
    id: 2,
    name: 'Ramos de Rosas',
    description: 'Clásicos y apasionados ramos de rosas rojas, blancas y de colores.',
    image: '/images/categories/ramos.jpg',
  },
  {
    id: 3,
    name: 'Peluches y Regalos',
    description: 'Acompañamientos perfectos para tus flores.',
    image: '/images/categories/peluches.jpg',
  },
  {
    id: 4,
    name: 'Ocasiones Especiales',
    description: 'Encuentra el regalo perfecto para cumpleaños, aniversarios y más.',
    image: '/images/categories/ocasiones.jpg',
  },
];
