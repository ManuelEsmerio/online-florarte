'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  EyeOff, 
  Dices, 
  ArrowRight, 
  PlusCircle, 
  Mail, 
  ClipboardCheck,
  Lock,
  User as UserIcon
} from 'lucide-react';
import type { User as UserType } from '@/lib/definitions';
import { Stepper } from '@/components/ui/stepper';
import { cn } from '@/lib/utils';

const generatePassword = (length = 12) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
};

const customerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Por favor, ingresa un correo electrónico válido.'),
  phone: z.string()
    .optional()
    .or(z.literal(''))
    .refine(val => !val || /^\d{10}$/.test(val), {
        message: 'El teléfono debe ser un número de 10 dígitos.',
    }),
  role: z.enum(['customer', 'admin', 'delivery'], {
    required_error: 'Debes seleccionar un rol.',
  }),
  password: z.string().optional(),
  generatePassword: z.boolean().optional(),
});

type FormValues = z.infer<typeof customerSchema>;

const CustomProgressHeader = ({ activeStep, totalSteps, title }: { activeStep: number, totalSteps: number, title: string }) => {
    const progress = ((activeStep + 1) / totalSteps) * 100;
    return (
        <div className="p-8 border-b border-border/50 dark:border-white/5">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <span className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">Paso 0{activeStep + 1} de 0{totalSteps}</span>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mt-1 font-headline">{title}</h2>
                </div>
                <span className="text-muted-foreground text-xs md:text-sm font-medium">Completado: {Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(244,37,106,0.5)]" 
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

const Step1_Info = () => {
    const { control } = useFormContext<FormValues>();
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center">
                <h1 className="serif-title text-3xl md:text-5xl mb-3 text-foreground tracking-tight font-headline">Información Básica</h1>
                <p className="text-muted-foreground font-medium text-sm px-4 leading-relaxed">Ingrese la información esencial para el perfil del usuario.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                    <FormField control={control} name="name" render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-5">Nombre Completo</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Ej. Alejandro Valenzuela" 
                                    {...field} 
                                    className="w-full h-14 md:h-16 bg-muted/30 dark:bg-black/30 border-border/50 dark:border-white/5 rounded-full px-8 focus:ring-2 focus:ring-primary/20 font-medium text-base transition-all outline-none" 
                                />
                            </FormControl>
                            <FormMessage className="ml-5" />
                        </FormItem>
                    )} />
                </div>

                <FormField control={control} name="email" render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-5">Correo Electrónico</FormLabel>
                        <FormControl>
                            <Input 
                                type="email" 
                                placeholder="correo@florarte.com" 
                                {...field} 
                                className="w-full h-14 md:h-16 bg-muted/30 dark:bg-black/30 border-border/50 dark:border-white/5 rounded-full px-8 focus:ring-2 focus:ring-primary/20 font-medium text-base transition-all outline-none" 
                            />
                        </FormControl>
                        <FormMessage className="ml-5" />
                    </FormItem>
                )} />

                <FormField control={control} name="phone" render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-5">Teléfono</FormLabel>
                        <FormControl>
                            <Input 
                                type="tel" 
                                placeholder="+52 000 000 0000" 
                                {...field} 
                                className="w-full h-14 md:h-16 bg-muted/30 dark:bg-black/30 border-border/50 dark:border-white/5 rounded-full px-8 focus:ring-2 focus:ring-primary/20 font-medium text-base transition-all outline-none" 
                            />
                        </FormControl>
                        <FormMessage className="ml-5" />
                    </FormItem>
                )} />

                <div className="col-span-full">
                    <FormField control={control} name="role" render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-5">Rol del Usuario</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full h-14 md:h-16 bg-muted/30 dark:bg-black/30 border-border/50 dark:border-white/5 rounded-full px-8 focus:ring-2 focus:ring-primary/20 font-medium text-base transition-all outline-none">
                                        <SelectValue placeholder="Seleccionar rol administrativo..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-[1.5rem] border-none shadow-2xl p-2 bg-background">
                                    <SelectItem value="admin" className="rounded-xl py-3 font-medium cursor-pointer">Administrador General</SelectItem>
                                    <SelectItem value="delivery" className="rounded-xl py-3 font-medium cursor-pointer">Repartidor Especializado</SelectItem>
                                    <SelectItem value="customer" className="rounded-xl py-3 font-medium cursor-pointer">Cliente Premium</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage className="ml-5" />
                        </FormItem>
                    )} />
                </div>
            </div>
        </div>
    );
};

const Step2_Security = ({ isEditing, setStep }: { isEditing: boolean, setStep: (s: number) => void }) => {
    const { control, watch, setValue } = useFormContext<FormValues>();
    const [showPassword, setShowPassword] = useState(false);
    
    const watchedValues = watch();

    const handleGenerate = () => {
        setValue('password', generatePassword(), { shouldValidate: true });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center">
                <h1 className="serif-title text-3xl md:text-5xl mb-3 text-foreground tracking-tight font-headline">Seguridad y Confirmación</h1>
                <p className="text-muted-foreground font-medium text-sm px-4 leading-relaxed">Establezca las credenciales de acceso y revise el resumen.</p>
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-2 text-primary px-4">
                    <Lock className="w-5 h-5" />
                    <h3 className="font-bold text-lg text-foreground">Credenciales de Acceso</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={control} name="password" render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-5">Nueva Contraseña</FormLabel>
                            <div className="relative group">
                                <FormControl>
                                    <Input 
                                        type={showPassword ? 'text' : 'password'} 
                                        placeholder="••••••••"
                                        {...field} 
                                        className="w-full h-14 md:h-16 bg-muted/30 dark:bg-black/30 border-border/50 dark:border-white/5 rounded-full px-8 pr-24 focus:ring-2 focus:ring-primary/20 font-medium text-base transition-all outline-none" 
                                    />
                                </FormControl>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-90"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-90"
                                        onClick={handleGenerate}
                                    >
                                        <Dices className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter ml-5">Mínimo 8 caracteres, 1 número y 1 símbolo</p>
                            <FormMessage className="ml-5" />
                        </FormItem>
                    )} />
                </div>
            </section>

            <section className="bg-primary/5 dark:bg-primary/5 rounded-[1.5rem] border border-primary/10 p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                        <ClipboardCheck className="w-5 h-5" />
                        <h3 className="font-bold text-foreground">Resumen de Datos (Paso 1)</h3>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                    >
                        Editar
                    </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nombre Completo</p>
                        <p className="text-sm text-foreground font-bold truncate">{watchedValues.name || 'No especificado'}</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Correo Electrónico</p>
                        <p className="text-sm text-foreground font-bold truncate">{watchedValues.email || 'No especificado'}</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Rol Asignado</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(244,37,106,0.5)]"></span>
                            <p className="text-sm text-foreground font-bold capitalize">{watchedValues.role}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export function CustomerForm({
  isOpen,
  onOpenChange,
  onSave,
  user,
  isSaving,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FormValues) => void;
  user: UserType | null;
  isSaving: boolean;
}) {
  const isEditing = !!user;

  const form = useForm<FormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
        name: '',
        email: '',
        phone: '',
        role: 'customer',
        password: '',
        generatePassword: true,
    }
  });

  const { reset, handleSubmit, trigger } = form;

  useEffect(() => {
    if (isOpen) {
        if (user) {
            reset({
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              role: user.role,
              password: '',
              generatePassword: false,
            });
        } else {
            reset({ 
                name: '', 
                email: '', 
                phone: '', 
                role: 'customer', 
                password: generatePassword(), 
                generatePassword: true 
            });
        }
    }
  }, [user, isOpen, reset]);

  const onSubmit = (data: FormValues) => {
    onSave(data);
  };
  
  const steps = [
    { label: "Información Básica" },
    { label: "Seguridad y Confirmación" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && isSaving) return;
        onOpenChange(open);
    }}>
      <DialogContent 
        className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-background dark:bg-[#1a1a1a] flex flex-col max-h-[95vh] font-sans"
        hideCloseButton={true}
      >
        <DialogHeader className="sr-only">
            <DialogTitle>{isEditing ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
            <DialogDescription>Formulario para la gestión de usuarios administrativos.</DialogDescription>
        </DialogHeader>
        
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden relative z-10">
                <Stepper initialStep={0} steps={steps}>
                {({ activeStep, isFirstStep, isLastStep, nextStep, prevStep, setStep }) => (
                    <div className="flex flex-col h-full overflow-hidden">
                        
                        <CustomProgressHeader 
                            activeStep={activeStep} 
                            totalSteps={steps.length} 
                            title={steps[activeStep].label}
                        />

                        <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 min-h-0 custom-scrollbar">
                            <Stepper.Step index={0}>
                                <Step1_Info />
                            </Stepper.Step>
                            <Stepper.Step index={1}>
                                <Step2_Security isEditing={isEditing} setStep={setStep} />
                            </Stepper.Step>
                        </div>

                        <DialogFooter className="px-8 md:px-12 py-8 bg-muted/20 dark:bg-black/20 border-t border-border/50 dark:border-white/5 shrink-0 flex flex-col gap-4 sm:flex-row sm:justify-between items-center mt-auto">
                            {isFirstStep ? (
                                <button 
                                    type="button" 
                                    onClick={() => onOpenChange(false)} 
                                    disabled={isSaving} 
                                    className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-all order-2 sm:order-1"
                                >
                                    Cancelar
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={prevStep} 
                                    disabled={isSaving} 
                                    className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all group font-bold text-sm px-4 order-2 sm:order-1"
                                >
                                    <ArrowBack className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                    <span>Volver al paso anterior</span>
                                </button>
                            )}
                            
                            <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto order-1 sm:order-2'>
                                <Button
                                    type="button"
                                    loading={isSaving && isLastStep}
                                    disabled={isSaving}
                                    onClick={async () => {
                                        const stepFields: any = {
                                            0: ["name", "email", "phone", "role"],
                                            1: ["password"]
                                        };
                                        const isValid = await trigger(stepFields[activeStep]);
                                        if (isValid) {
                                            if (isLastStep) {
                                                handleSubmit(onSubmit)();
                                            } else {
                                                nextStep();
                                            }
                                        }
                                    }}
                                    className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-white transition-all active:scale-95 flex items-center justify-center gap-2 border-none group"
                                >
                                    {isLastStep ? (
                                        <>
                                            <PlusCircle className="w-5 h-5" />
                                            {isSaving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
                                        </>
                                    ) : (
                                        <>
                                            Siguiente
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                )}
                </Stepper>
            </form>
        </FormProvider>
      </DialogContent>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.2); border-radius: 10px; }
      `}</style>
    </Dialog>
  );
}

const ArrowBack = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
