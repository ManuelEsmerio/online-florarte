
export interface BlogPost {
  title: string;
  slug: string;
  date: Date;
  category: string;
  image: string;
  excerpt: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    title: 'Guía Completa para el Cuidado de Flores en Casa',
    slug: 'cuidado-de-flores-en-casa',
    date: new Date('2024-07-20'),
    category: 'Consejos',
    image: 'https://placehold.co/800x450.png',
    excerpt: 'Aprende los secretos para que tus arreglos florales duren más tiempo frescos y vibrantes. Te damos los mejores consejos, desde el corte de tallos hasta la ubicación ideal.',
    content: `
      <h2 class="text-2xl font-bold mb-4">Mantén tus Flores Frescas por Más Tiempo</h2>
      <p class="mb-4">Recibir flores es un gesto hermoso, y con el cuidado adecuado, puedes disfrutar de su belleza durante muchos días. Aquí tienes una guía paso a paso para cuidar tus arreglos florales como un profesional.</p>
      <h3 class="text-xl font-bold mb-2">1. Prepara tu Jarrón</h3>
      <p class="mb-4">Antes de colocar las flores, asegúrate de que el jarrón esté perfectamente limpio para evitar bacterias. Llénalo con agua fresca a temperatura ambiente y añade el alimento para flores que suele venir con tu arreglo.</p>
      <h3 class="text-xl font-bold mb-2">2. El Corte es Clave</h3>
      <p class="mb-4">Usa unas tijeras de podar limpias o un cuchillo afilado para cortar aproximadamente 2-3 cm de la parte inferior de cada tallo. Haz el corte en un ángulo de 45 grados. Esto aumenta la superficie de absorción de agua.</p>
      <h3 class="text-xl font-bold mb-2">3. Retira las Hojas Inferiores</h3>
      <p class="mb-4">Quita todas las hojas que quedarían sumergidas en el agua del jarrón. Las hojas en descomposición pueden contaminar el agua y acortar la vida de tus flores.</p>
      <h3 class="text-xl font-bold mb-2">4. Ubicación, Ubicación, Ubicación</h3>
      <p class="mb-4">Coloca tu arreglo en un lugar fresco, alejado de la luz solar directa, fuentes de calor (como radiadores o electrodomésticos) y corrientes de aire. También es importante mantenerlas lejos de fruteros, ya que la fruta madura emite gas etileno, que puede hacer que las flores se marchiten más rápido.</p>
      <h3 class="text-xl font-bold mb-2">5. Mantenimiento Diario</h3>
      <p>Cambia el agua cada dos días y vuelve a cortar los tallos. Si el agua se ve turbia, cámbiala inmediatamente. Esto asegurará que tus flores siempre tengan agua fresca para beber.</p>
    `
  },
  {
    title: 'El Significado de las Flores: ¿Qué Dice tu Ramo?',
    slug: 'significado-de-las-flores',
    date: new Date('2024-07-15'),
    category: 'Inspiración',
    image: 'https://placehold.co/800x450.png',
    excerpt: 'Las flores tienen su propio lenguaje. Descubre el significado detrás de las flores más populares y elige el ramo perfecto para transmitir tu mensaje sin decir una palabra.',
    content: `
      <h2 class="text-2xl font-bold mb-4">El Lenguaje Secreto de las Flores</h2>
      <p class="mb-4">Desde la época victoriana, las flores se han utilizado para enviar mensajes codificados. Conocer el simbolismo de cada flor puede añadir una capa extra de significado a tu regalo. Aquí te desvelamos algunos de los más populares:</p>
      <ul class="list-disc pl-6 space-y-4">
        <li><strong>Rosas Rojas:</strong> El símbolo universal del amor y la pasión. Perfectas para aniversarios y declaraciones románticas.</li>
        <li><strong>Girasoles:</strong> Representan la felicidad, la vitalidad y la adoración. Son ideales para desearle a alguien un buen día o para celebrar un logro.</li>
        <li><strong>Lirios Blancos:</strong> Simbolizan la pureza, la inocencia y la majestuosidad. Son una elección elegante para bodas y para expresar condolencias.</li>
        <li><strong>Tulipanes:</strong> Generalmente representan el amor perfecto. Los tulipanes rojos se asocian con el amor verdadero, mientras que los amarillos simbolizan pensamientos alegres.</li>
        <li><strong>Orquídeas:</strong> Representan la belleza exótica, el lujo y la fuerza. Son un regalo sofisticado y duradero.</li>
      </ul>
      <p class="mt-6">La próxima vez que elijas un ramo, piensa en el mensaje que quieres enviar. ¡Las flores correctas pueden hablar directamente al corazón!</p>
    `
  },
  {
    title: '5 Ocasiones Perfectas para Regalar Flores',
    slug: 'ocasiones-para-regalar-flores',
    date: new Date('2024-07-10'),
    category: 'Ideas',
    image: 'https://placehold.co/800x450.png',
    excerpt: 'Más allá de los cumpleaños y aniversarios, hay muchos momentos en la vida que se pueden celebrar con flores. Te damos 5 ideas para sorprender a alguien especial.',
    content: `
      <h2 class="text-2xl font-bold mb-4">Cualquier Momento es Bueno para Regalar Alegría</h2>
      <p class="mb-4">Las flores son un regalo maravilloso que puede iluminar el día de cualquiera. Aunque son un clásico en cumpleaños y aniversarios, aquí tienes otras cinco ocasiones en las que un ramo puede ser el detalle perfecto:</p>
      <ol class="list-decimal pl-6 space-y-4">
        <li><strong>Para dar las gracias:</strong> ¿Alguien te ha ayudado o ha tenido un detalle contigo? Un pequeño ramo es una forma hermosa y sincera de decir "gracias".</li>
        <li><strong>Para celebrar un ascenso o un nuevo trabajo:</strong> Un nuevo logro profesional merece una celebración. Un arreglo floral puede decorar su nuevo espacio de trabajo y recordarles su éxito.</li>
        <li><strong>Simplemente porque sí:</strong> No necesitas una razón para hacer sonreír a alguien. Un ramo inesperado "solo porque pensé en ti" es uno de los regalos más memorables que se pueden recibir.</li>
        <li><strong>Para animar a alguien:</strong> Si un amigo o familiar está pasando por un mal momento, las flores pueden aportar un toque de luz y color a su día, recordándoles que te importan.</li>
        <li><strong>Como bienvenida a un nuevo hogar:</strong> Unas flores o una planta son el regalo perfecto para inaugurar una casa, aportando vida y calidez al nuevo espacio.</li>
      </ol>
    `
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
