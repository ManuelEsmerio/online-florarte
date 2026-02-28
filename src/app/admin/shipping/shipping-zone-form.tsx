
'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';
import type { ShippingZone } from '@/lib/definitions';

const zoneSchema = z.object({
  id: z.number().optional(),
  postalCode: z.string().min(5, 'El código postal debe tener 5 dígitos.').max(5, 'El código postal debe tener 5 dígitos.'),
  locality: z.string().min(3, 'La localidad es requerida.'),
  shippingCost: z.coerce.number().int().min(0, 'El costo no puede ser negativo.'),
});

type ZoneFormValues = z.infer<typeof zoneSchema>;

interface ShippingZoneFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<ZoneFormValues, 'id'>, id?: number) => void;
  zone: ShippingZone | null;
  isSaving: boolean;
}

export function ShippingZoneForm({ isOpen, onOpenChange, onSave, zone, isSaving }: ShippingZoneFormProps) {
  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      postalCode: '',
      locality: '',
      shippingCost: 0,
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (zone) {
          form.reset({
            id: zone.id,
            postalCode: zone.postalCode,
            locality: zone.locality,
            shippingCost: zone.shippingCost
          });
        } else {
          form.reset({ postalCode: '', locality: '', shippingCost: 0 });
        }
    }
  }, [zone, isOpen, form]);

  const onSubmit = (data: ZoneFormValues) => {
    const dataToSend = {
      postal_code: data.postalCode,
      locality: data.locality,
      shipping_cost: data.shippingCost
    }
    onSave(dataToSend as any, zone?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{zone ? 'Editar Zona de Envío' : 'Crear Zona de Envío'}</DialogTitle>
          <DialogDescription>{zone ? 'Modifica los detalles de la zona.' : 'Completa el formulario para crear una nueva zona de envío.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal</FormLabel>
                  <FormControl>
                    <Input placeholder="46400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Tequila Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo de Envío</FormLabel>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" step="1" min="0" className="pl-8" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" loading={isSaving}>Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

