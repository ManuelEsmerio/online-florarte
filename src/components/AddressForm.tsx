'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import type { Address } from '@/lib/definitions';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ADDRESS_TYPE_OPTIONS } from '@/utils/constants';

const addressFormSchema = z.object({
  id: z.number().optional(),
  alias: z.string().min(3, 'El alias de la dirección es requerido.'),
  recipientName: z.string().min(3, 'El nombre del destinatario es requerido.'),
  recipientPhone: z.string().min(10, 'El teléfono debe tener 10 dígitos.').max(10, 'El teléfono debe tener 10 dígitos.'),
  streetName: z.string().min(3, 'El nombre de la calle es requerido.'),
  streetNumber: z.string().min(1, 'El número exterior es requerido.'),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().min(3, 'La colonia es requerida.'),
  city: z.string().min(3, 'La ciudad es requerida.'),
  state: z.string().min(3, 'El estado es requerido.'),
  postalCode: z.string().min(5, 'El código postal es requerido.'),
  addressType: z.enum(ADDRESS_TYPE_OPTIONS.map(option => option.value) as [string, ...string[]], { required_error: 'Debes seleccionar un tipo de domicilio.' }),
  referenceNotes: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  addressToEdit?: Address | null;
  onSave: (address: Address) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
}

export function AddressForm({ addressToEdit, onSave, onCancel, isSaving }: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
        alias: '',
        recipientName: '',
        recipientPhone: '',
        streetName: '',
        streetNumber: '',
        interiorNumber: '',
        neighborhood: '',
        city: 'Tequila',
        state: 'Jalisco',
        postalCode: '',
        addressType: 'HOME',
        referenceNotes: '',
    }
  });

  useEffect(() => {
    if (addressToEdit) {
      form.reset({
        ...addressToEdit,
        recipientPhone: addressToEdit.recipientPhone || '',
        interiorNumber: addressToEdit.interiorNumber || '',
        referenceNotes: addressToEdit.referenceNotes || '',
      });
    }
  }, [addressToEdit, form]);

  const onSubmit = async (data: AddressFormValues) => {
    const finalData = { ...data, id: addressToEdit?.id ?? 0, recipientPhone: data.recipientPhone, referenceNotes: data.referenceNotes };
    await onSave(finalData as Address);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Alias de la dirección *</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Mi Casa, Oficina de Mamá" {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre de quien recibe *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre y Apellido" {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Teléfono de contacto *</FormLabel>
                            <FormControl>
                                <Input placeholder="10 dígitos" {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="streetName"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Calle *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="streetNumber"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Núm. Ext *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="interiorNumber"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Núm. Int</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Opcional" className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Colonia *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Ciudad *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Estado *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">C.P. *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="addressType"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Tipo de domicilio *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                            </FormControl>
                            {/* AGREGADO: z-[9999] o z-50 para asegurar que flote encima del modal */}
                            <SelectContent className="z-[9999] max-h-[200px]"> 
                                {ADDRESS_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="referenceNotes"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Referencias y notas</FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Ej: Portón café, frente al parque..." 
                                {...field} 
                                className="min-h-[100px] rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium resize-none p-4"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Por favor, verifica que todos los datos sean correctos para asegurar que tus flores lleguen puntuales y frescas a su destino.
            </p>
        </div>
       
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
                type="submit" 
                className="flex-1 h-16 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all gap-2" 
                loading={isSaving}
            >
                <CheckCircle className="h-5 w-5" />
                Guardar Dirección
            </Button>
            <Button 
                type="button" 
                variant="ghost" 
                onClick={onCancel} 
                disabled={isSaving}
                className="h-16 rounded-2xl font-bold text-muted-foreground"
            >
                Cancelar
            </Button>
        </div>
      </form>
    </Form>
  );
}
