'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 90_000; // 90 seconds before giving up

const OrderProcessingContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const startedAt = useRef(Date.now());

  const { data } = useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (!res.ok) throw new Error('status_fetch_failed');
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (Date.now() - startedAt.current > TIMEOUT_MS) return false;
      if (status === 'paid' || status === 'failed') return false;
      return POLL_INTERVAL_MS;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!orderId) {
      router.replace('/order/error?reason=missing_order');
      return;
    }

    if (Date.now() - startedAt.current > TIMEOUT_MS) {
      router.replace(`/order/error?orderId=${orderId}&reason=timeout`);
      return;
    }

    const status = data?.data?.status;
    if (status === 'paid') {
      fetch('/api/cart', { method: 'DELETE' }).catch(() => {/* ignore */});
      router.replace(`/order/success?orderId=${orderId}`);
    } else if (status === 'failed') {
      router.replace(`/order/error?orderId=${orderId}&reason=payment_failed`);
    }
  }, [data, orderId, router]);

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
