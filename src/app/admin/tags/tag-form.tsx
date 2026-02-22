
'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Tag } from '@/lib/definitions';

const tagSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
});

type TagFormValues = z.infer<typeof tagSchema>;

interface TagFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: TagFormValues, id?: number) => void;
  tag: Tag | null;
  isSaving: boolean;
}

export function TagForm({ isOpen, onOpenChange, onSave, tag, isSaving }: TagFormProps) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
  });
  
  useEffect(() => {
    if (isOpen) {
        if (tag) {
            form.reset(tag);
        } else {
            form.reset({ name: '' });
        }
    }
  }, [tag, isOpen, form]);

  const onSubmit = (data: TagFormValues) => {
    onSave(data, tag?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{tag ? 'Editar Etiqueta' : 'Crear Etiqueta'}</DialogTitle>
          <DialogDescription>{tag ? 'Modifica el nombre de la etiqueta.' : 'Completa el formulario para crear una nueva etiqueta.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Más Vendido" {...field} />
                  </FormControl>
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
