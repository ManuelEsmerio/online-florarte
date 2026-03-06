// src/app/verify-email/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MailCheck, MailWarning, Loader2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Isotype } from '@/components/icons/Isotype';
import { useQuery } from '@tanstack/react-query';

type Status = 'pending' | 'loading' | 'success' | 'error';

const VerifyEmailContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isResending, setIsResending] = useState(false);
  const [isPollingVerified, setIsPollingVerified] = useState(false);

  const { data, isLoading: isVerifying } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () =>
      fetch(`/api/auth/verify-email?token=${token}`).then(res => res.json()),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Derivar status desde react-query
  const status: Status = !token
    ? 'pending'
    : isVerifying
    ? 'loading'
    : data?.success
    ? 'success'
    : 'error';

  const errorMessage = (!data?.success && data?.error) || 'El enlace no es válido o ha expirado.';

  // Side-effects al verificar exitosamente (flujo con token en URL)
  useEffect(() => {
    if (data?.success) {
      toast({ title: '¡Correo verificado!', description: 'Tu cuenta está activa.', variant: 'success' });
      setTimeout(() => router.push('/login?verified=true'), 3000);
    }
  }, [data?.success, toast, router]);

  // Polling: active only in the "pending" state (email present, no token).
  // Checks /api/auth/verification-status every 4 s to detect when the user
  // clicks the link in their inbox from another device or tab.
  useEffect(() => {
    // Only poll when we have an email and no token (waiting for inbox click)
    if (!email || token) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/auth/verification-status?email=${encodeURIComponent(email)}`,
        );
        if (!res.ok) return; // rate-limit or network error — just wait next tick

        const json: { verified: boolean } = await res.json();

        if (json.verified) {
          clearInterval(intervalId);
          setIsPollingVerified(true);
          toast({ title: '¡Correo verificado!', description: 'Tu cuenta está activa.', variant: 'success' });
          router.push('/login?verified=true');
        }
      } catch {
        // Network error — silently wait for next tick
      }
    }, 4000);

    // Cleanup: stop polling when component unmounts or deps change
    return () => clearInterval(intervalId);
  }, [email, token, router, toast]);

  const handleResend = async () => {
    if (!email) {
      toast({ title: 'Error', description: 'No se encontró el correo. Regístrate de nuevo.', variant: 'destructive' });
      return;
    }
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const resData = await res.json();
      if (res.ok) {
        toast({ title: 'Correo enviado', description: 'Revisa tu bandeja de entrada.', variant: 'success' });
      } else {
        toast({ title: 'Error', description: resData.error || 'No se pudo reenviar.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de conexión', variant: 'destructive' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <div className="bg-card p-3 rounded-2xl shadow-sm border border-border inline-block">
          <Isotype className="h-10 w-10" />
        </div>
      </div>

      <div className="w-full max-w-md bg-card rounded-[2.5rem] p-8 shadow-xl border border-border animate-fade-in-up text-center">

        {/* ESTADO: Verificando con token */}
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verificando tu correo...</h2>
            <p className="text-muted-foreground text-sm">Espera un momento.</p>
          </>
        )}

        {/* ESTADO: Éxito */}
        {status === 'success' && (
          <>
            <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
              <MailCheck className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">¡Correo verificado!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Tu cuenta está activa. Serás redirigido en unos segundos...
            </p>
            <Button asChild className="w-full h-12 rounded-2xl font-bold">
              <Link href="/">Ir al inicio</Link>
            </Button>
          </>
        )}

        {/* ESTADO: Error al verificar */}
        {status === 'error' && (
          <>
            <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
              <MailWarning className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-destructive">Enlace inválido</h2>
            <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleResend} loading={isResending} className="w-full h-12 rounded-2xl font-bold">
                Reenviar enlace de verificación
              </Button>
              <Button asChild variant="ghost" className="w-full h-12 rounded-2xl">
                <Link href="/">Ir al inicio</Link>
              </Button>
            </div>
          </>
        )}

        {/* ESTADO: Pendiente (sin token, solo email) — con polling activo */}
        {status === 'pending' && (
          <>
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              {isPollingVerified
                ? <MailCheck className="h-10 w-10 text-green-600" />
                : <Mail className="h-10 w-10 text-primary" />}
            </div>
            <h2 className="text-xl font-bold mb-2">Revisa tu correo</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Enviamos un enlace de verificación a:
            </p>
            {email && (
              <p className="font-semibold text-foreground mb-4">{email}</p>
            )}

            {/* Polling indicator */}
            {!isPollingVerified && email && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6 bg-muted/40 rounded-xl px-4 py-2.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>Esperando verificación...</span>
              </div>
            )}

            <p className="text-muted-foreground text-xs mb-6">
              Haz clic en el enlace del correo para activar tu cuenta. Si no lo ves, revisa tu carpeta de spam.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleResend} loading={isResending} variant="outline" className="w-full h-12 rounded-2xl font-bold">
                Reenviar correo
              </Button>
              <Button asChild variant="ghost" className="w-full h-12 rounded-2xl text-sm text-muted-foreground">
                <Link href="/login">¿Ya verificaste? Continuar</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
