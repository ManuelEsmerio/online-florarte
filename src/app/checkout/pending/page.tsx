'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Clock, Package, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const orderId = useMemo(() => searchParams.get('order_id'), [searchParams]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary/20 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-[2rem] bg-background border border-border/50 shadow-sm p-8 md:p-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-9 h-9" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Pago en proceso</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Tu pago está siendo procesado. Esto puede tardar unos minutos dependiendo del método seleccionado.
              Te notificaremos por correo cuando se confirme.
            </p>

            {orderId && (
              <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 text-left text-sm space-y-2">
                <p><strong>Orden:</strong> ORD#{String(orderId).padStart(4, '0')}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user?.id && (
                <Button asChild className="h-12 rounded-xl font-bold">
                  <Link href="/orders"><Package className="w-4 h-4 mr-2" /> Ver mis pedidos</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="h-12 rounded-xl font-bold">
                <Link href="/"><Home className="w-4 h-4 mr-2" /> Ir al inicio</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
