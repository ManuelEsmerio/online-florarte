// src/app/verify-email/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MailCheck, MailWarning, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { Isotype } from '@/components/icons/Isotype';

type Status = 'pending' | 'loading' | 'success' | 'error';

const VerifyEmailContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Si hay token, verificar automáticamente
  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          toast({ title: '¡Correo verificado!', description: data.data?.message, variant: 'success' });
          setTimeout(() => router.push('/'), 3000);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'El enlace no es válido o ha expirado.');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Error de conexión. Intenta de nuevo.');
      });
  }, [token, router, toast]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Correo enviado', description: 'Revisa tu bandeja de entrada.', variant: 'success' });
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo reenviar.', variant: 'destructive' });
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

        {/* ESTADO: Pendiente (sin token, solo email) */}
        {status === 'pending' && (
          <>
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Revisa tu correo</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Enviamos un enlace de verificación a:
            </p>
            {email && (
              <p className="font-semibold text-foreground mb-6">{email}</p>
            )}
            <p className="text-muted-foreground text-xs mb-6">
              Haz clic en el enlace del correo para activar tu cuenta. Si no lo ves, revisa tu carpeta de spam.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleResend} loading={isResending} variant="outline" className="w-full h-12 rounded-2xl font-bold">
                Reenviar correo
              </Button>
              <Button asChild variant="ghost" className="w-full h-12 rounded-2xl">
                <Link href="/">Continuar sin verificar</Link>
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
