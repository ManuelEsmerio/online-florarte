'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Store, Mail, Lock } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Isotype } from '@/components/icons/Isotype';

const LoginContent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, searchParams]);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast({ title: '¡Correo verificado!', description: 'Ya puedes iniciar sesión.', variant: 'success' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });

    if (result.success) {
      toast({ title: '¡Bienvenido de vuelta!', variant: 'success' });
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    } else if (result.errorCode === 'EMAIL_NOT_VERIFIED') {
      const verifyEmail = result.data?.email ?? email;
      router.push(`/verify-email?email=${encodeURIComponent(verifyEmail)}`);
    } else {
      toast({
        title: 'Error de autenticación',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || user) {
    return <LoadingSpinner variant="luxury" fullScreen size={68} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md flex items-center justify-between mb-6 md:mb-10 px-2">
        <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1 flex justify-center">
          <div className="bg-card p-3 rounded-2xl shadow-sm border border-border">
            <Isotype className="h-8 w-8 md:h-10 md:w-10" />
          </div>
        </div>
        <div className="w-10"></div>
      </div>

      <main className="w-full max-w-md bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-border animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">Iniciar Sesión</h1>
          <p className="text-muted-foreground text-sm">Bienvenido de nuevo a Florarte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                disabled={authLoading}
                className="w-full h-12 md:h-14 bg-secondary/30 border-border rounded-2xl px-4 focus:ring-primary focus:border-primary transition-all pr-12"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="block text-sm font-medium text-foreground/80" htmlFor="password">Contraseña</Label>
              <Link href="/forgot-password" title="¿Olvidaste tu contraseña?" className="text-xs text-primary hover:underline font-bold">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authLoading}
                className="w-full h-12 md:h-14 bg-secondary/30 border-border rounded-2xl px-4 focus:ring-primary focus:border-primary transition-all pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 md:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" loading={authLoading}>
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-8 md:mt-10 text-center text-sm">
          <span className="text-muted-foreground">¿No tienes una cuenta?</span>
          <Link href="/register" className="ml-1 text-primary font-bold hover:underline">
            Regístrate
          </Link>
        </div>
      </main>

      <footer className="mt-8 md:mt-12">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors group p-2">
          <Store className="h-5 w-5" />
          <span>Volver a la tienda</span>
        </Link>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner variant="luxury" fullScreen size={68} />}>
      <LoginContent />
    </Suspense>
  );
}