// src/app/verify-email/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, MailWarning, Loader2 } from 'lucide-react';
import Link from 'next/link';

const VerifyEmailContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleVerifyEmail, sendVerificationEmail, user } = useAuth();
    const { toast } = useToast();
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando tu correo electrónico...');
    const [isResending, setIsResending] = useState(false);
    
    const emailToVerify = searchParams.get('email');
    const actionCode = searchParams.get('oobCode');

    useEffect(() => {
        if (user) {
            router.push('/'); // Si ya está logueado, no debería estar aquí.
            return;
        }

        if (actionCode) {
            handleVerifyEmail(actionCode)
                .then(result => {
                    if (result.success) {
                        setStatus('success');
                        setMessage(result.message);
                        toast({ title: "¡Éxito!", description: result.message });
                        setTimeout(() => router.push('/login'), 3000);
                    } else {
                        setStatus('error');
                        setMessage(result.message);
                    }
                });
        } else {
            setStatus('error');
            setMessage("No se proporcionó un código de verificación. Por favor, revisa el enlace en tu correo.");
        }
    }, [actionCode, handleVerifyEmail, router, toast, user]);
    
    const handleResend = async () => {
        setIsResending(true);
        const result = await sendVerificationEmail();
        if (result.success) {
            toast({ title: 'Correo Enviado', description: 'Se ha enviado un nuevo enlace de verificación.'});
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive'});
        }
        setIsResending(false);
    }

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">{message}</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <MailCheck className="h-12 w-12 text-green-500" />
                        <p className="font-semibold text-foreground">{message}</p>
                        <p className="text-muted-foreground">Serás redirigido para iniciar sesión en unos segundos...</p>
                        <Button asChild><Link href="/login">Iniciar Sesión Ahora</Link></Button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <MailWarning className="h-12 w-12 text-destructive" />
                        <p className="font-semibold text-destructive">{message}</p>
                        <p className="text-muted-foreground">
                            {emailToVerify
                                ? `¿No has recibido el correo? Podemos reenviarlo a ${emailToVerify}.`
                                : 'Si el problema persiste, intenta registrarte de nuevo.'
                            }
                        </p>
                        {emailToVerify && (
                             <Button onClick={handleResend} loading={isResending}>
                                Reenviar enlace
                            </Button>
                        )}
                    </div>
                );
        }
    }

    return (
        <Card className="mx-auto max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline text-center">Verificación de Correo</CardTitle>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-secondary">
       <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className='flex justify-center'><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
       </main>
    </div>
  );
}
