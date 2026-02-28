'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Store, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Isotype } from '@/components/icons/Isotype';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Siempre mostrar el mismo mensaje (no revelar si el email existe)
      toast({
        title: 'Correo enviado',
        description: 'Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.',
        variant: 'success',
      });
      setEmail('');
    } catch {
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con el servidor. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || user) {
    return <LoadingSpinner variant="luxury" fullScreen size={68} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-8 px-2">
        <Link href="/login" className="flex items-center text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1 flex justify-center">
          <div className="bg-card p-2 rounded-full shadow-sm border border-border">
            <Isotype className="h-10 w-10" />
          </div>
        </div>
        <div className="w-8"></div>
      </div>

      <main className="w-full max-w-md bg-card rounded-[2.5rem] p-8 shadow-xl border border-border animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-muted-foreground text-sm">Ingresa tu correo para recibir instrucciones</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="block text-sm font-medium text-foreground/80 px-1" htmlFor="email">Correo Electrónico</Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-secondary/50 border-border rounded-2xl py-6 px-4 focus:ring-primary focus:border-primary transition-all pr-12"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" loading={isLoading}>
            Enviar Enlace
          </Button>
        </form>

        <div className="mt-10 text-center text-sm">
          <Link href="/login" className="text-primary font-bold hover:underline flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Iniciar Sesión
          </Link>
        </div>
      </main>

      <footer className="mt-10">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors group">
          <Store className="h-5 w-5" />
          <span>Volver a la tienda</span>
        </Link>
      </footer>
    </div>
  );
}
