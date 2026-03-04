'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowLeft, Store, User, Mail } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Isotype } from '@/components/icons/Isotype';
import { PasswordRequirements } from '@/components/password/PasswordRequirements';
import { isPasswordStrong, PASSWORD_POLICY_MESSAGE } from '@/utils/passwordPolicy';

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Por favor, ingresa un correo electrónico válido.'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .refine(isPasswordStrong, { message: PASSWORD_POLICY_MESSAGE }),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { user, register, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      agreedToTerms: false,
    },
  });
  const passwordValue = form.watch('password');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    const result = await register(data);

    if (result.success) {
      toast({
        title: '¡Cuenta creada!',
        description: 'Te enviamos un correo para verificar tu dirección.',
        variant: 'success',
      });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } else {
      toast({
        title: 'Error al registrarse',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return <LoadingSpinner variant="luxury" fullScreen size={68} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md flex items-center justify-between mb-6 md:mb-10 px-2">
        <Link href="/login" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
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
          <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">Crear Cuenta</h1>
          <p className="text-muted-foreground text-sm">Únete hoy a Florarte</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 px-1">Nombre Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Juan Pérez" 
                        {...field} 
                        className="h-12 md:h-14 bg-secondary/30 border-border rounded-2xl px-4 focus:ring-primary focus:border-primary transition-all pr-12"
                      />
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 px-1">Correo electrónico</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="email" 
                        placeholder="tu@email.com" 
                        {...field} 
                        className="h-12 md:h-14 bg-secondary/30 border-border rounded-2xl px-4 focus:ring-primary focus:border-primary transition-all pr-12"
                      />
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 px-1">Contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        {...field}
                        className="h-12 md:h-14 bg-secondary/30 border-border rounded-2xl px-4 focus:ring-primary focus:border-primary transition-all pr-12"
                      />
                    </FormControl>
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
                  <FormMessage />
                  <PasswordRequirements password={passwordValue} className="mt-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agreedToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal text-muted-foreground">
                      Acepto los{' '}
                      <Link href="/terms-and-conditions" className="text-primary font-bold hover:underline">
                        términos y condiciones
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 md:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              Crear Cuenta
            </Button>
          </form>
        </Form>

        <div className="mt-8 md:mt-10 text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes una cuenta?</span>
          <Link href="/login" className="ml-1 text-primary font-bold hover:underline">
            Inicia Sesión
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