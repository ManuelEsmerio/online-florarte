'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 90_000; // 90 seconds before giving up

export default function OrderProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const startedAt = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.replace('/order/error?reason=missing_order');
      return;
    }

    const poll = async () => {
      // Safety timeout — stop polling and go to error page
      if (Date.now() - startedAt.current > TIMEOUT_MS) {
        router.replace(`/order/error?orderId=${orderId}&reason=timeout`);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) throw new Error('status_fetch_failed');
        const { data } = await res.json();

        if (data?.status === 'paid') {
          // Clear cart silently before navigating to success page
          await fetch('/api/cart', { method: 'DELETE' }).catch(() => {/* ignore */});
          router.replace(`/order/success?orderId=${orderId}`);
          return;
        }

        if (data?.status === 'failed') {
          router.replace(`/order/error?orderId=${orderId}&reason=payment_failed`);
          return;
        }
      } catch {
        // Network error — keep polling until timeout
      }

      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderId, router]);

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
}
