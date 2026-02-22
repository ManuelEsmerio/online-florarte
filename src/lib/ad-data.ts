
export interface Ad {
  title: string;
  buttonText: string;
  imageUrl: string;
  href: string;
  imageHint: string;
  size: 'single' | 'double';
}

export const adData: Ad[] = [
  {
    title: 'HAZ DE SU CUMPLEAÑOS UNO INOLVIDABLE',
    buttonText: 'Ver regalos',
    imageUrl: 'https://placehold.co/800x400.png',
    href: '/categories/paquetes',
    imageHint: 'birthday celebration flowers',
    size: 'double',
  },
  {
    title: 'FLORES FRESCAS CADA SEMANA',
    buttonText: 'Suscríbete',
    imageUrl: 'https://placehold.co/400x500.png',
    href: '/contact',
    imageHint: 'flower subscription box',
    size: 'single',
  },
  {
    title: 'ENVÍO GRATIS EN TEQUILA, JALISCO',
    buttonText: 'Compra ahora',
    imageUrl: 'https://placehold.co/800x400.png',
    href: '/products/all',
    imageHint: 'delivery truck flowers',
    size: 'double',
  },
];
