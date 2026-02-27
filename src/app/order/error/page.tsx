import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';

interface Props {
  searchParams: Promise<{ orderId?: string; reason?: string }>;
}

const REASON_MESSAGES: Record<string, string> = {
  payment_failed: 'El pago no pudo procesarse. No se realizó ningún cobro.',
  timeout:
    'No pudimos confirmar tu pago a tiempo. Si se realizó algún cargo, te contactaremos pronto.',
  missing_order: 'No se encontró información del pedido.',
};

export default async function OrderErrorPage({ searchParams }: Props) {
  const { orderId, reason } = await searchParams;
  const message =
    (reason && REASON_MESSAGES[reason]) ||
    'Ocurrió un problema con tu pago. No se realizó ningún cobro.';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary/20 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-[2rem] bg-background border border-border/50 shadow-sm p-8 md:p-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold font-headline">Pago no completado</h1>
              <p className="text-muted-foreground text-sm md:text-base">{message}</p>
            </div>

            {orderId && (
              <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 text-sm">
                <p>
                  <strong>Orden:</strong> ORD#{String(orderId).padStart(4, '0')}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="h-12 rounded-xl font-bold">
                <Link href="/checkout">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al checkout
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl font-bold">
                <Link href="/contacto">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar soporte
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
