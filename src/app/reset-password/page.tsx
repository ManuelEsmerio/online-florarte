
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast({ title: 'Error', description: 'El enlace de recuperación no es válido o ha expirado.', variant: 'destructive' });
            return;
        }
        if (password !== confirmPassword) {
            toast({ title: 'Error', description: 'Las contraseñas no coinciden.', variant: 'destructive' });
            return;
        }
        if (password.length < 6) {
            toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: '¡Éxito!',
                    description: data.message,
                    variant: 'success'
                });
                router.push('/login');
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'No se pudo restablecer la contraseña.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({ title: 'Error de Red', description: 'No se pudo conectar con el servidor.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="mx-auto max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline text-destructive">Enlace Inválido</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">El enlace para restablecer la contraseña no es válido o ha expirado. Por favor, solicita uno nuevo.</p>
                    <Button asChild className="w-full mt-4">
                        <Link href="/forgot-password">Solicitar Nuevo Enlace</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mx-auto max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline">Restablecer Contraseña</CardTitle>
                <CardDescription>
                    Ingresa tu nueva contraseña a continuación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                         <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                            />
                             <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                            </Button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" loading={isLoading}>
                        Guardar Contraseña
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}


export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <div className="container mx-auto px-4 py-16">
                    <Suspense fallback={<LoadingSpinner />}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
