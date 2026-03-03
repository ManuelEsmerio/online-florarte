// src/app/admin/ads/ad-form.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Announcement } from '@/lib/definitions';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, UploadCloud, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const adSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3, 'El título es requerido.'),
  description: z.string().optional().nullable(),
  button_text: z.string().optional().nullable(),
  button_link: z.string().optional().nullable(),
  image_url: z.string().optional(),
  image_mobile_url: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  start_at: z.date().optional().nullable(),
  end_at: z.date().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
});

type AdFormValues = z.infer<typeof adSchema>;

interface AdFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: AdFormValues, images: { desktop?: File, mobile?: File }) => void;
  ad: Announcement | null;
  isSaving: boolean;
}

const ImageUploader = ({
  label,
  description,
  preview,
  onFileChange,
  onRemove,
}: {
  label: string;
  description: string;
  preview: string | null;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-medium leading-none">{label}</p>
    {preview ? (
      <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
        <Image
          src={preview}
          alt="Previsualización"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 520px"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8"
          onClick={onRemove}
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 text-center transition-colors hover:bg-muted/40">
        <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="px-6 text-xs text-muted-foreground">{description}</p>
        <input
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
          accept="image/png, image/jpeg, image/webp"
        />
      </label>
    )}
  </div>
);

export function AdForm({ isOpen, onOpenChange, onSave, ad, isSaving }: AdFormProps) {
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: { is_active: true, sort_order: 0 },
  });

  const [desktopImage, setDesktopImage] = useState<{ file: File | null, preview: string | null }>({ file: null, preview: null });
  const [mobileImage, setMobileImage] = useState<{ file: File | null, preview: string | null }>({ file: null, preview: null });
  const startDate = form.watch('start_at');

  useEffect(() => {
    if (isOpen) {
      if (ad) {
        form.reset({
          id: ad.id,
          title: ad.title,
          description: ad.description,
          button_text: ad.buttonText ?? '',
          button_link: ad.buttonLink ?? '',
          image_url: ad.imageUrl ?? '',
          image_mobile_url: ad.imageMobileUrl ?? null,
          is_active: ad.isActive,
          start_at: ad.startAt ? (typeof ad.startAt === 'string' ? parseISO(ad.startAt) : ad.startAt) : null,
          end_at: ad.endAt ? (typeof ad.endAt === 'string' ? parseISO(ad.endAt) : ad.endAt) : null,
          sort_order: ad.sortOrder,
        });
        setDesktopImage({ file: null, preview: ad.imageUrl ?? null });
        setMobileImage({ file: null, preview: ad.imageMobileUrl ?? null });
      } else {
        form.reset({ title: '', description: '', button_text: '', button_link: '', is_active: true, sort_order: 0, start_at: null, end_at: null });
        setDesktopImage({ file: null, preview: null });
        setMobileImage({ file: null, preview: null });
      }
    }
  }, [ad, isOpen, form]);

  const handleFileChange = (setter: typeof setDesktopImage) => (file: File) => {
    setter({ file, preview: URL.createObjectURL(file) });
  };
  
  const handleRemoveImage = (setter: typeof setDesktopImage, fieldName: 'image_url' | 'image_mobile_url') => () => {
    setter({ file: null, preview: null });
    form.setValue(fieldName, ''); // Clear existing URL if image is removed
  };

  const onSubmit = (data: AdFormValues) => {
    onSave({ ...data, image_url: desktopImage.preview || '', image_mobile_url: mobileImage.preview }, { desktop: desktopImage.file ?? undefined, mobile: mobileImage.file ?? undefined });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:max-w-2xl max-h-[90vh] overflow-hidden border border-border/60 p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-headline text-2xl">
              {ad ? 'Editar Anuncio' : 'Crear Anuncio'}
            </DialogTitle>
            <DialogDescription>
              Completa el formulario para configurar el banner.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col">
              <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-6 pb-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. Lanza del Día de las Madres" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="button_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto del Botón</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} placeholder="Ver catálogo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="button_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enlace del Botón</FormLabel>
                        <FormControl>
                          <Input type="url" {...field} value={field.value ?? ''} placeholder="https://" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ImageUploader
                    label="Imagen de Escritorio"
                    description="Recomendado 1280x640 px"
                    preview={desktopImage.preview}
                    onFileChange={handleFileChange(setDesktopImage)}
                    onRemove={handleRemoveImage(setDesktopImage, 'image_url')}
                  />
                  <ImageUploader
                    label="Imagen Móvil (opcional)"
                    description="Recomendado 750x1000 px"
                    preview={mobileImage.preview}
                    onFileChange={handleFileChange(setMobileImage)}
                    onRemove={handleRemoveImage(setMobileImage, 'image_mobile_url')}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_at"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Fecha de inicio</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'PPP', { locale: es }) : 'Sin fecha definida'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={(date) => field.onChange(date ?? null)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_at"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Fecha de fin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'PPP', { locale: es }) : 'Sin fecha definida'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={(date) => field.onChange(date ?? null)}
                              disabled={(date) => (startDate ? date < startDate : false)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orden</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/60 p-4 shadow-sm">
                        <div>
                          <FormLabel>Activo</FormLabel>
                          <p className="text-xs text-muted-foreground">Muestra u oculta el anuncio.</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 border-t border-border/60 bg-muted/30 px-6 py-4">
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isSaving}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" loading={isSaving}>
                  Guardar anuncio
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
