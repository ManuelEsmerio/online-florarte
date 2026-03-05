'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('[GLOBAL_ERROR]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">Algo salió mal</h2>
      <p className="text-gray-500 max-w-md">
        Ocurrió un error inesperado. Por favor intenta de nuevo o contacta soporte si el problema persiste.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400">Código de error: {error.digest}</p>
      )}
      <Button onClick={reset} variant="outline">
        Intentar de nuevo
      </Button>
    </div>
  );
}
