// src/lib/data/occasion-data.ts
import type { Occasion } from '@/lib/definitions';

export let allOccasions: Occasion[] = [
  { id: 1, name: 'Cumpleaños', slug: 'cumpleanos', description: 'Celebra un año más de vida con flores.', showOnHome: true, imageUrl: '/placehold.webp', createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: 'Aniversario', slug: 'aniversario', description: 'Recuerda ese momento especial con un detalle inolvidable.', showOnHome: true, imageUrl: '/placehold.webp', createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: 'Amor', slug: 'amor', description: 'Expresa tus sentimientos con el lenguaje de las flores.', showOnHome: true, imageUrl: '/placehold.webp', createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: 'Graduación', slug: 'graduacion', description: 'Felicita por un logro alcanzado.', showOnHome: false, imageUrl: '/placehold.webp', createdAt: new Date(), updatedAt: new Date() },
  { id: 5, name: 'Nacimiento', slug: 'nacimiento', description: 'Da la bienvenida a un nuevo miembro de la familia.', showOnHome: true, imageUrl: '/placehold.webp', createdAt: new Date(), updatedAt: new Date() },
  { id: 6, name: 'Funeral', slug: 'funeral', description: 'Expresa tus condolencias con arreglos sobrios y elegantes.', showOnHome: false, imageUrl: '/placehold.webp', createdAt: new Date(), updatedAt: new Date() },
  { id: 7, name: 'San Valentín', slug: 'san-valentin', description: 'El día más romántico del año.', showOnHome: true, imageUrl: '/placehold.webp', createdAt: new Date(), updatedAt: new Date() },
];
