
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
import { Switch } from '@/components/ui/switch';

const zoneSchema = z.object({
  id: z.number().optional(),
  postalCode: z.string().min(3, 'El código postal es requerido.').max(10, 'Máximo 10 caracteres.'),
  locality: z.string().min(3, 'La localidad es requerida.'),
  shippingCost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  settlementType: z.string().max(100, 'Máximo 100 caracteres.').optional().nullable(),
  municipality: z.string().max(150, 'Máximo 150 caracteres.').optional().nullable(),
  state: z.string().max(100, 'Máximo 100 caracteres.').optional().nullable(),
  stateCode: z.string().max(5, 'Máximo 5 caracteres.').optional().nullable(),
  municipalityCode: z.string().max(5, 'Máximo 5 caracteres.').optional().nullable(),
  postalOfficeCode: z.string().max(10, 'Máximo 10 caracteres.').optional().nullable(),
  zone: z.string().max(50, 'Máximo 50 caracteres.').optional().nullable(),
  isActive: z.boolean().default(true),
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
      settlementType: '',
      municipality: '',
      state: '',
      stateCode: '',
      municipalityCode: '',
      postalOfficeCode: '',
      zone: '',
      isActive: true,
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (zone) {
          form.reset({
            id: zone.id,
            postalCode: zone.postalCode,
            locality: zone.locality,
            shippingCost: zone.shippingCost,
            settlementType: zone.settlementType ?? '',
            municipality: zone.municipality ?? '',
            state: zone.state ?? '',
            stateCode: zone.stateCode ?? '',
            municipalityCode: zone.municipalityCode ?? '',
            postalOfficeCode: zone.postalOfficeCode ?? '',
            zone: zone.zone ?? '',
            isActive: zone.isActive,
          });
        } else {
          form.reset({
            postalCode: '',
            locality: '',
            shippingCost: 0,
            settlementType: '',
            municipality: '',
            state: '',
            stateCode: '',
            municipalityCode: '',
            postalOfficeCode: '',
            zone: '',
            isActive: true,
          });
        }
    }
  }, [zone, isOpen, form]);

  const onSubmit = (data: ZoneFormValues) => {
    const { id: _id, ...payload } = data;
    onSave(payload, zone?.id);
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
                      <Input type="number" step="0.01" min="0" className="pl-8" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="municipality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Municipio</FormLabel>
                    <FormControl>
                      <Input placeholder="Tequila" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Jalisco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="settlementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Asentamiento</FormLabel>
                    <FormControl>
                      <Input placeholder="Colonia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stateCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="14" maxLength={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="municipalityCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave Municipio</FormLabel>
                    <FormControl>
                      <Input placeholder="084" maxLength={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalOfficeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave Oficina Postal</FormLabel>
                    <FormControl>
                      <Input placeholder="47600" maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Logística</FormLabel>
                    <FormControl>
                      <Input placeholder="urbana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-2xl border border-border/50 p-4">
                  <div>
                    <FormLabel className="text-base">Zona activa</FormLabel>
                    <p className="text-sm text-muted-foreground">Controla si los clientes pueden seleccionar esta zona.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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

