
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
import { CalendarIcon, Dices, Users, Package, LayoutList, Tag, Percent, DollarSign, Globe, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Coupon, User, ProductCategory, Product } from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';
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
  discount_type: z.enum([DiscountType.PERCENTAGE, DiscountType.FIXED], { required_error: 'Debes seleccionar un tipo de descuento.' }),
  discount_value: z.coerce.number().positive('El valor del descuento debe ser positivo.'),
  scope: z.enum([CouponScope.GLOBAL, CouponScope.USERS, CouponScope.PRODUCTS, CouponScope.CATEGORIES], { required_error: 'Debes seleccionar un ámbito.' }),
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
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setValue('code', result, { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      {/* Código y descripción */}
      <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />Identificación</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Código único que el cliente usará al pagar.</p>
        </div>
        <FormField
          control={control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código del Cupón <span className="text-destructive">*</span></FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="VERANO25"
                    {...field}
                    autoCapitalize="characters"
                    className="pr-10 uppercase font-mono tracking-widest"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-primary"
                  onClick={generateCouponCode}
                  title="Generar código aleatorio"
                >
                  <Dices className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción interna <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ej: 25% de descuento en toda la tienda durante el verano."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Tipo y valor */}
      <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Percent className="h-4 w-4 text-primary" />Descuento</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Define el tipo y monto del beneficio.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[200]">
                    <SelectItem value={DiscountType.PERCENTAGE}>
                      <span className="flex items-center gap-2"><Percent className="h-3.5 w-3.5" />Porcentaje (%)</span>
                    </SelectItem>
                    <SelectItem value={DiscountType.FIXED}>
                      <span className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" />Fijo (MXN)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="discount_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {discountType === DiscountType.PERCENTAGE ? '%' : '$'}
                    </span>
                    <Input type="number" min="0" max={discountType === DiscountType.PERCENTAGE ? '99' : undefined} className="pl-7" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

const Step2 = ({ customers, products, categories }: Pick<CouponFormProps, 'customers' | 'products' | 'categories'>) => {
  const { control, watch } = useFormContext<CouponFormValues>();
  const couponScope = watch('scope');

  const scopeOptions = [
    { value: CouponScope.GLOBAL, label: 'Global', description: 'Para todos los productos y clientes.', icon: <Globe className="h-4 w-4" /> },
    { value: CouponScope.USERS, label: 'Usuarios específicos', description: 'Solo para los clientes seleccionados.', icon: <Users className="h-4 w-4" /> },
    { value: CouponScope.PRODUCTS, label: 'Productos específicos', description: 'Solo para una selección de productos.', icon: <Package className="h-4 w-4" /> },
    { value: CouponScope.CATEGORIES, label: 'Categorías', description: 'Para todos los productos de las categorías.', icon: <LayoutList className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Ámbito del cupón</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Define a quién o qué aplica este descuento.</p>
        </div>
        <FormField
          control={control}
          name="scope"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scopeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'p-4 rounded-2xl border-2 text-left transition-all w-full',
                        field.value === option.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 bg-background hover:border-primary/40'
                      )}
                    >
                      <div className={cn('flex items-center gap-2 mb-1', field.value === option.value ? 'text-primary' : 'text-muted-foreground')}>
                        {option.icon}
                        <span className="text-sm font-semibold text-foreground">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {(couponScope === CouponScope.USERS || couponScope === CouponScope.PRODUCTS || couponScope === CouponScope.CATEGORIES) && (
        <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold">Selección específica</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Elige los elementos a los que aplica el cupón.</p>
          </div>
          {couponScope === CouponScope.USERS && (
            <FormField control={control} name="user_ids" render={({ field }) => (
              <FormItem>
                <FormLabel>Clientes</FormLabel>
                <FormControl>
                  <MultiSelect options={customers.map(c => ({ value: c.id, label: c.name }))} selected={field.value ?? []} onChange={field.onChange} placeholder="Buscar clientes..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
          {couponScope === CouponScope.PRODUCTS && (
            <FormField control={control} name="product_ids" render={({ field }) => (
              <FormItem>
                <FormLabel>Productos</FormLabel>
                <FormControl>
                  <MultiSelect options={products.map(p => ({ value: p.id, label: p.name }))} selected={field.value ?? []} onChange={field.onChange} placeholder="Buscar productos..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
          {couponScope === CouponScope.CATEGORIES && (
            <FormField control={control} name="category_ids" render={({ field }) => (
              <FormItem>
                <FormLabel>Categorías</FormLabel>
                <FormControl>
                  <MultiSelect options={categories.filter(c => !c.parentId).map(c => ({ value: c.id, label: c.name }))} selected={field.value ?? []} onChange={field.onChange} placeholder="Buscar categorías..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>
      )}
    </div>
  );
};

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
  };

  return (
    <div className="space-y-5">
      {/* Vigencia */}
      <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" />Vigencia</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Período durante el cual el cupón será válido.</p>
        </div>
        <FormField
          control={control}
          name="validity"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Rango de fechas</FormLabel>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      id="date"
                      variant="outline"
                      disabled={noExpiry}
                      className={cn('w-full justify-start text-left font-normal', !field.value?.from && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value?.from ? (
                        field.value.to
                          ? <>{format(field.value.from, 'dd MMM yyyy', { locale: es })} → {format(field.value.to, 'dd MMM yyyy', { locale: es })}</>
                          : format(field.value.from, 'dd MMM yyyy', { locale: es })
                      ) : (
                        <span>Selecciona un rango de fechas</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[200]" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={field.value ? { from: field.value.from, to: field.value.to ?? undefined } : undefined}
                    onSelect={handleDateSelect}
                    numberOfMonths={1}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="noExpiry"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) setValue('validity', { from: new Date(), to: null });
                  }}
                />
              </FormControl>
              <div className="flex items-center gap-2">
                <Infinity className="h-4 w-4 text-muted-foreground" />
                <FormLabel className="cursor-pointer font-medium text-sm m-0">Sin fecha de vencimiento</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Límite de usos */}
      <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Límite de uso</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Controla cuántas veces puede usarse este cupón en total.</p>
        </div>
        <FormField
          control={control}
          name="max_uses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usos máximos</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="Sin límite" {...field} />
              </FormControl>
              <FormDescription className="text-xs">Dejar en blanco para usos ilimitados.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export function CouponForm({ isOpen, onOpenChange, onSave, coupon, isSaving, customers, products, categories }: CouponFormProps) {
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '', description: '', discount_type: DiscountType.PERCENTAGE, discount_value: 10,
      scope: CouponScope.GLOBAL, user_ids: [], product_ids: [], category_ids: [],
      max_uses: '', noExpiry: false,
    },
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

  const steps = [
    { label: 'Detalles', icon: <Tag className="h-5 w-5" /> },
    { label: 'Alcance', icon: <Globe className="h-5 w-5" /> },
    { label: 'Reglas', icon: <CalendarIcon className="h-5 w-5" /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl flex flex-col p-0 max-h-[92vh] rounded-2xl overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b bg-background/95">
          <DialogTitle className="font-headline text-2xl tracking-tight">
            {coupon ? 'Editar Cupón' : 'Crear Cupón'}
          </DialogTitle>
          <DialogDescription>
            {coupon ? `Modificando código: ${coupon.code}` : 'Completa los pasos para crear un nuevo cupón de descuento.'}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <Stepper initialStep={0} steps={steps}>
              {(stepperProps) => (
                <>
                  {/* Barra de progreso */}
                  <div className="h-1.5 w-full bg-muted/40 flex-shrink-0">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((stepperProps.activeStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>

                  {/* Layout sidebar + contenido */}
                  <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-background/60">
                    {/* Sidebar vertical */}
                    <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r bg-muted/25 p-5 overflow-y-auto flex flex-col">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
                        {coupon ? 'Panel de edición' : 'Panel de creación'}
                      </p>
                      <div className="space-y-2">
                        {steps.map((step, index) => {
                          const isActive = stepperProps.activeStep === index;
                          const isCompleted = stepperProps.activeStep > index;
                          return (
                            <button
                              key={step.label}
                              type="button"
                              onClick={() => stepperProps.setStep(index)}
                              className={cn(
                                'w-full text-left rounded-xl border px-3 py-3 transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                  : isCompleted
                                    ? 'bg-background border-border/60 hover:bg-muted/40'
                                    : 'bg-transparent border-transparent hover:bg-muted/40'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'w-8 h-8 rounded-full grid place-items-center text-xs font-semibold',
                                  isActive ? 'bg-white/20' : isCompleted ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-muted'
                                )}>
                                  {isCompleted ? '✓' : index + 1}
                                </div>
                                <p className="text-sm font-medium flex-1 truncate">{step.label}</p>
                                <span className={cn('opacity-80', isActive ? 'text-white' : 'text-muted-foreground')}>
                                  {step.icon}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-auto pt-5 border-t">
                        <div className="bg-muted/40 rounded-lg p-3 text-xs">
                          <p className="uppercase tracking-widest text-[10px] text-muted-foreground">Vista previa</p>
                          <p className="mt-1 font-mono font-bold truncate text-primary">
                            {form.watch('code') || 'Sin código'}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {form.watch('discount_value')}{form.watch('discount_type') === DiscountType.PERCENTAGE ? '%' : ' MXN'} de descuento
                          </p>
                        </div>
                      </div>
                    </aside>

                    {/* Contenido del paso */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-muted/10">
                      <Stepper.Step index={0}><Step1 /></Stepper.Step>
                      <Stepper.Step index={1}><Step2 customers={customers} products={products} categories={categories} /></Stepper.Step>
                      <Stepper.Step index={2}><Step3 /></Stepper.Step>
                    </div>
                  </div>

                  <DialogFooter className="px-6 py-4 border-t flex-shrink-0 flex-col sm:flex-row sm:justify-between bg-background/95">
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-lg"
                      onClick={() => onOpenChange(false)}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <div className="flex gap-2 sm:justify-end">
                      {!stepperProps.isFirstStep && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-lg"
                          onClick={stepperProps.prevStep}
                          disabled={isSaving}
                        >
                          Atrás
                        </Button>
                      )}
                      <Button
                        type="button"
                        className="rounded-lg min-w-36"
                        loading={isSaving && stepperProps.isLastStep}
                        disabled={isSaving}
                        onClick={async () => {
                          const stepFields: (keyof CouponFormValues)[][] = [
                            ['code', 'description', 'discount_type', 'discount_value'],
                            ['scope', 'user_ids', 'product_ids', 'category_ids'],
                            ['max_uses', 'validity', 'noExpiry'],
                          ];
                          const isValid = await form.trigger(stepFields[stepperProps.activeStep]);
                          if (isValid) {
                            if (stepperProps.isLastStep) form.handleSubmit(onSubmit)();
                            else stepperProps.nextStep();
                          }
                        }}
                      >
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
