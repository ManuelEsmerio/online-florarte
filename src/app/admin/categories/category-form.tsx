'use client';

import { useEffect, useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProductCategory } from '@/lib/definitions';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const categorySchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  prefix: z.string().optional(),
  description: z.string().min(10, 'La descripción es muy corta.'),
  image_url: z.string().optional(),
  parent_id: z.coerce.number().optional().nullable(),
  show_on_home: z.boolean().default(false),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: CategoryFormValues, imageFile: File | null, id?: number) => void;
  category: ProductCategory | null;
  allCategories: ProductCategory[];
  isSaving: boolean;
}

export function CategoryForm({ isOpen, onOpenChange, onSave, category, allCategories, isSaving }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
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
    if (isOpen) {
        if (category) {
            form.reset({
                name: category.name,
                prefix: category.prefix,
                description: category.description,
                image_url: category.image_url,
                parent_id: category.parent_id,
                show_on_home: category.show_on_home,
            });
            setImagePreview(category.image_url);
        } else {
            form.reset({ name: '', prefix: '', description: '', image_url: '', parent_id: null, show_on_home: false });
            setImagePreview(null);
        }
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [category, isOpen, form]);

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
  
  const onSubmit = (data: CategoryFormValues) => {
    onSave(data, imageFile, category?.id);
  };
  
  const parentCategories = allCategories.filter(c => !c.parent_id && c.id !== category?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{category ? 'Editar Categoría' : 'Crear Categoría'}</DialogTitle>
          <DialogDescription>{category ? 'Modifica los detalles de la categoría.' : 'Completa el formulario para crear una nueva categoría.'}</DialogDescription>
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
                        <Input placeholder="Arreglos florales" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Prefijo</FormLabel>
                    <FormControl>
                        <Input placeholder="ARR" {...field} disabled className="font-mono uppercase"/>
                    </FormControl>
                    <FormDescription className="text-xs">Se genera al guardar.</FormDescription>
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
                    <Textarea placeholder="Breve descripción de la categoría..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría Padre (para crear subcategoría)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'null' ? null : Number(value))}
                    value={field.value === null || field.value === undefined ? 'null' : String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguna (es categoría principal)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Ninguna (es categoría principal)</SelectItem>
                      {parentCategories.map(cat => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel htmlFor="image">Imagen de la Categoría</FormLabel>
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
                    <FormDescription className="text-xs">
                      Activa para mostrar esta categoría en la página principal.
                    </FormDescription>
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
