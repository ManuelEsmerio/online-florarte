// src/lib/data/occasion-data.ts
import type { Occasion } from '@/lib/definitions';

export let allOccasions: Occasion[] = [
  { id: 1, name: 'Cumpleaños', slug: 'cumpleanos', description: 'Celebra un año más de vida con flores.', image_url: 'images/occasions/1/birthday.webp', show_on_home: true },
  { id: 2, name: 'Aniversario', slug: 'aniversario', description: 'Recuerda ese momento especial con un detalle inolvidable.', image_url: 'images/occasions/2/anniversary.webp', show_on_home: true },
  { id: 3, name: 'Amor', slug: 'amor', description: 'Expresa tus sentimientos con el lenguaje de las flores.', image_url: 'images/occasions/3/love.webp', show_on_home: true },
  { id: 4, name: 'Graduación', slug: 'graduacion', description: 'Felicita por un logro alcanzado.', image_url: 'images/occasions/4/graduation.webp', show_on_home: false },
  { id: 5, name: 'Nacimiento', slug: 'nacimiento', description: 'Da la bienvenida a un nuevo miembro de la familia.', image_url: 'images/occasions/5/new-baby.webp', show_on_home: true },
  { id: 6, name: 'Funeral', slug: 'funeral', description: 'Expresa tus condolencias con arreglos sobrios y elegantes.', image_url: 'images/occasions/6/funeral.webp', show_on_home: false },
  { id: 7, name: 'San Valentín', slug: 'san-valentin', description: 'El día más romántico del año.', image_url: 'images/occasions/7/san-valentin.webp', show_on_home: true },
];
