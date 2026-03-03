import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary/20 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-[2rem] bg-background border border-border/50 shadow-sm p-8 md:p-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle className="w-9 h-9" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Pago cancelado</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              No se realizó ningún cobro. Puedes revisar tu carrito y volver a intentar cuando quieras.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="h-12 rounded-xl font-bold">
                <Link href="/checkout"><ArrowLeft className="w-4 h-4 mr-2" /> Regresar al checkout</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl font-bold">
                <Link href="/cart"><ShoppingCart className="w-4 h-4 mr-2" /> Ver carrito</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
