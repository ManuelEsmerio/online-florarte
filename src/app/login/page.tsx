'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs — fully theme-responsive */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/4 blur-[100px]" />
      </div>

      {/* Back link */}
      <div className="w-full max-w-sm relative z-10 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a la tienda
        </Link>
      </div>

      {/* Card */}
      <main className="w-full max-w-sm relative z-10 animate-fade-in-up">
        <div className="bg-card/80 backdrop-blur-xl rounded-card-lg border border-border/50 shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

          <div className="p-8 md:p-10">
            {/* Brand */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Isotype className="h-9 w-9" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl -z-10 scale-125" />
              </div>
              <h1 className="text-2xl font-headline font-bold tracking-tight mb-1">
                Bienvenido de vuelta
              </h1>
              <p className="text-sm text-muted-foreground">
                Inicia sesión en tu cuenta de <span className="text-foreground font-semibold">Florarte</span>
              </p>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-border/60" />
              <Sparkles className="h-3.5 w-3.5 text-primary/50 shrink-0" />
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">
                  Correo Electrónico
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={authLoading}
                    className="h-12 bg-background/50 border-border/60 rounded-xl pl-10 pr-4 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">
                    Contraseña
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-primary hover:underline transition-colors"
                  >
                    ¿La olvidaste?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={authLoading}
                    className="h-12 bg-background/50 border-border/60 rounded-xl pl-10 pr-12 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all placeholder:text-muted-foreground/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 h-full px-3.5 text-muted-foreground hover:bg-transparent hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                loading={authLoading}
                className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-1"
              >
                Iniciar Sesión
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-bold text-primary hover:underline transition-colors">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner variant="luxury" fullScreen size={68} />}>
      <LoginContent />
    </Suspense>
  );
}
