'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';

const POLL_INTERVAL_MS = 2500;
const RECONCILE_DELAY_MS = 4_000; // trigger reconcile after 4s if still pending
const TIMEOUT_MS = 90_000;

const OrderProcessingContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id'); // injected by Stripe via {CHECKOUT_SESSION_ID}

  const { clearCart } = useCart();
  const hasReconciled = useRef(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Hard timeout via setTimeout — fires the redirect regardless of polling state
  useEffect(() => {
    if (!orderId) return;
    const timer = setTimeout(() => setIsTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    if (isTimedOut) {
      router.replace(`/order/error?orderId=${orderId}&reason=timeout`);
    }
  }, [isTimedOut, orderId, router]);

  const { data } = useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (!res.ok) throw new Error('status_fetch_failed');
      return res.json();
    },
    enabled: !!orderId && !isTimedOut,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (isTimedOut) return false;
      if (status === 'paid' || status === 'failed') return false;
      return POLL_INTERVAL_MS;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Reconciliation fallback: if the webhook hasn't arrived after RECONCILE_DELAY_MS,
  // call reconcile-payment directly so the DB gets updated without waiting for Stripe webhook.
  useEffect(() => {
    if (!orderId || !sessionId || hasReconciled.current) return;

    const timer = setTimeout(async () => {
      hasReconciled.current = true;
      try {
        await fetch('/api/orders/reconcile-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gateway: 'stripe',
            orderId: Number(orderId),
            sessionId,
          }),
        });
        // The next poll cycle will pick up the updated status from the DB
      } catch {
        // Reconciliation failed silently; polling continues until timeout
      }
    }, RECONCILE_DELAY_MS);

    return () => clearTimeout(timer);
  // Intentionally not listing `data` — we only want this to run once after mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, sessionId]);

  // Navigate on status change
  useEffect(() => {
    if (!orderId || isTimedOut) return;

    const status = data?.data?.status;
    if (status === 'paid') {
      clearCart().catch(() => {/* ignore */});
      router.replace(`/order/success?orderId=${orderId}`);
    } else if (status === 'failed') {
      router.replace(`/order/error?orderId=${orderId}&reason=payment_failed`);
    }
  }, [data, orderId, router, isTimedOut, clearCart]);

  if (!orderId) {
    router.replace('/order/error?reason=missing_order');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <Loader2 className="w-14 h-14 text-primary animate-spin" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-headline">Confirmando tu pago</h1>
          <p className="text-muted-foreground text-sm">
            Estamos verificando tu transacción. Esto solo tomará unos segundos…
          </p>
        </div>
        {orderId && (
          <p className="text-xs text-muted-foreground/60">
            Orden #{String(orderId).padStart(4, '0')}
          </p>
        )}
      </div>
    </div>
  );
};

export default function OrderProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <OrderProcessingContent />
    </Suspense>
  );
}
