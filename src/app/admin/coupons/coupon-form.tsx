'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Dices, Users, Package, LayoutList, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Coupon, User, ProductCategory, Product, CouponScope, DiscountType } from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Stepper } from '@/components/ui/stepper';
import MultiSelect from '@/components/MultiSelect';

const couponSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción es muy corta.'),
  discount_type: z.enum(['percentage', 'fixed'], { required_error: 'Debes seleccionar un tipo de descuento.'}),
  value: z.coerce.number().positive('El valor del descuento debe ser positivo.'),
  
  scope: z.enum(['global', 'user', 'product', 'category'], { required_error: 'Debes seleccionar un ámbito.'}),
  applicable_ids: z.array(z.number()).optional(),

  validity: z.object({
    from: z.date({ required_error: 'Se requiere una fecha de inicio.' }),
    to: z.date().optional().nullable(),
  }).optional(),
  noExpiry: z.boolean().optional(),
  max_uses: z.union([z.coerce.number().int().min(0, 'El límite de usos no puede ser negativo.'), z.literal('')]).optional(),
  min_purchase: z.union([z.coerce.number().min(0, 'La compra mínima no puede ser negativa.'), z.literal('')]).optional(),
}).superRefine((data, ctx) => {
    if (data.discount_type === 'percentage' && data.value > 99) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El descuento no puede ser mayor al 99%.', path: ['value'] });
    }
    if (data.scope !== 'global' && (!data.applicable_ids || data.applicable_ids.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar al menos un ítem.', path: ['applicable_ids'] });
    }
    if (!data.noExpiry && !data.validity?.from) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar un rango de fechas o marcar "Sin fecha de vencimiento".', path: ['validity'] });
    }
});


type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (coupon: any, id?: number) => void;
  coupon: Coupon | null;
  isSaving: boolean;
  customers: User[];
  products: Product[];
  categories: ProductCategory[];
}

const Step1 = () => {
    const { control, setValue, watch } = useFormContext<CouponFormValues>();
    const discountType = watch('discount_type');

    const generateCouponCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setValue('code', result, { shouldValidate: true });
    };

    return (
        <div className="space-y-4">
             <FormField
              control={control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código del Cupón</FormLabel>
                   <div className="relative">
                    <FormControl>
                        <Input placeholder="VERANO25" {...field} autoCapitalize="characters" className="pr-10 uppercase font-mono" />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-primary" onClick={generateCouponCode}><Dices className="h-4 w-4" /><span className="sr-only">Generar</span></Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Ej: 25% de descuento en toda la tienda." {...field} /></FormControl><FormMessage /></FormItem>)} />
             <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="discount_type" render={({ field }) => (<FormItem><FormLabel>Tipo de Descuento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="percentage">Porcentaje (%)</SelectItem><SelectItem value="fixed">Fijo (MXN)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="value" render={({ field }) => (<FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" min="0" max={discountType === 'percentage' ? "99" : undefined} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
    )
}

const Step2 = ({ customers, products, categories }: Pick<CouponFormProps, 'customers'|'products'|'categories'>) => {
    const { control, watch, setValue } = useFormContext<CouponFormValues>();
    const couponScope = watch('scope');

    const scopeOptions: { value: CouponScope, label: string; description: string; icon: JSX.Element }[] = [
        { value: 'global', label: 'Global', description: 'Aplica a todos los productos y clientes.', icon: <Globe className="h-5 w-5" /> },
        { value: 'user', label: 'Usuarios Específicos', description: 'Solo para los clientes que selecciones.', icon: <Users className="h-5 w-5" /> },
        { value: 'product', label: 'Productos Específicos', description: 'Solo para una selección de productos.', icon: <Package className="h-5 w-5" /> },
        { value: 'category', label: 'Categorías Específicas', description: 'Para todos los productos de las categorías seleccionadas.', icon: <LayoutList className="h-5 w-5" /> },
    ];
    
    return (
        <div className="space-y-4">
            <FormField
              control={control}
              name="scope"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Ámbito del Cupón</FormLabel>
                   <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {scopeOptions.map(option => (
                        <div key={option.value} onClick={() => { field.onChange(option.value); setValue('applicable_ids', []); }}
                           className={cn("p-4 rounded-lg border-2 cursor-pointer transition-all", field.value === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                           <div className="flex items-center gap-3">
                             <div className="text-primary">{option.icon}</div>
                             <h4 className="font-semibold">{option.label}</h4>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </div>
                       ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {couponScope !== 'global' && (
                <FormField control={control} name="applicable_ids" render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {couponScope === 'user' && 'Clientes'}
                            {couponScope === 'product' && 'Productos'}
                            {couponScope === 'category' && 'Categorías'}
                        </FormLabel>
                        <FormControl>
                            <MultiSelect 
                                options={
                                    couponScope === 'user' ? customers.map(c => ({ value: c.id, label: c.name })) :
                                    couponScope === 'product' ? products.map(p => ({ value: p.id, label: p.name })) :
                                    couponScope === 'category' ? categories.filter(c=>!c.parent_id).map(c => ({ value: c.id, label: c.name })) : []
                                }
                                selected={field.value ?? []} 
                                onChange={field.onChange} 
                                placeholder={`Selecciona ${couponScope}s...`}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            )}
        </div>
    )
}

const Step3 = () => {
    const { control, watch, setValue } = useFormContext<CouponFormValues>();
    const noExpiry = watch('noExpiry');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    const handleDateSelect = (range: DateRange | undefined) => {
        if (range?.from) {
            setValue('validity', { from: range.from, to: range.to || null }, { shouldValidate: true });
            if (range.to) setIsCalendarOpen(false);
        } else {
            setValue('validity', undefined, { shouldValidate: true });
        }
    }
  
    useEffect(() => {
        if (noExpiry) {
            setValue('validity', { from: new Date(), to: null });
        }
    }, [noExpiry, setValue]);
    
    return (
        <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="max_uses" render={({ field }) => (<FormItem><FormLabel>Límite de Usos</FormLabel><FormControl><Input type="number" min="0" placeholder="Ilimitado" {...field} /></FormControl><FormDescription className="text-xs">Dejar en blanco para ilimitado.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={control} name="min_purchase" render={({ field }) => (<FormItem><FormLabel>Compra Mínima (MXN)</FormLabel><FormControl><Input type="number" min="0" placeholder="Sin mínimo" {...field} /></FormControl><FormDescription className="text-xs">Dejar en blanco si no hay.</FormDescription><FormMessage /></FormItem>)} />
            </div>
            <FormField control={control} name="validity" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Vigencia</FormLabel>
                   <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} disabled={noExpiry} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y", { locale: es })} - {format(field.value.to, "LLL dd, y", { locale: es })}</>) : (format(field.value.from, "LLL dd, y", { locale: es }))) : (<span>Selecciona un rango de fechas</span>)}</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value} onSelect={handleDateSelect} numberOfMonths={1} locale={es} /></PopoverContent>
                    </Popover><FormMessage />
                </FormItem>
              )}
            />
             <FormField control={control} name="noExpiry" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Sin fecha de vencimiento</FormLabel></div></FormItem>)} />
        </div>
    )
}


export function CouponForm({ isOpen, onOpenChange, onSave, coupon, isSaving, customers, products, categories }: CouponFormProps) {
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '', description: '', discount_type: 'percentage', value: 10,
      scope: 'global', applicable_ids: [],
      max_uses: '', min_purchase: '', noExpiry: false,
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (coupon) {
            form.reset({
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
                discount_type: coupon.discount_type,
                value: coupon.value,
                scope: coupon.scope || 'global',
                applicable_ids: coupon.applicable_ids || [],
                validity: { from: new Date(coupon.valid_from), to: coupon.valid_until ? new Date(coupon.valid_until) : null },
                noExpiry: !coupon.valid_until,
                max_uses: coupon.max_uses ?? '',
                min_purchase: coupon.min_purchase ?? '',
            });
        } else {
            form.reset({
                code: '', description: '', discount_type: 'percentage', value: 10,
                validity: undefined, noExpiry: false, scope: 'global',
                applicable_ids: [], max_uses: '', min_purchase: '',
            });
        }
    }
  }, [coupon, form, isOpen]);

  const onSubmit = (data: CouponFormValues) => {
    const finalData = {
      code: data.code.toUpperCase(),
      description: data.description,
      discount_type: data.discount_type,
      value: data.value,
      scope: data.scope,
      applicable_ids: data.scope === 'global' ? [] : data.applicable_ids,
      max_uses: data.max_uses === '' ? null : Number(data.max_uses),
      min_purchase: data.min_purchase === '' ? null : Number(data.min_purchase),
      valid_from: data.validity?.from.toISOString(),
      valid_until: data.noExpiry ? null : data.validity?.to?.toISOString() ?? null,
    };
    onSave(finalData, data.id);
  };
  
  const steps = [ { label: "Detalles" }, { label: "Alcance" }, { label: "Reglas" }];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col h-auto max-h-[90vh]">
        <DialogHeader><DialogTitle className="font-headline text-2xl">{coupon ? 'Editar Cupón' : 'Crear Cupón'}</DialogTitle><DialogDescription>{coupon ? 'Modifica los detalles del cupón.' : 'Completa los pasos para crear un nuevo cupón.'}</DialogDescription></DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <Stepper initialStep={0} steps={steps}>
              {(stepperProps) => (
                <>
                  <div className="px-6 pt-4 border-b"><Stepper.Navigation /></div>
                  <div className="flex-grow overflow-y-auto p-6 min-h-0">
                    <Stepper.Step index={0}><Step1 /></Stepper.Step>
                    <Stepper.Step index={1}><Step2 customers={customers} products={products} categories={categories} /></Stepper.Step>
                    <Stepper.Step index={2}><Step3 /></Stepper.Step>
                  </div>
                   <DialogFooter className="p-6 border-t flex-shrink-0 flex-col-reverse sm:flex-row sm:justify-between w-full gap-2">
                      <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full sm:w-auto">Cancelar</Button>
                      <div className='flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto'>
                          {!stepperProps.isFirstStep && <Button type="button" variant="outline" onClick={stepperProps.prevStep} disabled={isSaving} className="w-full sm:w-auto">Atrás</Button>}
                          <Button type="button" loading={isSaving && stepperProps.isLastStep} disabled={isSaving}
                              onClick={async () => {
                                  const isLast = stepperProps.isLastStep;
                                  const stepFields: (keyof CouponFormValues)[][] = [
                                      ["code", "description", "discount_type", "value"],
                                      ["scope", "applicable_ids"],
                                      ["max_uses", "min_purchase", "validity", "noExpiry"]
                                  ];
                                  const isValid = await form.trigger(stepFields[stepperProps.activeStep]);
                                  if (isValid) {
                                      if (isLast) form.handleSubmit(onSubmit)();
                                      else stepperProps.nextStep();
                                  }
                              }} className="w-full sm:w-auto">
                              {stepperProps.isLastStep ? (isSaving ? 'Guardando...' : 'Guardar Cupón') : 'Siguiente'}
                          </Button>
                      </div>
                    </DialogFooter>
                </>
              )}
            </Stepper>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
