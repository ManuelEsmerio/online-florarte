// src/app/admin/import/import-modal.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UploadCloud, File, X, Loader2, AlertTriangle, CheckCircle, AlertCircle, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

type ViewState = 'form' | 'confirm' | 'processing' | 'results';

const importSchema = z.object({
  dataType: z.string().min(1, 'Debes seleccionar un tipo de dato.'),
  file: z.any().refine(file => file?.size > 0, 'Debes seleccionar un archivo CSV.'),
});

type ImportFormValues = z.infer<typeof importSchema>;
type ImportResult = {
  processed: number;
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

const importOptions = [
  { value: 'products', label: 'Productos' },
  { value: 'customers', label: 'Usuarios' },
  { value: 'coupons', label: 'Cupones' },
  { value: 'shipping_zones', label: 'Zonas de Envío' },
  { value: 'categories', label: 'Categorías' },
  { value: 'occasions', label: 'Ocasiones' },
  { value: 'tags', label: 'Etiquetas' },
  { value: 'peak_dates', label: 'Fechas Pico' },
];

interface ImportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ImportModal({ isOpen, onOpenChange }: ImportModalProps) {
  const { toast } = useToast();
  const { apiFetch } = useAuth();
  const [view, setView] = useState<ViewState>('form');
  const [result, setResult] = useState<ImportResult | null>(null);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: { file: null },
  });

  const { control, handleSubmit, setValue, watch, reset } = form;
  const file = watch('file');
  const dataType = watch('dataType');

  const selectedOptionLabel = useMemo(() => {
    return importOptions.find(opt => opt.value === dataType)?.label || 'datos';
  }, [dataType]);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setValue('file', droppedFile, { shouldValidate: true });
      } else {
        toast({ title: 'Archivo no válido', description: 'Por favor, selecciona un archivo .csv', variant: 'destructive' });
      }
    }
  }, [setValue, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setValue('file', e.target.files[0], { shouldValidate: true });
  }, [setValue]);
  
  const handleClose = (open: boolean) => {
    if (view === 'processing') return;
    if (!open) {
        setTimeout(() => {
            reset();
            setView('form');
            setResult(null);
        }, 300);
    }
    onOpenChange(open);
  };

  const onSubmit = () => setView('confirm');
  
  const handleProcessFile = async () => {
    setView('processing');
    const formData = new FormData();
    formData.append('dataType', dataType);
    formData.append('file', file);
    
    try {
      const res = await apiFetch('/api/admin/import', { method: 'POST', body: formData });
      const apiResult = await handleApiResponse(res);
      setResult(apiResult);
      setView('results');
    } catch (error: any) {
      setResult({ processed: 0, inserted: 0, skipped: 0, errors: [{ row: 0, message: error.message || "Error de conexión." }] });
      setView('results');
    }
  };

  const renderFormView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Carga Masiva de Datos</DialogTitle>
        <DialogDescription>Selecciona el tipo de dato y sube un archivo CSV para importar.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <FormField control={control} name="dataType" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Dato a Importar</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona una opción..." /></SelectTrigger></FormControl>
                <SelectContent>{importOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={control} name="file" render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Archivo CSV</FormLabel>
              {file ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 text-sm font-medium"><File className="h-5 w-5 text-primary" /><span className="truncate max-w-xs">{file.name}</span></div>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setValue('file', null, { shouldValidate: true })}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <FormControl><label onDragOver={e => e.preventDefault()} onDrop={handleFileDrop} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" /><p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastra</p><p className="text-xs text-muted-foreground">Solo archivos .CSV</p></div><input id="dropzone-file" type="file" className="hidden" onChange={handleFileSelect} accept=".csv" /></label></FormControl>
              )}
              <FormMessage>{fieldState.error?.message?.toString()}</FormMessage>
            </FormItem>
          )} />
          <DialogFooter className="pt-4">
            <Button type="button" variant="secondary" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button type="submit">Siguiente</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );

  const renderConfirmView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl text-center">Confirmar Carga Masiva</DialogTitle>
      </DialogHeader>
      <div className="p-6 text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <p className="font-semibold">Estás a punto de importar {selectedOptionLabel} desde el archivo <span className="font-mono bg-muted p-1 rounded-sm">{file?.name}</span>.</p>
        <p className="text-sm text-muted-foreground">Esta acción modificará directamente la base de datos. Los registros existentes (basados en ID o identificadores únicos como el nombre o código) serán omitidos. Asegúrate de que los datos en tu archivo CSV sean correctos.</p>
        <p className="font-bold text-destructive">Esta acción no se puede deshacer.</p>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => setView('form')}>Atrás</Button>
        <Button variant="destructive" onClick={handleProcessFile}>Sí, continuar con la importación</Button>
      </DialogFooter>
    </>
  );
  
  const renderProcessingView = () => (
    <>
      <DialogHeader><DialogTitle className="font-headline text-2xl">Procesando Archivo</DialogTitle><DialogDescription>Por favor, no cierres esta ventana.</DialogDescription></DialogHeader>
      <div className="flex flex-col items-center justify-center space-y-4 py-10">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-lg font-medium">Importando {selectedOptionLabel}...</p>
        <Progress value={50} className="w-full animate-pulse" />
      </div>
    </>
  );

  const renderResultsView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Resultados de la Importación</DialogTitle>
        <DialogDescription>
          El procesamiento del archivo <span className="font-mono bg-muted p-1 rounded-sm">{file?.name}</span> ha finalizado.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">Procesados</p><p className="text-2xl font-bold">{result?.processed ?? 0}</p></div>
            <div className="p-3 bg-green-100/60 rounded-lg"><p className="text-xs text-green-800">Insertados</p><p className="text-2xl font-bold text-green-600">{result?.inserted ?? 0}</p></div>
            <div className="p-3 bg-amber-100/60 rounded-lg"><p className="text-xs text-amber-800">Omitidos</p><p className="text-2xl font-bold text-amber-600">{result?.skipped ?? 0}</p></div>
            <div className="p-3 bg-red-100/60 rounded-lg"><p className="text-xs text-red-800">Errores</p><p className="text-2xl font-bold text-red-600">{result?.errors?.length ?? 0}</p></div>
        </div>
        {result?.errors && result.errors.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-4">
            <h4 className="font-semibold text-destructive flex items-center gap-2"><FileWarning className="w-4 h-4"/> Detalles de Errores:</h4>
            <ul className="list-disc pl-5 text-sm">
                {result.errors.map((err, index) => (
                    <li key={index}><strong>Fila {err.row}:</strong> {err.message}</li>
                ))}
            </ul>
          </div>
        )}
        {result && result.errors.length === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-100/60 border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600"/>
                <p className="text-green-800 font-semibold">¡Importación completada exitosamente sin errores!</p>
            </div>
        )}
      </div>
      <DialogFooter>
        <Button className="w-full" onClick={() => handleClose(false)}>Cerrar</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" hideCloseButton={view === 'processing'}>
        {view === 'form' && renderFormView()}
        {view === 'confirm' && renderConfirmView()}
        {view === 'processing' && renderProcessingView()}
        {view === 'results' && renderResultsView()}
      </DialogContent>
    </Dialog>
  );
}
