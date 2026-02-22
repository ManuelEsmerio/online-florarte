// src/app/admin/profile/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm, useForm as usePasswordForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Gem, Link as LinkIcon, LogOut, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { User } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(3, 'El nombre es requerido.'),
  email: z.string().email('Correo electrónico inválido.'),
  phone: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /^\d{10}$/.test(val), {
        message: 'El teléfono debe ser un número de 10 dígitos.',
    }),
  profilePic: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ProfileSkeleton = () => (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información personal y foto de perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="flex items-center space-x-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-10 w-full max-w-sm" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                 </div>
                 <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                  <CardTitle>Privacidad y Seguridad</CardTitle>
                  <CardDescription>Gestiona la seguridad de tu cuenta.</CardDescription>
              </CardHeader>
               <CardContent className="space-y-4 max-w-md">
                   <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-10 w-full" />
                   <div className="flex justify-end"><Skeleton className="h-10 w-40" /></div>
               </CardContent>
        </Card>
    </div>
)

export default function ProfilePageContent() {
  const { user, updateUser, deleteAccount, changePassword, loading: authLoading, logout } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '', profilePic: '' },
  });
  
  const passwordForm = usePasswordForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const fetchUserDataCallback = useCallback(() => {
    if (user) {
        form.reset({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            profilePic: user.profilePic || '',
        });
    }
  }, [user, form]);
  
  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/login?redirect=/profile');
        return;
    }
    fetchUserDataCallback();
  }, [user, authLoading, router, fetchUserDataCallback]);
  
  if (authLoading || !user) {
    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <h1 className="text-3xl font-bold font-headline">Mi Perfil</h1>
            <ProfileSkeleton />
        </div>
    );
  }

  const handleUpdateProfile = async (data: ProfileFormValues) => {
    if (!updateUser || !user) return;
    setIsSavingProfile(true);
    
    const result = await updateUser(data);

    if (result.success) {
        toast({ title: '¡Perfil Actualizado!', description: 'Tu información se ha guardado correctamente.' });
    } else {
        toast({ title: 'Error al actualizar', description: result.message, variant: 'destructive' });
    }
    setIsSavingProfile(false);
  };

  const handleChangePassword = async (data: PasswordFormValues) => {
    if (changePassword) {
      setIsChangingPassword(true);
      const { success, message } = await changePassword(data.newPassword);
      if (success) {
        toast({ title: '¡Contraseña Cambiada!', description: 'Tu contraseña ha sido actualizada.' });
        passwordForm.reset();
      } else {
        toast({
          title: 'Error',
          description: message || 'Ocurrió un error al cambiar la contraseña.',
          variant: 'destructive',
        });
      }
      setIsChangingPassword(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue('profilePic', base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const profilePic = form.watch('profilePic');

  const handleDeleteAccount = async () => {
    if(deleteAccount) {
        setIsDeletingAccount(true);
        const { success, message } = await deleteAccount();
        if (success) {
            if(clearCart) clearCart();
            toast({
                title: "Cuenta Eliminada",
                description: "Tu cuenta ha sido eliminada permanentemente.",
            });
            await logout();
        } else {
            toast({
                title: "No se puede eliminar la cuenta",
                description: message || "Ocurrió un error inesperado.",
                variant: 'destructive',
            });
        }
        setIsDeletingAccount(false);
    }
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <h1 className="text-3xl font-bold font-headline">Mi Perfil</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información personal y foto de perfil.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-8">
                    <div className="flex items-center space-x-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profilePic || undefined} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <Label htmlFor="picture">Foto de perfil</Label>
                            <Input id="picture" type="file" onChange={handleImageUpload} accept="image/*" disabled={isSavingProfile} />
                            <p className="text-xs text-muted-foreground">JPG, GIF o PNG. Tamaño máximo de 2MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} disabled={isSavingProfile} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" {...field} disabled={isSavingProfile} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} placeholder="Tu número de teléfono" disabled={isSavingProfile} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" loading={isSavingProfile}>Guardar Cambios</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Privacidad y Seguridad</CardTitle>
                    <CardDescription>Gestiona la seguridad de tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Cambiar Contraseña</h3>
                     <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4 max-w-md">
                          <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>Nueva Contraseña</FormLabel><div className="relative"><FormControl><Input type={showNewPassword ? 'text' : 'password'} {...field} disabled={isChangingPassword}/></FormControl><Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent hover:text-primary" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div><FormMessage /></FormItem>)} />
                          <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Confirmar Nueva Contraseña</FormLabel><div className="relative"><FormControl><Input type={showConfirmPassword ? 'text' : 'password'} {...field} disabled={isChangingPassword}/></FormControl><Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent hover:text-primary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div><FormMessage /></FormItem>)} />
                          <div className="flex justify-end pt-4"><Button type="submit" loading={isChangingPassword}>Cambiar Contraseña</Button></div>
                        </form>
                     </Form>
                  </div>
                </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-8">
            {user.role === 'customer' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gem className="w-6 h-6 text-blue-500" /> Lealtad Florarte</CardTitle>
                    <CardDescription>Tus puntos acumulados por tus compras.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className='flex flex-col items-center justify-center text-center p-6 bg-muted/50 rounded-lg'>
                        <p className='text-muted-foreground'>Tu Saldo</p>
                        <p className="text-5xl font-bold text-blue-500 my-2">{user.loyalty_points || 0}</p>
                        <p className='font-semibold'>Puntos</p>
                        <p className="text-xs text-muted-foreground mt-4 max-w-sm">Gana 1 punto por cada $1 gastado. Al juntar 3,000 puntos, obtienes un cupón de $200 MXN.</p>
                      </div>
                  </CardContent>
                </Card>
            )}

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
                        <p className='font-semibold text-sm'>Eliminar tu cuenta</p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" loading={isDeletingAccount} className="w-full sm:w-auto">Eliminar Cuenta</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta y tus datos de nuestros servidores.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAccount} className='bg-destructive hover:bg-destructive/90' loading={isDeletingAccount}>Sí, eliminar cuenta</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                     <p className="text-xs text-muted-foreground">Esta acción es permanente y no se puede deshacer.</p>
                </CardContent>
            </Card>

          </div>
      </div>
    </div>
  );
}
