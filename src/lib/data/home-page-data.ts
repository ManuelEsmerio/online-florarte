
import { ProductCategory, Occasion } from '@/lib/definitions';

export const mockCategories: ProductCategory[] = [
  {
    id: 1,
    name: 'Ramos',
    slug: 'ramos',
    prefix: 'RAM',
    description: 'Ramos de flores para toda ocasión.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
  {
    id: 2,
    name: 'Arreglos Florales',
    slug: 'arreglos-florales',
    prefix: 'ARR',
    description: 'Arreglos florales para eventos especiales.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
  {
    id: 3,
    name: 'Plantas',
    slug: 'plantas',
    prefix: 'PLA',
    description: 'Plantas para decorar tu hogar u oficina.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
    {
    id: 4,
    name: 'Peluches',
    slug: 'peluches',
    prefix: 'PEL',
    description: 'Peluches para regalar.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
];

export const mockOccasions: Occasion[] = [
  {
    id: 1,
    name: 'Cumpleaños',
    slug: 'cumpleanos',
    description: 'Flores para cumpleaños.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
  {
    id: 2,
    name: 'Aniversario',
    slug: 'aniversario',
    description: 'Flores para aniversario.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
  {
    id: 3,
    name: 'Amor y Romance',
    slug: 'amor-y-romance',
    description: 'Flores para amor y romance.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
  {
    id: 4,
    name: 'Condolencias',
    slug: 'condolencias',
    description: 'Flores para condolencias.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
    {
    id: 5,
    name: 'Graduación',
    slug: 'graduacion',
    description: 'Flores para graduación.',
    image_url: '/placeholder.webp',
    show_on_home: true,
  },
];
