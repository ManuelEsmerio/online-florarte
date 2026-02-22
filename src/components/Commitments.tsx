// src/components/Commitments.tsx

import { Flower2, Truck, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const commitmentItems = [
  {
    icon: <Flower2 className="h-10 w-10 text-primary" />,
    title: 'Flores frescas todos los días',
    description: 'Preparamos cada arreglo con flores seleccionadas al momento, garantizando frescura y duración excepcional.',
  },
  {
    icon: <Truck className="h-10 w-10 text-primary" />,
    title: 'Envíos el mismo día',
    description: 'Haz tu pedido por la mañana y recíbelo en horas, con entregas rápidas y seguras en la zona metropolitana.',
  },
  {
    icon: <Gift className="h-10 w-10 text-primary" />,
    title: 'Más que flores, experiencias',
    description: 'Complementa tu detalle con chocolates, vinos, peluches y más, para crear momentos inolvidables.',
  },
];

export function Commitments() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-headline text-foreground">
            Compromisos
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {commitmentItems.map((item, index) => (
            <Card
              key={index}
              className="bg-card"
            >
              <CardContent className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 p-6">
                <div className="flex-shrink-0">{item.icon}</div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
