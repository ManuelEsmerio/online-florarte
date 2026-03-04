'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Package, Home } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const CheckoutSuccessContent = () => {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const hasClearedRef = useRef(false);
  const hasReconciledRef = useRef(false);

  const orderId = useMemo(() => searchParams.get('order_id'), [searchParams]);
  const sessionId = useMemo(() => searchParams.get('session_id'), [searchParams]);
  const mercadoPagoPaymentId = useMemo(
    () => searchParams.get('payment_id') ?? searchParams.get('collection_id'),
    [searchParams]
  );

  useEffect(() => {
    if (hasClearedRef.current) return;
    hasClearedRef.current = true;
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (hasReconciledRef.current) return;
    if (!orderId) return;

    const numericOrderId = Number(orderId);
    if (!Number.isFinite(numericOrderId) || numericOrderId <= 0) return;

    const payload: Record<string, unknown> = { orderId: numericOrderId };
    if (sessionId) {
      payload.gateway = 'stripe';
      payload.sessionId = sessionId;
    } else if (mercadoPagoPaymentId) {
      payload.gateway = 'mercadopago';
      payload.paymentId = mercadoPagoPaymentId;
    } else {
      return;
    }

    hasReconciledRef.current = true;

    fetch('/api/orders/reconcile-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(error => {
      console.error('No se pudo reconciliar el pago', error);
    });
  }, [orderId, sessionId, mercadoPagoPaymentId]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary/20 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-[2rem] bg-background border border-border/50 shadow-sm p-8 md:p-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline">¡Pago exitoso!</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Tu orden fue recibida correctamente y ya estamos preparando tus flores.
            </p>

            <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 text-left text-sm space-y-2">
              {orderId && <p><strong>Orden:</strong> ORD#{String(orderId).padStart(4, '0')}</p>}
              {sessionId && <p className="break-all"><strong>Session:</strong> {sessionId}</p>}
            </div>

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
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><CheckCircle2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
