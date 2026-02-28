
// src/app/admin/products/product-form.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2, X, UploadCloud, Info, DollarSign, List, Camera, PlusCircle, Copy } from 'lucide-react';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Stepper } from '@/components/ui/stepper';
import type { Product, ProductCategory, Occasion, ProductVariant, Tag } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import MultiSelect from '@/components/MultiSelect';
import { Badge } from '@/components/ui/badge';

// --- ZOD Schemas ---
const imageSchema = z.object({
  id: z.number().optional(),
  file: z.instanceof(File).optional(),
  src: z.string(),
  alt: z.string().optional(),
  isNew: z.boolean(),
  display_order: z.number().optional(),
  is_deleted: z.boolean().optional(),
});

const variantSchema = z.object({
  id: z.number().optional(),
    product_name: z.string().min(1, "El nombre de producto de la variante es requerido."),
  name: z.string().min(1, "El nombre de la variante es requerido."),
  price: z.coerce.number({invalid_type_error: "El precio es requerido."}).min(0.01, "El precio debe ser positivo."),
  sale_price: z.coerce.number().optional().nullable(),
  stock: z.coerce.number({invalid_type_error: "El stock es requerido."}).int().min(0, "El stock no puede ser negativo."),
  code: z.string().optional().nullable(),
    short_description: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional().nullable(),
  images: z.array(imageSchema).optional().default([]),
  is_deleted: z.boolean().optional(),
});

const productFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  slug: z.string().optional(),
  code: z.string().optional(),
    badge_text: z.string().max(40, 'El badge no debe exceder 40 caracteres.').optional().nullable(),
  description: z.string().optional(),
  short_description: z.string().max(160, 'La descripción corta no debe exceder los 160 caracteres.').optional(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional().nullable(),
  category_id: z.coerce.number({ required_error: "Debes seleccionar una categoría." }).gt(0, "Debes seleccionar una categoría."),
  occasion_ids: z.array(z.number()).optional().default([]),
  tag_ids: z.array(z.number()).optional().default([]),
  
  images: z.array(imageSchema).optional().default([]),

  has_variants: z.boolean().default(false),
  price: z.coerce.number().optional(),
  sale_price: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().optional(),
  variants: z.array(variantSchema).optional().default([]),

  care: z.string().optional(),
  allow_photo: z.boolean().default(false),
  photo_price: z.coerce.number().optional(),
  status: z.string().optional().default('PUBLISHED'),
}).superRefine((data, ctx) => {
    if (data.has_variants) {
        if (!data.variants || data.variants.filter(v => !v.is_deleted).length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debes agregar al menos una variante.", path: ["variants"] });
        }
    } else {
        if (data.price === undefined || data.price === null || isNaN(data.price) || data.price <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El precio es requerido y debe ser mayor a 0.", path: ["price"] });
        }
        if (data.stock === undefined || data.stock === null || isNaN(data.stock) || data.stock < 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El stock es requerido y no puede ser negativo.", path: ["stock"] });
        }
    }
    if (data.allow_photo && (data.photo_price === undefined || data.photo_price <= 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El precio de la foto debe ser mayor a 0.", path: ["photo_price"] });
    }
});

type ProductFormValues = z.infer<typeof productFormSchema>;
type ImageObject = z.infer<typeof imageSchema>;

const getProductEditDraftKey = (productId: number) => `admin:product-edit-draft:${productId}`;

const sanitizeImagesForDraft = (images: any[] = []) =>
    images.map(({ file, ...image }) => image);

const sanitizeProductDraft = (values: ProductFormValues): ProductFormValues => {
    const draft: any = {
        ...values,
        images: sanitizeImagesForDraft((values as any).images || []),
        variants: ((values as any).variants || []).map((variant: any) => ({
            ...variant,
            images: sanitizeImagesForDraft(variant.images || []),
        })),
    };

    return draft;
};


// --- SUB-COMPONENTS for FORM STEPS ---
function Step1_Info({ categories, occasions, tags }: { categories: ProductCategory[], occasions: Occasion[], tags: Tag[] }) {
    const { control, watch } = useFormContext<ProductFormValues>();
    const mainCategories = useMemo(() => categories.filter((cat: any) => !(cat?.parent_id ?? cat?.parentId)), [categories]);
    watch('status');
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5 shadow-sm">
                <div>
                    <h3 className="text-base font-semibold">Identidad del producto</h3>
                    <p className="text-xs text-muted-foreground">Configura nombre, estado y datos principales.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Producto <span className="text-destructive">*</span></FormLabel>
                                <FormControl><Input placeholder="Ramo de 12 Rosas Rojas" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado del Producto</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger></FormControl>
                                    <SelectContent className="z-[200]">
                                        <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                        <SelectItem value="HIDDEN">Oculto</SelectItem>
                                        <SelectItem value="DRAFT">Borrador</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="badge_text"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Badge Promocional</FormLabel>
                                <FormControl><Input placeholder="Ej: NUEVO / OFERTA / TOP" {...field} value={field.value ?? ''} /></FormControl>
                                <FormDescription className="text-xs">Opcional. Se muestra sobre la tarjeta del producto.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Slug</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} placeholder="Se genera automáticamente" disabled /></FormControl>
                                <FormDescription className="text-xs">Se asigna automáticamente al guardar.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5 shadow-sm">
                <div>
                    <h3 className="text-base font-semibold">Descripción comercial</h3>
                    <p className="text-xs text-muted-foreground">Texto que verá el cliente en catálogo y SEO.</p>
                </div>
                <FormField control={control} name="short_description" render={({ field }) => (<FormItem><FormLabel>Descripción Corta (SEO)</FormLabel><FormControl><Input placeholder="Breve descripción para buscadores..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Completa</FormLabel><FormControl><Textarea placeholder="Describe tu producto a detalle..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5 shadow-sm">
                <div>
                    <h3 className="text-base font-semibold">Clasificación</h3>
                    <p className="text-xs text-muted-foreground">Categoría, ocasiones y etiquetas para filtros y descubrimiento.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="category_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría <span className="text-destructive">*</span></FormLabel>
                                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value && field.value > 0 ? field.value.toString() : ""}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl>
                                    <SelectContent className="z-[200]">
                                        {mainCategories.map(mainCat => {
                                            const subCats = categories.filter((c: any) => (c?.parent_id ?? c?.parentId) === (mainCat as any).id);
                                            return (
                                                <React.Fragment key={mainCat.id}>
                                                    <SelectItem value={String(mainCat.id)} className="font-bold">{mainCat.name}</SelectItem>
                                                    {subCats.map(subCat => (
                                                        <SelectItem key={subCat.id} value={String(subCat.id)} className="pl-8">
                                                            ↳ {subCat.name}
                                                        </SelectItem>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SKU (Código)</FormLabel>
                                <FormControl><Input placeholder="Se genera automáticamente" {...field} disabled /></FormControl>
                                <FormDescription className="text-xs">Se genera automáticamente al guardar.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={control}
                    name="occasion_ids"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ocasiones</FormLabel>
                            <FormControl>
                                <MultiSelect options={occasions.map((o: Occasion) => ({ value: o.id, label: o.name }))} selected={field.value || []} onChange={field.onChange} placeholder="Selecciona ocasiones..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="tag_ids"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Etiquetas</FormLabel>
                            <FormControl>
                                <MultiSelect options={tags.map((t: Tag) => ({ value: t.id, label: t.name }))} selected={field.value || []} onChange={field.onChange} placeholder="Ej: más vendido, amor..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}

function Step2_PricingVariants() {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-base font-semibold">Precios y Variantes</h3>
                    <p className="text-xs text-muted-foreground">Define precio base, stock y variantes del producto.</p>
                </div>
                <PriceFields />
            </div>
        </div>
    );
}

function Step3_Media() {
    const { watch } = useFormContext<ProductFormValues>();
    const hasVariants = watch('has_variants');

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm">
                <h3 className="text-base font-semibold">Imagen principal y secundarias</h3>
                <p className="text-xs text-muted-foreground mt-1">Sube la imagen principal del producto y organiza el resto de la galería.</p>
                {!hasVariants ? (
                    <div className="mt-6">
                        <MediaFields isSaving={false} fieldName="images" label="Imágenes del Producto" />
                    </div>
                ) : (
                    <div className="mt-6 rounded-xl border p-4 bg-muted/30">
                        <p className="text-sm font-medium">Producto con variantes</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Las imágenes de este producto se gestionan por variante en el paso "Precios y Variantes".
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Step4_DetailsSeo() {
    const { control, watch } = useFormContext<ProductFormValues>();
    const allowPhoto = watch('allow_photo');
    return (
         <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5 shadow-sm">
                <div>
                    <h3 className="text-base font-semibold">Detalles y SEO</h3>
                    <p className="text-xs text-muted-foreground">Completa especificaciones, cuidados y campos de posicionamiento.</p>
                </div>
                <SpecificationsField name="specifications" label="Especificaciones del Producto" />
                <FormField control={control} name="care" render={({ field }) => (<FormItem><FormLabel>Cuidados del Producto</FormLabel><FormControl><Textarea placeholder="Ej: Mantener en agua fresca..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5 shadow-sm">
                <h4 className="text-base font-semibold">Configuración SEO</h4>
                <FormField control={control} name="slug" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} placeholder="Se genera automáticamente" disabled /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="short_description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Meta descripción / Descripción corta</FormLabel>
                        <FormControl><Textarea rows={3} placeholder="Texto para SEO y vista previa del catálogo..." {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5 shadow-sm">
                <FormField control={control} name="allow_photo" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-2"><Camera className="w-4 h-4"/> Permitir personalización con foto</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                {allowPhoto && (
                    <FormField control={control} name="photo_price" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Precio de la foto <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input type="number" placeholder="50.00" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                )}
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS for Form Fields ---
function PriceFields() {
    const { control, watch, formState: { errors } } = useFormContext<ProductFormValues>();
    const hasVariants = watch('has_variants');

    return (
        <div className="space-y-4">
            <FormField control={control} name="has_variants" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20"><div className="space-y-0.5"><FormLabel>Producto con Variantes</FormLabel><FormMessage>{(errors as any)?.variants?.message || (errors as any)?.has_variants?.message}</FormMessage></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )} />

            {hasVariants ? (
                <VariantsField />
            ) : (
                <div className="mt-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField control={control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" placeholder="850.00" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="sale_price" render={({ field }) => (<FormItem><FormLabel>Precio de Oferta</FormLabel><FormControl><Input type="number" placeholder="750.00" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="stock" render={({ field }) => (<FormItem><FormLabel>Existencia (Stock) <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" placeholder="20" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            )}
        </div>
    );
}

function SpecificationsField({ name, label }: { name: any, label: string }) {
    const { control } = useFormContext<ProductFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name });

    return (
        <div className="space-y-2">
             <div className="flex items-center justify-between gap-4 mb-2">
                <FormLabel>{label}</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar
                </Button>
            </div>
            <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                        <Controller render={({ field }) => <Input {...field} value={(field.value as any) ?? ''} placeholder="Atributo (ej. Altura)" />} name={`${name}.${index}.key` as any} control={control as any} />
                        <Controller render={({ field }) => <Input {...field} value={(field.value as any) ?? ''} placeholder="Valor (ej. 60cm aprox.)" />} name={`${name}.${index}.value` as any} control={control as any} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VariantsField() {
    const { control, getValues, setValue } = useFormContext<ProductFormValues>();
    const { fields, append, remove, update } = useFieldArray({ control, name: "variants" });
    const { toast } = useToast();

    const copySpecsToAllVariants = () => {
        const variants = getValues('variants');
        if (!variants || variants.filter(v => !v.is_deleted).length < 2) {
            toast({ title: "Acción no requerida", description: "Necesitas al menos dos variantes para copiar especificaciones.", variant: "info" });
            return;
        }
        const sourceSpecs = variants[0].specifications;
        if (!sourceSpecs || sourceSpecs.length === 0) {
            toast({ title: "Sin Especificaciones", description: "La primera variante no tiene especificaciones para copiar.", variant: "info" });
            return;
        }
        variants.forEach((variant, index) => {
            if (index > 0 && !variant.is_deleted) {
                update(index, { ...variant, specifications: structuredClone(sourceSpecs) });
            }
        });
        toast({ title: "¡Copiado!", description: "Las especificaciones de la primera variante se han copiado a todas las demás." });
    };
    
    const handleRemove = (index: number) => {
      const variant = getValues(`variants.${index}`);
      if (variant.id) {
        update(index, { ...variant, is_deleted: true });
      } else {
        remove(index);
      }
    };

    return (
        <div className="space-y-4 mt-4">
             {fields.filter(v => !v.is_deleted).length > 1 && (
                <div className="p-4 border rounded-xl space-y-2 bg-muted/40">
                    <div className="flex items-center justify-between">
                        <FormLabel>Copiado Rápido</FormLabel>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button type="button" variant="outline" size="sm"><Copy className="mr-2 h-4 w-4" />Copiar especificaciones a todas</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle><AlertDialogDescription>Esto sobrescribirá las especificaciones de todas las variantes (excepto la primera) con las de la primera variante. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={copySpecsToAllVariants}>Sí, copiar</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <p className="text-xs text-muted-foreground">Usa este botón para copiar las especificaciones de la primera variante a todas las demás.</p>
                </div>
             )}

            {fields.map((variant, index) => {
                if (variant.is_deleted) return null;
                return (
                <div key={variant.id} className="border rounded-2xl bg-card/95 overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center px-4 py-3 border-b bg-muted/25">
                        <p className="font-semibold text-sm">Variante #{index + 1}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)} className="text-muted-foreground hover:bg-transparent hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                     <div className="p-4 md:p-5 flex-grow space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                    <FormField control={control} name={`variants.${index}.product_name`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Nombre Producto (Variante) <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} value={field.value ?? ''} placeholder="Ej: Rosas Eternas" /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={control} name={`variants.${index}.name`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Nombre Variante <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} value={field.value ?? ''} placeholder="Ej: 50 Rosas" /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={control} name={`variants.${index}.stock`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Stock <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={control} name={`variants.${index}.price`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Precio <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={control} name={`variants.${index}.sale_price`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Precio de Oferta</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={control} name={`variants.${index}.code`} render={({ field }) => (<FormItem><FormLabel className="text-xs">SKU</FormLabel><FormControl><Input {...field} value={field.value ?? ''} placeholder="Se genera al guardar" disabled /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={control} name={`variants.${index}.short_description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Desc. Corta Variante</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value ?? ''} placeholder="Resumen breve de esta variante" /></FormControl><FormMessage /></FormItem>)} />
                           <div className="sm:col-span-2">
                               <FormField control={control} name={`variants.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Desc. Larga Variante (Opcional)</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value ?? ''} placeholder="Descripción detallada de esta variante" /></FormControl><FormMessage /></FormItem>)} />
                           </div>
                        </div>
                        <div className="mt-3">
                            <MediaFields isSaving={false} fieldName={`variants.${index}.images`} label="Imágenes de la Variante" />
                        </div>
                        <div className="mt-3">
                            <SpecificationsField name={`variants.${index}.specifications`} label="Especificaciones de la Variante" />
                        </div>
                    </div>
                </div>
                )
            })}
            <Button type="button" variant="outline" className="w-full border-dashed" size="sm" onClick={() => append({ product_name: getValues('name') || '', name: '', price: 0, stock: 0, short_description: '', description: '', specifications: [], images: [], is_deleted: false })}>Agregar Variante</Button>
        </div>
    );
}

function MediaFields({ isSaving, fieldName, label }: { isSaving: boolean, fieldName: any, label: string }) {
    const { control, getValues, setValue, formState: { dirtyFields } } = useFormContext<ProductFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: fieldName as any });
    const currentImages = fields as any[];

    const handleFiles = (files: File[]) => {
        const newImageObjects = files.map(file => ({
            id: Date.now() + Math.random(), file, src: URL.createObjectURL(file), alt: file.name, isNew: true, display_order: currentImages.length, is_deleted: false
        }));
        append(newImageObjects);
    };
    
    const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)); };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(Array.from(e.target.files || [])); };
    const handleImageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = currentImages.findIndex((item) => item.id === active.id);
            const newIndex = currentImages.findIndex((item) => item.id === over!.id);
            const reordered = arrayMove(currentImages, oldIndex, newIndex).map((img, idx) => ({...img, display_order: idx + 1}));
            setValue(fieldName, reordered, { shouldDirty: true });
        }
    };
    
    const removeImage = (index: number) => {
        const image = getValues(`${fieldName}.${index}` as any);
        if (image.isNew) {
            remove(index);
        } else {
             setValue(`${fieldName}.${index}.is_deleted` as any, true, { shouldDirty: true });
        }
    };
    
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 }}));

    const visibleImages = currentImages.filter((img: any) => !img.is_deleted);

    return (
        <div className="space-y-4">
            <FormLabel>{label}</FormLabel>
            <FormDescription className="text-xs">Estas son las imágenes de tu producto. Arrastra para reordenar.</FormDescription>
            <label onDragOver={e => e.preventDefault()} onDrop={handleFileDrop} className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer bg-card hover:bg-muted/60 transition-colors"><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" /><p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p><p className="text-xs text-muted-foreground">PNG, JPG o WEBP</p></div><input id={`dropzone-${fieldName}`} type="file" className="hidden" multiple onChange={handleFileSelect} accept="image/png, image/jpeg, image/webp" disabled={isSaving} /></label>
             {visibleImages.length > 0 && (
                 <DndContext sensors={sensors} onDragEnd={handleImageDragEnd}>
                    <SortableContext items={visibleImages.map(img => img.id)}>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                           {visibleImages.map((imageObj, index) => (
                                <SortableImageItem key={imageObj.id} imageObj={imageObj} index={index} onRemove={() => removeImage(currentImages.findIndex(img => img.id === imageObj.id))} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}

function SortableImageItem({ imageObj, index, onRemove }: { imageObj: ImageObject; index: number; onRemove: () => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: imageObj.id! });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto', opacity: isDragging ? 0.5 : 1, };
    const imageSrc = imageObj.src || '/placehold.webp';
    const isBlobPreview = typeof imageSrc === 'string' && imageSrc.startsWith('blob:');
    
    return (
        <div ref={setNodeRef} style={style} className="relative group aspect-square">
            <button type="button" {...attributes} {...listeners} className="absolute inset-0 bg-transparent cursor-grab touch-none p-2 flex items-start justify-start text-white"><GripVertical /></button>
            {isBlobPreview ? (
                <img src={imageSrc} alt={imageObj.alt || `preview ${index}`} className="absolute inset-0 w-full h-full object-cover rounded-md" />
            ) : (
                <Image src={imageSrc} alt={imageObj.alt || `preview ${index}`} fill className="object-cover rounded-md" />
            )}
            <Button type="button" variant="destructive" size="icon" onClick={onRemove} className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"><X className="h-4 w-4" /></Button>
            {index === 0 && <Badge className="absolute bottom-1 left-1">Principal</Badge>}
        </div>
    );
}

// --- MAIN FORM COMPONENT ---
interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: ProductFormValues, imageFiles: { main: File[], variants: { index: number, files: File[] }[] }, originalProduct?: Product | null) => void;
  product: Product | null;
  isCopyMode: boolean;
  categories: ProductCategory[];
  occasions: Occasion[];
  tags: Tag[];
  isSaving: boolean;
}

export function ProductForm({ isOpen, onOpenChange, onSave, product, isCopyMode, categories, occasions, tags, isSaving }: ProductFormProps) {
    const isEditing = !!product && !isCopyMode;
    const { toast } = useToast();
    const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
    const draftKey = isEditing && product?.id ? getProductEditDraftKey(product.id) : null;
  
    const form = useForm<ProductFormValues>({
      resolver: zodResolver(productFormSchema),
      mode: 'onTouched',
    defaultValues: { name: '', code: '', slug: '', badge_text: '', description: '', short_description: '', specifications: [], category_id: 0, occasion_ids: [], tag_ids: [], has_variants: false, price: 0, stock: 0, sale_price: undefined, variants: [], care: '', allow_photo: false, photo_price: 0, images: [], status: 'PUBLISHED' }
    });
  
    const { handleSubmit, reset, trigger, watch, formState: { errors } } = form;
  
    useEffect(() => {
        if (isOpen) {
            const productToLoad = product;
            let defaultValues: any;

            if (productToLoad) {
                setOriginalProduct(structuredClone(productToLoad as any));
                const productAny = productToLoad as any;
                defaultValues = {
                    id: productAny.id,
                    name: productAny.name,
                    slug: productAny.slug,
                    code: productAny.code,
                    badge_text: productAny.badge_text ?? productAny.badgeText ?? '',
                    description: productAny.description || '',
                    short_description: productAny.short_description ?? productAny.shortDescription ?? '',
                    specifications: productAny.specifications || [],
                    category_id: productAny.category?.id || 0,
                    occasion_ids: (productAny.occasions ?? []).map((o: any) => o.id ?? o.occasionId).filter(Boolean),
                    tag_ids: (productAny.tags ?? []).map((t: any) => t.id ?? t.tagId).filter(Boolean),
                    has_variants: Boolean(productAny.has_variants ?? productAny.hasVariants),
                    price: productAny.price || 0,
                    sale_price: (productAny.sale_price ?? productAny.salePrice) === 0 ? null : (productAny.sale_price ?? productAny.salePrice),
                    stock: productAny.stock ?? 0,
                    variants: (productAny.variants ?? []).map((v: any) => ({
                        ...v,
                        product_name: v.product_name ?? v.productName ?? productAny.name ?? '',
                        name: v.name ?? '',
                        short_description: v.short_description ?? v.shortDescription ?? '',
                        sale_price: (v.sale_price ?? v.salePrice) === 0 ? null : (v.sale_price ?? v.salePrice),
                        specifications: v.specifications || [],
                        images: (v.images ?? []).map((img: any) => ({ id: img.id, src: img.src, alt: img.alt, isNew: false, display_order: (img.is_primary ?? img.isPrimary) ? 0 : 1 })),
                        is_deleted: false,
                    })),
                    care: productAny.care || '',
                    allow_photo: Boolean(productAny.allow_photo ?? productAny.allowPhoto),
                    photo_price: productAny.photo_price ?? productAny.photoPrice ?? 0,
                    images: (productAny.images ?? []).map((img: any) => ({ id: img.id, src: img.src, alt: img.alt, isNew: false, display_order: (img.is_primary ?? img.isPrimary) ? 0 : 1 })),
                    status: productAny.status || 'PUBLISHED',
                };

                if (isEditing && draftKey) {
                    try {
                        const savedDraftRaw = localStorage.getItem(draftKey);
                        if (savedDraftRaw) {
                            const savedDraft = JSON.parse(savedDraftRaw);
                            const draftMatchesCurrentProduct = (savedDraft?.productUpdatedAt ?? null) === (productAny.updatedAt ?? null);

                            if (draftMatchesCurrentProduct && savedDraft?.data) {
                                defaultValues = {
                                    ...defaultValues,
                                    ...savedDraft.data,
                                    id: defaultValues.id,
                                    slug: defaultValues.slug,
                                    code: defaultValues.code,
                                };

                                defaultValues.variants = (defaultValues.variants ?? []).map((variant: any) => ({
                                    ...variant,
                                    product_name: variant?.product_name ?? variant?.productName ?? defaultValues.name ?? '',
                                    name: variant?.name ?? '',
                                }));

                                toast({
                                    title: 'Borrador recuperado',
                                    description: 'Se restauró tu último avance de edición para este producto.',
                                    variant: 'info',
                                });
                            }
                        }
                    } catch (error) {
                        console.warn('No se pudo recuperar el borrador de edición del producto', error);
                    }
                }

                if (isCopyMode) {
                    setOriginalProduct(null);
                    defaultValues.id = undefined;
                    defaultValues.slug = undefined;
                    defaultValues.code = '';
                    defaultValues.name = `${productToLoad.name} (Copia)`;
                    defaultValues.variants = defaultValues.variants?.map((v: any) => ({...v, id: undefined, code: ''}));
                    defaultValues.images = defaultValues.images?.map((img: any) => ({...img, id: 0}));
                }
            } else {
                setOriginalProduct(null);
                defaultValues = { name: '', code: '', slug: '', badge_text: '', description: '', short_description: '', specifications: [], category_id: 0, occasion_ids: [], tag_ids: [], has_variants: false, price: 0, stock: 0, sale_price: undefined, variants: [], care: '', allow_photo: false, photo_price: 0, images: [], status: 'PUBLISHED' };
            }
            reset(defaultValues);
        }
    }, [product, isOpen, reset, isCopyMode]);

    useEffect(() => {
        if (!isOpen || !isEditing || !product?.id || !draftKey) return;

        let debounceTimer: ReturnType<typeof setTimeout> | undefined;
        const subscription = form.watch((currentValues) => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            debounceTimer = setTimeout(() => {
                try {
                    const payload = {
                        productId: product.id,
                        productUpdatedAt: (product as any).updatedAt ?? null,
                        savedAt: Date.now(),
                        data: sanitizeProductDraft(currentValues as ProductFormValues),
                    };
                    localStorage.setItem(draftKey, JSON.stringify(payload));
                } catch (error) {
                    console.warn('No se pudo guardar el borrador de edición del producto', error);
                }
            }, 400);
        });

        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            subscription.unsubscribe();
        };
    }, [form, isEditing, isOpen, product, draftKey]);
  
    const onSubmit = (data: ProductFormValues) => {
        const imageFiles = {
            main: data.images?.filter(img => img.isNew && img.file).map(imgObj => imgObj.file!) || [],
            variants: data.variants
                ?.map((variant, index) => ({
                    index,
                    files: variant.images?.filter(img => img.isNew && img.file).map(imgObj => imgObj.file!) || [],
                }))
                .filter(v => v.files.length > 0) || [],
        };
        onSave(data, imageFiles, isEditing ? originalProduct : undefined);
    };
  
    const steps = [
        { label: "Información", icon: <Info className="h-5 w-5"/>, fields: ['name', 'slug', 'code', 'badge_text', 'category_id', 'description', 'short_description', 'occasion_ids', 'tag_ids', 'status'] },
        { label: "Precios y Variantes", icon: <DollarSign className="h-5 w-5"/>, fields: ['price', 'sale_price', 'stock', 'variants', 'has_variants'] },
        { label: "Multimedia", icon: <Camera className="h-5 w-5"/>, fields: ['images'] },
        { label: "Detalles y SEO", icon: <List className="h-5 w-5"/>, fields: ['care', 'allow_photo', 'photo_price', 'specifications', 'short_description'] }
    ];

    const hasVariants = watch('has_variants');

    const getStepFieldsToValidate = (activeStep: number): (keyof ProductFormValues)[] => {
        if (activeStep === 1) {
            if (hasVariants) {
                return ['has_variants', 'variants'];
            }
            return ['has_variants', 'price', 'sale_price', 'stock'];
        }
        return steps[activeStep].fields as (keyof ProductFormValues)[];
    };

    const findErrorStep = (formErrors: typeof errors): number => {
        const fieldErrorOrder: (keyof ProductFormValues)[] = [ 'name', 'slug', 'code', 'badge_text', 'status', 'short_description', 'description', 'category_id', 'occasion_ids', 'tag_ids', 'has_variants', 'price', 'sale_price', 'stock', 'variants', 'images', 'specifications', 'care', 'allow_photo', 'photo_price' ];
        for (const field of fieldErrorOrder) {
            if (formErrors[field]) {
                const stepIndex = steps.findIndex(step => step.fields.includes(field as any));
                if (stepIndex !== -1) {
                    toast({ title: "Campo inválido", description: `Por favor, revisa el campo "${field}" en el paso "${steps[stepIndex].label}".`, variant: "destructive" });
                    return stepIndex;
                }
            }
        }
        return -1;
    };
  
        return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
                                <DialogContent className="max-w-6xl flex flex-col p-0 max-h-[92vh] rounded-2xl overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b bg-background/95">
            <DialogTitle className="font-headline text-2xl tracking-tight">{isEditing ? "Editar Producto" : (isCopyMode ? "Copiar Producto" : "Crear Producto")}</DialogTitle>
            <DialogDescription>Completa los pasos para {isEditing ? "modificar los detalles del" : (isCopyMode ? "copiar el" : "crear un nuevo")} producto.</DialogDescription>
          </DialogHeader>
          <FormProvider {...form}>
            <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                <Stepper initialStep={0} steps={steps}>
                    {(stepperProps) => (
                    <>
                        <div className="h-1.5 w-full bg-muted/40">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((stepperProps.activeStep + 1) / steps.length) * 100}%` }} />
                        </div>
                        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-background/60">
                            <aside className="lg:w-72 border-b lg:border-b-0 lg:border-r bg-muted/25 p-5 md:p-6 overflow-y-auto flex flex-col">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
                                    {isEditing ? 'Panel de edición' : (isCopyMode ? 'Panel de copia' : 'Panel de creación')}
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
                                                    "w-full text-left rounded-xl border px-3 py-3 transition-colors",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                        : isCompleted
                                                            ? "bg-background border-border/60 hover:bg-muted/40"
                                                            : "bg-transparent border-transparent hover:bg-muted/40"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full grid place-items-center text-xs font-semibold",
                                                        isActive ? "bg-white/20" : isCompleted ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-muted"
                                                    )}>
                                                        {isCompleted ? '✓' : index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{step.label}</p>
                                                    </div>
                                                    <span className={cn("opacity-80", isActive ? "text-white" : "text-muted-foreground")}>{step.icon}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-auto pt-5 border-t">
                                    <div className="bg-muted/40 rounded-lg p-3 text-xs">
                                        <p className="uppercase tracking-widest text-[10px] text-muted-foreground">Vista previa</p>
                                        <p className="mt-1 truncate">{watch('name') || 'Sin nombre de producto'}</p>
                                    </div>
                                </div>
                            </aside>

                            <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-muted/10">
                                <Stepper.Step index={0}><Step1_Info categories={categories} occasions={occasions} tags={tags} /></Stepper.Step>
                                <Stepper.Step index={1}><Step2_PricingVariants /></Stepper.Step>
                                <Stepper.Step index={2}><Step3_Media /></Stepper.Step>
                                <Stepper.Step index={3}><Step4_DetailsSeo /></Stepper.Step>
                            </div>
                        </div>
                        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 flex-col sm:flex-row sm:justify-between bg-background/95">
                            <Button type="button" variant="secondary" className="rounded-lg" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
                            <div className="flex gap-2 sm:justify-end">
                                {!stepperProps.isFirstStep && (<Button type="button" variant="outline" className="rounded-lg" onClick={stepperProps.prevStep} disabled={isSaving}>Atrás</Button>)}
                                <Button type="button" className="rounded-lg min-w-36" disabled={isSaving}
                                    onClick={async () => {
                                        const currentStepFields = getStepFieldsToValidate(stepperProps.activeStep);
                                        const isValid = await trigger(currentStepFields);
                                        
                                        if (isValid) {
                                            if (stepperProps.isLastStep) {
                                                handleSubmit(onSubmit, (formErrors) => {
                                                    const errorStep = findErrorStep(formErrors);
                                                    if (errorStep !== -1 && errorStep !== stepperProps.activeStep) {
                                                        stepperProps.setStep(errorStep);
                                                    }
                                                })();
                                            } else {
                                                stepperProps.nextStep();
                                            }
                                        } else {
                                             toast({
                                                title: "Campos incompletos o inválidos",
                                                description: "Por favor, revisa los campos marcados en rojo antes de continuar.",
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                    loading={isSaving && stepperProps.isLastStep}
                                >
                                {stepperProps.isLastStep ? (isSaving ? 'Guardando...' : 'Guardar Producto') : "Siguiente"}
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
