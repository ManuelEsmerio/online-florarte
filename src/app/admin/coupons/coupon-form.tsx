
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import * as z from 'zod';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown, Dices, Users, Package, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Coupon, User, ProductCategory, Product } from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Stepper } from '@/components/ui/stepper';
import { Badge } from '@/components/ui/badge';
import MultiSelect from '@/components/MultiSelect';

const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;

const CouponScope = {
  GLOBAL: 'GLOBAL',
  USERS: 'USERS',
  PRODUCTS: 'PRODUCTS',
  CATEGORIES: 'CATEGORIES',
} as const;

const normalizeCouponScope = (scope?: Coupon['scope']) => {
  if (scope === CouponScope.USERS || scope === CouponScope.PRODUCTS || scope === CouponScope.CATEGORIES) {
    return scope;
  }
  return CouponScope.GLOBAL;
};


const couponSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción es muy corta.'),
  discount_type: z.enum([DiscountType.PERCENTAGE, DiscountType.FIXED], { required_error: 'Debes seleccionar un tipo de descuento.'}),
  discount_value: z.coerce.number().positive('El valor del descuento debe ser positivo.'),
  
  scope: z.enum([CouponScope.GLOBAL, CouponScope.USERS, CouponScope.PRODUCTS, CouponScope.CATEGORIES], { required_error: 'Debes seleccionar un ámbito.'}),
  user_ids: z.array(z.number()).optional(),
  product_ids: z.array(z.number()).optional(),
  category_ids: z.array(z.number()).optional(),

  validity: z.object({
    from: z.date({ required_error: 'Se requiere una fecha de inicio.' }),
    to: z.date().optional().nullable(),
  }).optional(),
  noExpiry: z.boolean().optional(),
  max_uses: z.union([z.coerce.number().int().min(0, 'El límite de usos no puede ser negativo.'), z.literal('')]).optional(),
}).superRefine((data, ctx) => {
  if (data.discount_type === DiscountType.PERCENTAGE && data.discount_value > 99) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El descuento no puede ser mayor al 99%.', path: ['discount_value'] });
    }
    if (data.scope === CouponScope.USERS && (!data.user_ids || data.user_ids.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar al menos un usuario.', path: ['user_ids'] });
    }
    if (data.scope === CouponScope.PRODUCTS && (!data.product_ids || data.product_ids.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar al menos un producto.', path: ['product_ids'] });
    }
    if (data.scope === CouponScope.CATEGORIES && (!data.category_ids || data.category_ids.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar al menos una categoría.', path: ['category_ids'] });
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
                <FormField control={control} name="discount_type" render={({ field }) => (<FormItem><FormLabel>Tipo de Descuento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value={DiscountType.PERCENTAGE}>Porcentaje (%)</SelectItem><SelectItem value={DiscountType.FIXED}>Fijo (MXN)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="discount_value" render={({ field }) => (<FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" min="0" max={discountType === DiscountType.PERCENTAGE ? "99" : undefined} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
    )
}

const Step2 = ({ customers, products, categories }: Pick<CouponFormProps, 'customers'|'products'|'categories'>) => {
    const { control, watch } = useFormContext<CouponFormValues>();
    const couponScope = watch('scope');

    const scopeOptions = [
        { value: CouponScope.GLOBAL, label: 'Global', description: 'Aplica a todos los productos y clientes.', icon: <Users className="h-5 w-5" /> },
        { value: CouponScope.USERS, label: 'Usuarios Específicos', description: 'Solo para los clientes que selecciones.', icon: <Users className="h-5 w-5" /> },
        { value: CouponScope.PRODUCTS, label: 'Productos Específicos', description: 'Solo para una selección de productos.', icon: <Package className="h-5 w-5" /> },
        { value: CouponScope.CATEGORIES, label: 'Categorías Específicas', description: 'Para todos los productos de las categorías seleccionadas.', icon: <LayoutList className="h-5 w-5" /> },
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
                        <div key={option.value} onClick={() => field.onChange(option.value)}
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
            {couponScope === CouponScope.USERS && (
                <FormField control={control} name="user_ids" render={({ field }) => (<FormItem><FormLabel>Clientes</FormLabel><FormControl><MultiSelect options={customers.map(c => ({ value: c.id, label: c.name }))} selected={field.value ?? []} onChange={field.onChange} placeholder="Selecciona clientes..." /></FormControl><FormMessage /></FormItem>)} />
            )}
             {couponScope === CouponScope.PRODUCTS && (
                <FormField control={control} name="product_ids" render={({ field }) => (<FormItem><FormLabel>Productos</FormLabel><FormControl><MultiSelect options={products.map(p => ({ value: p.id, label: p.name }))} selected={field.value ?? []} onChange={field.onChange} placeholder="Selecciona productos..." /></FormControl><FormMessage /></FormItem>)} />
            )}
             {couponScope === CouponScope.CATEGORIES && (
               <FormField control={control} name="category_ids" render={({ field }) => (<FormItem><FormLabel>Categorías</FormLabel><FormControl><MultiSelect options={categories.filter(c => !c.parentId).map(c => ({ value: c.id, label: c.name }))} selected={field.value ?? []} onChange={field.onChange} placeholder="Selecciona categorías..." /></FormControl><FormMessage /></FormItem>)} />
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
  
    return (
        <div className="space-y-4">
             <FormField control={control} name="max_uses" render={({ field }) => (<FormItem><FormLabel>Límite de Usos Totales</FormLabel><FormControl><Input type="number" min="0" placeholder="Ilimitado" {...field} /></FormControl><FormDescription className="text-xs">Dejar en blanco para usos ilimitados en total.</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={control} name="validity" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Vigencia</FormLabel>
                   <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button id="date" variant={"outline"} disabled={noExpiry} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y", { locale: es })} - {format(field.value.to, "LLL dd, y", { locale: es })}</>) : (format(field.value.from, "LLL dd, y", { locale: es }))) : (<span>Selecciona un rango de fechas</span>)}</Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value ? { from: field.value.from, to: field.value.to ?? undefined } : undefined} onSelect={handleDateSelect} numberOfMonths={1} locale={es} /></PopoverContent>
                    </Popover><FormMessage />
                </FormItem>
              )}
            />
             <FormField control={control} name="noExpiry" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => { field.onChange(checked); if (checked) setValue('validity', { from: new Date(), to: null }); }} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Sin fecha de vencimiento</FormLabel></div></FormItem>)} />
        </div>
    )
}


export function CouponForm({ isOpen, onOpenChange, onSave, coupon, isSaving, customers, products, categories }: CouponFormProps) {
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '', description: '', discount_type: DiscountType.PERCENTAGE, discount_value: 10,
      scope: CouponScope.GLOBAL, user_ids: [], product_ids: [], category_ids: [],
      max_uses: '', noExpiry: false,
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (coupon) {
            form.reset({
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
              discount_type: coupon.discountType,
              discount_value: coupon.discountValue,
                scope: normalizeCouponScope(coupon.scope),
                user_ids: coupon.details?.users?.map(u => u.id) || [],
                product_ids: coupon.details?.products?.map(p => p.id) || [],
                category_ids: coupon.details?.categories?.map(c => c.id) || [],
              validity: { from: new Date(coupon.validFrom), to: coupon.validUntil ? new Date(coupon.validUntil) : null },
              noExpiry: !coupon.validUntil,
              max_uses: coupon.maxUses ?? '',
            });
        } else {
            form.reset({
                code: '', description: '', discount_type: DiscountType.PERCENTAGE, discount_value: 10,
                validity: undefined, noExpiry: false, scope: CouponScope.GLOBAL,
                user_ids: [], product_ids: [], category_ids: [], max_uses: '',
            });
        }
    }
  }, [coupon, form, isOpen]);

  const onSubmit = (data: CouponFormValues) => {
    const finalData = {
      ...data,
      id: data.id || undefined,
      max_uses: data.max_uses === '' ? null : Number(data.max_uses),
      valid_from: data.validity?.from,
      valid_until: data.noExpiry ? null : data.validity?.to,
    };
    onSave(finalData, data.id);
  };
  
  const steps = [ { label: "Detalles" }, { label: "Alcance" }, { label: "Reglas" }];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col h-auto max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-headline text-2xl">{coupon ? 'Editar Cupón' : 'Crear Cupón'}</DialogTitle><DialogDescription>{coupon ? 'Modifica los detalles del cupón.' : 'Completa los pasos para crear un nuevo cupón.'}</DialogDescription></DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <Stepper initialStep={0} steps={steps}>
              {(stepperProps) => (
                <>
                  <div className="px-6 pt-4 border-b"><Stepper.Navigation /></div>
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-6 min-h-0">
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
                                      ["code", "description", "discount_type", "discount_value"],
                                      ["scope", "user_ids", "product_ids", "category_ids"],
                                      ["max_uses", "validity", "noExpiry"]
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
