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
import type { Occasion } from '@/lib/definitions';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';

const occasionSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  slug: z.string().optional(),
  description: z.string().min(10, 'La descripción es muy corta.'),
  image_url: z.string().optional(),
  show_on_home: z.boolean().default(false),
});

type OccasionFormValues = z.infer<typeof occasionSchema>;

interface OccasionFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: OccasionFormValues, imageFile: File | null, id?: number) => void;
  occasion: Occasion | null;
  isSaving: boolean;
}

const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function OccasionForm({ isOpen, onOpenChange, onSave, occasion, isSaving }: OccasionFormProps) {
  const form = useForm<OccasionFormValues>({
    resolver: zodResolver(occasionSchema),
    defaultValues: {
        show_on_home: false,
    }
  });
  
  const { watch, setValue } = form;
  const nameValue = watch('name');

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameValue) {
      setValue('slug', generateSlug(nameValue));
    } else {
      setValue('slug', '');
    }
  }, [nameValue, setValue]);
  
  useEffect(() => {
    if (isOpen) {
        if (occasion) {
            form.reset({
                name: occasion.name,
                slug: occasion.slug,
            description: occasion.description ?? '',
            image_url: occasion.imageUrl ?? '',
            show_on_home: occasion.showOnHome,
            });
          setImagePreview(occasion.imageUrl ?? null);
        } else {
            form.reset({ name: '', slug: '', description: '', image_url: '', show_on_home: false });
            setImagePreview(null);
        }
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [occasion, isOpen, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: OccasionFormValues) => {
    onSave(data, imageFile, occasion?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{occasion ? 'Editar Ocasión' : 'Crear Ocasión'}</DialogTitle>
          <DialogDescription>{occasion ? 'Modifica los detalles de la ocasión.' : 'Completa el formulario para crear una nueva ocasión.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                        <Input placeholder="Día de las Madres" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                        <Input placeholder="dia-de-madres" {...field} readOnly className="font-mono"/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Breve descripción de la ocasión..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel htmlFor="image">Imagen de la Ocasión</FormLabel>
              {imagePreview && (
                <div className="relative w-full h-32">
                   <Image src={imagePreview} alt="Previsualización" layout="fill" objectFit="contain" className="rounded-md" />
                </div>
              )}
              <FormControl>
                 <Input 
                    id="image" 
                    type="file" 
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg, image/webp"
                    ref={fileInputRef}
                />
              </FormControl>
              <FormMessage />
            </div>
            <FormField
              control={form.control}
              name="show_on_home"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Mostrar en Home</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 sticky bottom-0 bg-background py-3 -mx-2 px-2">
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
