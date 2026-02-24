'use client';

import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Eye, 
  EyeOff, 
  Gem, 
  Trash2, 
  Camera, 
  User as UserIcon, 
  ShieldCheck, 
  AlertTriangle,
  MapPin,
  Edit,
  Star,
  PlusCircle
} from 'lucide-react';
import type { User, Address } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddressModal } from '@/components/AddressModal';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
    <div className="animate-fade-in">
        <div className="mb-12">
            <Skeleton className="h-10 w-48 mb-3" />
            <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="flex gap-8 border-b border-border/50 mb-10 pb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <section className="bg-card p-6 md:p-8 rounded-[2rem] border border-border/50 space-y-10">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-48" />
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-14 w-full rounded-xl" /></div>
                        <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-14 w-full rounded-xl" /></div>
                    </div>
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </section>
            </div>
            
            <div className="space-y-6">
                <section className="bg-card p-8 rounded-[2rem] border border-border/50 flex flex-col items-center">
                    <Skeleton className="h-4 w-32 mb-8" />
                    <div className="w-full bg-muted/30 p-8 rounded-2xl border border-border/50 mb-6 flex flex-col items-center gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-12 w-20" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4 mt-1" />
                </section>

                <Skeleton className="h-20 w-full rounded-[1.5rem]" />

                <section className="bg-destructive/5 p-8 rounded-[2rem] border border-destructive/20 space-y-4">
                    <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-24" /></div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </section>
            </div>
        </div>
    </div>
);

function ProfilePageContent() {
  const { user, updateUser, deleteAccount, changePassword, loading: authLoading, logout, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '', profilePic: '' },
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
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
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (data: ProfileFormValues) => {
    if (!updateUser || !user) return;
    setIsSavingProfile(true);
    const result = await updateUser(data);
    if (result.success) {
        toast({ title: '¡Perfil Actualizado!', description: 'Tu información se ha guardado correctamente.', variant: 'success' });
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
        toast({ title: '¡Contraseña Cambiada!', description: 'Tu contraseña ha sido actualizada.', variant: 'success' });
        passwordForm.reset();
      } else {
        toast({ title: 'Error', description: message || 'Ocurrió un error al cambiar la contraseña.', variant: 'destructive' });
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
            toast({ title: "Cuenta Eliminada", description: "Tu cuenta ha sido eliminada permanentemente." });
            await logout();
        } else {
            toast({ title: "Error", description: message || "Ocurrió un error inesperado.", variant: 'destructive' });
        }
        setIsDeletingAccount(false);
    }
  }

  const handleAddAddress = () => {
    if ((user?.addresses?.length || 0) >= 5) {
        toast({ 
            title: "Límite alcanzado", 
            description: "Solo puedes tener hasta 5 direcciones guardadas.",
            variant: "warning"
        });
        return;
    }
    setAddressToEdit(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setAddressToEdit(address);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (addressData: Address) => {
    setIsSavingAddress(true);
    let result;
    if (addressData.id && addressData.id > 0) {
        result = await updateAddress(addressData);
    } else {
        result = await addAddress(addressData);
    }

    if (result.success) {
        toast({ title: "¡Éxito!", description: "Dirección guardada correctamente.", variant: "success" });
        setIsAddressModalOpen(false);
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsSavingAddress(false);
    return result.success;
  };

  const handleSetDefault = async (addressId: number) => {
    const result = await setDefaultAddress(addressId);
    if (result.success) {
        toast({ title: "Dirección principal actualizada", variant: "success" });
    }
  };

  const confirmDeleteAddress = async () => {
    if (addressToDelete === null) return;
    setIsDeletingAddress(true);
    const result = await deleteAddress(addressToDelete);
    if (result.success) {
        toast({ title: "Dirección eliminada", variant: "success" });
    } else {
        toast({ title: "Error al eliminar", description: result.message, variant: "destructive" });
    }
    setAddressToDelete(null);
    setIsDeletingAddress(false);
  };

  if (authLoading || !user) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-6xl">
            <ProfileSkeleton />
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl w-full flex-grow animate-fade-in font-sans">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal, direcciones y preferencias.</p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="flex gap-8 bg-transparent border-b border-border/50 rounded-none h-auto p-0 mb-10 overflow-x-auto no-scrollbar">
            <TabsTrigger 
                value="personal" 
                className="rounded-none border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-bold pb-4 transition-all text-muted-foreground hover:text-foreground"
            >
                Información Personal
            </TabsTrigger>
            <TabsTrigger 
                value="addresses" 
                className="rounded-none border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-bold pb-4 transition-all text-muted-foreground hover:text-foreground"
            >
                Mis Direcciones
            </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                <TabsContent value="personal" className="space-y-8 mt-0 border-none p-0 focus-visible:ring-0">
                    <section className="bg-card p-6 md:p-8 rounded-[2rem] shadow-sm border border-border/50">
                        <div className="flex items-center gap-3 mb-8">
                            <UserIcon className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold font-headline">Información Personal</h2>
                        </div>
                        
                        <div className="flex flex-col items-center mb-10">
                            <div className="relative group">
                                <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center border-4 border-background shadow-sm overflow-hidden relative ring-4 ring-primary/10">
                                    {profilePic ? (
                                        <Image src={profilePic} alt={user.name} fill className="object-cover" />
                                    ) : (
                                        <UserIcon className="w-16 h-16 text-muted-foreground" />
                                    )}
                                </div>
                                <label 
                                    htmlFor="picture" 
                                    className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full border-4 border-background shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Camera className="w-4 h-4" />
                                    <input id="picture" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isSavingProfile} />
                                </label>
                            </div>
                            <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">JPG, GIF O PNG. MÁX 2MB</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isSavingProfile} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Correo Electrónico</FormLabel>
                                            <FormControl>
                                                <Input type="email" {...field} disabled={isSavingProfile} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Teléfono</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="3312345678" disabled={isSavingProfile} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all" loading={isSavingProfile}>
                                    Guardar Cambios
                                </Button>
                            </form>
                        </Form>
                    </section>

                    <section className="bg-card p-6 md:p-8 rounded-[2rem] shadow-sm border border-border/50">
                        <div className="flex items-center gap-3 mb-8">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold font-headline">Privacidad y Seguridad</h2>
                        </div>
                        <div className="space-y-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">Cambiar Contraseña</p>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                        <FormItem className="relative">
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                        placeholder="Nueva Contraseña"
                                                        type={showNewPassword ? 'text' : 'password'} 
                                                        {...field} 
                                                        disabled={isChangingPassword}
                                                        className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium pr-12"
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={() => setShowNewPassword(!showNewPassword)}>
                                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem className="relative">
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                        placeholder="Confirmar Nueva Contraseña"
                                                        type={showConfirmPassword ? 'text' : 'password'} 
                                                        {...field} 
                                                        disabled={isChangingPassword}
                                                        className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium pr-12"
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" variant="outline" className="w-full h-14 rounded-2xl border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all active:scale-[0.98]" loading={isChangingPassword}>
                                        Actualizar Contraseña
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="addresses" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:hidden gap-6">
                            {user.addresses?.map((addr) => (
                                <div 
                                    key={addr.id} 
                                    className={cn(
                                        "bg-card border-2 p-6 rounded-[2rem] relative shadow-sm transition-all",
                                        addr.isDefault ? "border-primary" : "border-border/50"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-headline text-2xl font-bold">{addr.alias}</h3>
                                        {addr.isDefault && (
                                            <Badge className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border-none">
                                                Predeterminada
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1 mb-6 font-medium">
                                        <p>{addr.streetName} {addr.streetNumber}{addr.interiorNumber ? `, Int ${addr.interiorNumber}` : ''}</p>
                                        <p>{addr.neighborhood}, CP {addr.postalCode}</p>
                                        <p>{addr.city}, {addr.state}</p>
                                        <p>México</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/50">
                                        {!addr.isDefault && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                                                onClick={() => handleSetDefault(addr.id)}
                                            >
                                                <Star className="w-3.5 h-3.5 mr-1.5" />
                                                Hacer Principal
                                            </Button>
                                        )}
                                        <button onClick={() => handleEditAddress(addr)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                                            <Edit className="w-4 h-4" /> Editar
                                        </button>
                                        <button onClick={() => setAddressToDelete(addr.id)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors">
                                            <Trash2 className="w-4 h-4" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block bg-card rounded-[2.5rem] shadow-sm border border-border/50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-b-border/50">
                                        <TableHead className="h-14 font-bold text-[10px] uppercase tracking-widest px-8">Alias</TableHead>
                                        <TableHead className="h-14 font-bold text-[10px] uppercase tracking-widest">Dirección</TableHead>
                                        <TableHead className="h-14 font-bold text-[10px] uppercase tracking-widest">Estado</TableHead>
                                        <TableHead className="h-14 font-bold text-[10px] uppercase tracking-widest text-right px-8">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {user.addresses && user.addresses.length > 0 ? (
                                        user.addresses.map((addr) => (
                                            <TableRow key={addr.id} className="border-b-border/50 transition-colors hover:bg-muted/20">
                                                <TableCell className="font-bold py-6 px-8">{addr.alias}</TableCell>
                                                <TableCell className="py-6">
                                                    <div className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
                                                        {addr.streetName} {addr.streetNumber}, {addr.neighborhood}, {addr.city}, CP {addr.postalCode}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    {addr.isDefault ? (
                                                        <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold tracking-widest">PRINCIPAL</Badge>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground font-medium">Secundaria</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-6 px-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!addr.isDefault && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-9 w-9 rounded-full text-muted-foreground hover:text-white transition-all"
                                                                onClick={() => handleSetDefault(addr.id)}
                                                                title="Marcar como predeterminada"
                                                            >
                                                                <Star className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-white transition-all"
                                                            onClick={() => handleEditAddress(addr)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-9 w-9 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-destructive transition-all"
                                                            onClick={() => setAddressToDelete(addr.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <MapPin className="w-10 h-10 mb-2 opacity-20" />
                                                    <p className="text-sm font-medium">Aún no tienes direcciones guardadas.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </div>
          
            <div className="space-y-6">
                <section className="bg-card p-6 md:p-8 rounded-[2rem] shadow-sm border border-border/50 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Gem className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-foreground">Lealtad Florarte</h2>
                    </div>
                    <div className='flex flex-col items-center justify-center text-center space-y-2 bg-muted/30 p-8 rounded-2xl border border-border/50 mb-6'>
                        <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1'>Tu Saldo</p>
                        <p className="text-5xl font-bold text-primary font-sans">{user.loyalty_points || 0}</p>
                        <p className='text-sm font-bold text-muted-foreground'>Puntos</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-relaxed font-medium">
                        Gana 1 punto por cada $1 gastado. Al juntar 3,000 puntos, obtienes un cupón de $200 MXN.
                    </p>
                </section>

                <Button 
                    onClick={handleAddAddress}
                    className="w-full h-20 bg-primary hover:bg-[#E6286B] text-white font-bold rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-95 gap-3 border-none"
                >
                    <PlusCircle className="w-6 h-6" />
                    <span className="text-lg">Agregar Nueva Dirección</span>
                </Button>

                <section className="bg-destructive/5 p-6 md:p-8 rounded-[2rem] border border-destructive/20">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <h2 className="text-sm font-bold text-destructive uppercase tracking-widest">Zona de Peligro</h2>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-6 leading-relaxed font-medium">
                        Una vez que elimines tu cuenta, no podrás recuperar tu historial de pedidos ni tus puntos de lealtad.
                    </p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full h-14 rounded-xl font-bold shadow-lg shadow-destructive/10 bg-destructive hover:bg-destructive/90 border-none transition-all">
                                Eliminar Mi Cuenta
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-headline text-2xl text-foreground">¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                                    Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta y tus datos de nuestros servidores.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted font-bold text-foreground">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} className='bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20 text-white' loading={isDeletingAccount}>
                                    Sí, eliminar cuenta
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </section>
            </div>
        </div>
      </Tabs>

      <AddressModal
        isOpen={isAddressModalOpen}
        onOpenChange={setIsAddressModalOpen}
        onAddressSelect={() => {}}
        onSaveAddress={handleSaveAddress}
        onDeleteAddress={deleteAddress}
        addresses={user.addresses || []}
        isSaving={isSavingAddress}
        addressToEdit={addressToEdit}
      />

      <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="font-headline text-2xl text-foreground">Confirmar eliminación</AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    ¿Estás seguro de que deseas eliminar esta dirección? Esta acción no se puede deshacer.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted font-bold text-foreground" onClick={() => setAddressToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteAddress} className='bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20 text-white' disabled={isDeletingAddress}>
                    {isDeletingAddress ? 'Eliminando...' : 'Sí, eliminar'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ProfilePage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-grow flex flex-col bg-background">
                <ProfilePageContent />
            </main>
            <Footer />
        </div>
    );
}
