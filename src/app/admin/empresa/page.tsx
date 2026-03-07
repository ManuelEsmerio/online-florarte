'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Clock, Globe, Landmark, MapPin, Phone, RefreshCw, Save, WalletCards } from 'lucide-react';

// ─── Schema ──────────────────────────────────────────────────────────────────

const empresaSchema = z.object({
  name:      z.string().min(1, 'El nombre es requerido.'),
  address:   z.string().min(5, 'La dirección es requerida.'),
  phone:     z.string().min(7, 'El teléfono es requerido.'),
  hours:     z.string().min(3, 'El horario es requerido.'),
  latitude:  z.string().regex(/^-?\d+(\.\d+)?$/, 'Latitud inválida.').optional().or(z.literal('')),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Longitud inválida.').optional().or(z.literal('')),
  site_url:  z.string().url('URL inválida.'),
  bank_alias:          z.string().max(100).optional().or(z.literal('')),
  bank_name:           z.string().max(150).optional().or(z.literal('')),
  bank_owner:          z.string().max(255).optional().or(z.literal('')),
  bank_account:        z.string().max(50).optional().or(z.literal('')),
  bank_clabe:          z.string().max(50).optional().or(z.literal('')),
  bank_reference_hint: z.string().max(255).optional().or(z.literal('')),
  bank_swift:          z.string().max(50).optional().or(z.literal('')),
});

type EmpresaFormValues = z.infer<typeof empresaSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_VALUES: EmpresaFormValues = {
  name:      '',
  address:   '',
  phone:     '',
  hours:     '',
  latitude:  '',
  longitude: '',
  site_url:  '',
  bank_alias:          '',
  bank_name:           '',
  bank_owner:          '',
  bank_account:        '',
  bank_clabe:          '',
  bank_reference_hint: '',
  bank_swift:          '',
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="w-full lg:w-80 xl:w-96">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmpresaPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // ── Load all company meta values ───────────────────────────────────────────
  const loadMeta = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/company-meta');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error al cargar los datos.');
      const data = json.data as Record<string, string>;

      form.reset({
        name:      data['name']      ?? '',
        address:   data['address']   ?? '',
        phone:     data['phone']     ?? '',
        hours:     data['hours']     ?? '',
        latitude:  data['latitude']  ?? '',
        longitude: data['longitude'] ?? '',
        site_url:  data['site_url']  ?? '',
        bank_alias:          data['bank_alias']          ?? '',
        bank_name:           data['bank_name']           ?? '',
        bank_owner:          data['bank_owner']          ?? '',
        bank_account:        data['bank_account']        ?? '',
        bank_clabe:          data['bank_clabe']          ?? '',
        bank_reference_hint: data['bank_reference_hint'] ?? '',
        bank_swift:          data['bank_swift']          ?? '',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [form, toast]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // ── Save — upserts each field that changed ─────────────────────────────────
  const onSubmit = async (values: EmpresaFormValues) => {
    setIsSaving(true);
    try {
      const entries = Object.entries(values) as [string, string][];
      await Promise.all(
        entries.map(([key, value]) =>
          fetch('/api/admin/company-meta', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ key, value }),
          }),
        ),
      );
      toast({ title: '¡Guardado!', description: 'Los datos de la empresa se actualizaron.', variant: 'success' });
      form.reset(values);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6 mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">
            Datos de la Empresa
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Información que el chatbot de WhatsApp usa para responder a los clientes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadMeta}
          disabled={isLoading || isSaving}
          className="rounded-xl"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Recargar
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <PageSkeleton />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
              <div className="flex-1 w-full max-w-3xl space-y-6">

                {/* ── Información general ── */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Información General</CardTitle>
                        <CardDescription>Nombre, teléfono y sitio web de la empresa.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Florarte" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> Teléfono
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="3312345678" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="site_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5" /> URL del sitio
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://online-florarte.vercel.app" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ── Ubicación ── */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Ubicación</CardTitle>
                        <CardDescription>Dirección física y coordenadas para el mapa.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Av. Hidalgo 123, Col. Centro, Guadalajara, Jal."
                              rows={2}
                              {...field}
                              className="rounded-xl resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitud</FormLabel>
                            <FormControl>
                              <Input placeholder="20.6597" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitud</FormLabel>
                            <FormControl>
                              <Input placeholder="-103.3496" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ── Horarios ── */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Horarios de Atención</CardTitle>
                        <CardDescription>El chatbot mostrará este texto cuando un cliente pregunte por horarios.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horario</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Lun–Sáb 9:00am – 7:00pm&#10;Dom 10:00am – 3:00pm"
                              rows={3}
                              {...field}
                              className="rounded-xl resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

              </div>

              {/* ── Datos bancarios ── */}
              <div className="w-full lg:w-80 xl:w-96">
                <Card className="sticky top-24">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-900/10 dark:bg-slate-100/10 flex items-center justify-center">
                        <Landmark className="h-4 w-4 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-1">
                          <WalletCards className="h-4 w-4" />
                          Datos Bancarios
                        </CardTitle>
                        <CardDescription>Información mostrada al chatbot y al cliente.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="bank_alias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alias</FormLabel>
                          <FormControl>
                            <Input placeholder="Cuenta principal" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input placeholder="BBVA" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_owner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titular</FormLabel>
                          <FormControl>
                            <Input placeholder="Florarte" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="0000 0000 0000" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_clabe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CLABE</FormLabel>
                          <FormControl>
                            <Input placeholder="000000000000000000" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_reference_hint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referencia sugerida</FormLabel>
                          <FormControl>
                            <Input placeholder="Pedido #123" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_swift"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT/BIC</FormLabel>
                          <FormControl>
                            <Input placeholder="BCMRMXMM" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
                className="rounded-2xl h-11 px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-0.5"
              >
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Guardando…' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
