
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddressModal } from '@/components/AddressModal';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/CheckoutClientPage';
import { useAuth } from '@/context/AuthContext';
import { MapPin, AlertCircle, CheckCircle, Home, ArrowRight, Map as MapIcon, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Address } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sanitizePhoneDigits } from '@/utils/phone';

const GoogleMapEmbed = ({ address }: { address: Address }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="aspect-video w-full bg-muted/30 rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/50 max-w-full">
        <MapIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Mapa disponible en producción</span>
      </div>
    );
  }
  const fullAddress = `${address.streetName} ${address.streetNumber}, ${address.neighborhood}, ${address.city}, ${address.state}`;
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-border/50 shadow-inner w-full aspect-video">
        <iframe
            width="100%"
            height="100%"
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={embedUrl}
        ></iframe>
    </div>
  );
};

interface StepAddressProps {
  isActive: boolean;
  setActiveStep: (step: number) => void;
  setShippingCost: (cost: number | null) => void;
  disabled?: boolean;
  currentStep: number;
}

export function StepAddress({ isActive, setActiveStep, setShippingCost, disabled = false, currentStep }: StepAddressProps) {
  const { control, watch, setValue, trigger, setError, clearErrors } = useFormContext<CheckoutFormValues>();
  const { user, shippingZones, addAddress, updateAddress, deleteAddress, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isGuestCheckout = !user?.id;
  
  const addressId = watch('addressId');
  const guestStreetName = watch('guestStreetName');
  const guestStreetNumber = watch('guestStreetNumber');
  const guestNeighborhood = watch('guestNeighborhood');
  const guestCity = watch('guestCity');
  const guestState = watch('guestState');
  const guestPostalCode = watch('guestPostalCode');
  const guestRecipientName = watch('guestRecipientName');
  const guestRecipientPhone = watch('guestRecipientPhone');

  const cityOptions = useMemo(() => {
    const normalized = (shippingZones || [])
      .map(zone => (zone.municipality || '').trim())
      .filter((value): value is string => Boolean(value));

    const uniqueBySlug = new Map<string, string>();
    for (const name of normalized) {
      const slug = name.toLowerCase();
      if (!uniqueBySlug.has(slug)) {
        uniqueBySlug.set(slug, name);
      }
    }

    return Array.from(uniqueBySlug.values()).sort((a, b) => a.localeCompare(b, 'es'));
  }, [shippingZones]);

  const guestAddressIsComplete =
    String(guestStreetName ?? '').trim().length >= 3 &&
    String(guestStreetNumber ?? '').trim().length >= 1 &&
    String(guestNeighborhood ?? '').trim().length >= 2 &&
    String(guestCity ?? '').trim().length >= 2 &&
    String(guestState ?? '').trim().length >= 2 &&
    /^\d{5}$/.test(String(guestPostalCode ?? '').trim());

  const guestRecipientDigits = sanitizePhoneDigits(String(guestRecipientPhone ?? ''));
  const guestRecipientIsComplete =
    String(guestRecipientName ?? '').trim().length >= 3 &&
    /^\d{10}$/.test(guestRecipientDigits);
  const guestDestinationIsComplete = guestAddressIsComplete && guestRecipientIsComplete;

  const selectedAddress = user?.addresses?.find(a => a.id === addressId);
  const currentZone = selectedAddress
    ? shippingZones.find(z => z.postalCode === selectedAddress.postalCode)
      ?? shippingZones.find(z => z.municipality === selectedAddress.city)
      ?? shippingZones.find(z => z.locality === selectedAddress.city)
    : null;
  const shippingCostValue = currentZone?.shippingCost ?? null;

  const isCompleted = isGuestCheckout
    ? (guestDestinationIsComplete || currentStep > 2)
    : ((!!selectedAddress && shippingCostValue !== null) || currentStep > 2);

  useEffect(() => {
    if (isGuestCheckout) {
      const postalCode = String(guestPostalCode ?? '').trim();
      const city = String(guestCity ?? '').trim();

      if (!postalCode && !city) {
        setShippingCost(null);
        return;
      }

      const guestZone = shippingZones.find(z => z.postalCode === postalCode)
        ?? shippingZones.find(z => z.municipality === city)
        ?? shippingZones.find(z => z.locality === city);

      setShippingCost(guestZone ? Number(guestZone.shippingCost) : null);
      return;
    }

    if (selectedAddress) {
      const zone = shippingZones.find(z => z.postalCode === selectedAddress.postalCode)
        ?? shippingZones.find(z => z.municipality === selectedAddress.city)
        ?? shippingZones.find(z => z.locality === selectedAddress.city);
      setShippingCost(zone ? zone.shippingCost : null);
    }
  }, [isGuestCheckout, selectedAddress, shippingZones, setShippingCost, guestPostalCode, guestCity]);

  useEffect(() => {
    if (!isGuestCheckout) return;
    if (!guestCity && cityOptions.length > 0) {
      setValue('guestCity', cityOptions[0], { shouldValidate: true });
    }
  }, [isGuestCheckout, guestCity, cityOptions, setValue]);

  useEffect(() => {
    if (!isGuestCheckout) return;
    const postalCode = String(guestPostalCode ?? '').trim();
    if (!postalCode) return;

    const matchedZone = shippingZones.find(zone => zone.postalCode === postalCode);
    const matchedMunicipality = matchedZone?.municipality ?? matchedZone?.locality;
    if (matchedMunicipality && matchedMunicipality !== guestCity) {
      setValue('guestCity', matchedMunicipality, { shouldValidate: true });
    }
  }, [isGuestCheckout, guestPostalCode, shippingZones, guestCity, setValue]);

  useEffect(() => {
    if (!isGuestCheckout) return;
    if (guestState !== 'Jalisco') {
      setValue('guestState', 'Jalisco', { shouldValidate: true });
    }
  }, [isGuestCheckout, guestState, setValue]);

  const handleAddressSelect = useCallback((address: Address) => {
    setValue('addressId', address.id, { shouldValidate: true });
    setIsModalOpen(false);
  }, [setValue]);

  const handleSaveAddress = async (address: Address | Omit<Address, 'id'>) => {
    setIsSaving(true);
    const isExistingAddress = 'id' in address && address.id > 0;

    if (isExistingAddress && updateAddress) {
      const result = await updateAddress(address as Address);
      if (result.success && result.data?.addresses) {
        setIsModalOpen(false);
        setIsSaving(false);
        return true;
      }
    }

    if (!isExistingAddress && addAddress) {
      const result = await addAddress(address as Omit<Address, 'id'>);
      if (result.success && result.data?.addresses) {
        const newAddress = result.data.addresses.at(-1);
        if (newAddress) setValue('addressId', newAddress.id, { shouldValidate: true });
        setIsModalOpen(false);
        setIsSaving(false);
        return true;
      }
    }
    setIsSaving(false);
    return false;
  };

  const handleDeleteAddress = async (id: number) => {
    if (deleteAddress) await deleteAddress(id);
    if (addressId === id) setValue('addressId', 0, { shouldValidate: true });
  }

  const handleNext = async () => {
    if (isGuestCheckout) {
      const checks: Array<{ field: keyof CheckoutFormValues; valid: boolean; message: string }> = [
        { field: 'guestRecipientName', valid: String(guestRecipientName ?? '').trim().length >= 3, message: 'Ingresa el nombre del destinatario.' },
        { field: 'guestRecipientPhone', valid: /^\d{10}$/.test(guestRecipientDigits), message: 'Ingresa el teléfono del destinatario (10 dígitos).' },
        { field: 'guestStreetName', valid: String(guestStreetName ?? '').trim().length >= 3, message: 'Ingresa la calle.' },
        { field: 'guestStreetNumber', valid: String(guestStreetNumber ?? '').trim().length >= 1, message: 'Ingresa el número exterior.' },
        { field: 'guestNeighborhood', valid: String(guestNeighborhood ?? '').trim().length >= 2, message: 'Ingresa la colonia.' },
        { field: 'guestCity', valid: String(guestCity ?? '').trim().length >= 2, message: 'Ingresa la ciudad.' },
        { field: 'guestState', valid: String(guestState ?? '').trim().length >= 2, message: 'Ingresa el estado.' },
        { field: 'guestPostalCode', valid: /^\d{5}$/.test(String(guestPostalCode ?? '').trim()), message: 'Ingresa un código postal de 5 dígitos.' },
      ];

      let hasErrors = false;
      for (const check of checks) {
        if (!check.valid) {
          setError(check.field, { type: 'manual', message: check.message });
          hasErrors = true;
        } else {
          clearErrors(check.field);
        }
      }

      if (hasErrors) return;

      setActiveStep(3);
      return;
    }

    const isValid = await trigger('addressId');
    if (isValid && selectedAddress) {
      setActiveStep(3);
    }
  };

  return (
    <Card className={cn(
        "w-full max-w-full rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden transition-all duration-300 bg-background dark:bg-zinc-900/50", 
        disabled && "opacity-50 pointer-events-none",
        isActive ? "ring-2 ring-primary/20 shadow-xl" : ""
    )}>
      <CardHeader 
        className={cn("p-6 md:p-8 !pb-4", !isActive && "cursor-pointer")} 
        onClick={() => !isActive && isCompleted && setActiveStep(2)}
      >
        <div className="flex flex-row justify-between items-center w-full gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-lg transition-all shrink-0", 
                isCompleted && !isActive ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary",
                isActive && "bg-primary text-white"
            )}>
              {isCompleted && !isActive ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6"/> : <MapPin className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base md:text-xl font-bold font-headline truncate">Datos del destinatario</h3>
              {!isActive && isCompleted && (
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5 tracking-tight truncate">
                      {selectedAddress?.alias}: {selectedAddress?.streetName}
                  </p>
              )}
            </div>
          </div>
          {!isActive && isCompleted && (
            <button 
                type="button" 
                className="text-primary font-bold text-[10px] md:text-xs uppercase tracking-widest hover:underline px-2 py-1 shrink-0 ml-auto"
                onClick={(e) => { e.stopPropagation(); setActiveStep(2); }}
            >
                Cambiar
            </button>
          )}
        </div>
      </CardHeader>
      
      {isActive && (
        <CardContent className="p-6 md:p-8 pt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500 w-full max-w-full overflow-hidden">
          {isGuestCheckout ? (
            <div className="space-y-5">
              <Alert className="rounded-2xl border-primary/20 bg-primary/5">
                <MapPin className="h-5 w-5 text-primary" />
                <AlertTitle className="font-bold text-sm">Información para la entrega</AlertTitle>
                <AlertDescription className="text-xs font-medium mt-1">
                  Necesitamos los datos del destinatario y la dirección exacta para coordinar al mensajero.
                </AlertDescription>
              </Alert>

              <div className="space-y-8 divide-y divide-border/40">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Datos del destinatario</p>
                    <h4 className="text-base font-semibold text-foreground">¿Quién recibe el arreglo?</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="guestRecipientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del destinatario</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} className="h-12 rounded-xl bg-muted/30 border-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestRecipientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono del destinatario</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="3312345678"
                              inputMode="numeric"
                              maxLength={10}
                              {...field}
                              onChange={(e) => field.onChange(sanitizePhoneDigits(e.target.value).slice(0, 10))}
                              className="h-12 rounded-xl bg-muted/30 border-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Dirección de entrega</p>
                    <h4 className="text-base font-semibold text-foreground">Confirma la ubicación</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="guestAddressAlias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alias (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Casa, Oficina, etc." {...field} className="h-12 rounded-xl bg-muted/30 border-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código postal</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="46400"
                              inputMode="numeric"
                              maxLength={5}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
                              className="h-12 rounded-xl bg-muted/30 border-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestStreetName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calle</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre de la calle" {...field} className="h-12 rounded-xl bg-muted/30 border-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestStreetNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número exterior</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} className="h-12 rounded-xl bg-muted/30 border-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestInteriorNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número interior (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="A-3" {...field} className="h-12 rounded-xl bg-muted/30 border-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestNeighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Colonia</FormLabel>
                          <FormControl>
                            <Input placeholder="Colonia" {...field} className="h-12 rounded-xl bg-muted/30 border-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Municipio</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none">
                                <SelectValue placeholder="Selecciona municipio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cityOptions.length > 0 ? (
                                cityOptions.map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="sin-localidades" disabled>
                                  Sin municipios disponibles
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="guestState"
                      render={({ field: _field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input
                              value="Jalisco"
                              readOnly
                              disabled
                              className="h-12 rounded-xl bg-muted/30 border-none opacity-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={control}
                    name="guestReferenceNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencias (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Punto de referencia para facilitar la entrega"
                            {...field}
                            className="min-h-[90px] rounded-xl bg-muted/30 border-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          ) : authLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : selectedAddress ? (
            <div className="space-y-6 w-full max-w-full">
              <button 
                type="button"
                className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 bg-muted/30 border border-border/50 rounded-2xl group transition-all hover:bg-muted/40 text-left min-w-0"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center shadow-sm shrink-0">
                    <Home className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="text-sm min-w-0 flex-1">
                    <p className="font-bold text-base truncate">{selectedAddress.alias}</p>
                    <div className="text-muted-foreground mt-1 space-y-0.5 font-medium leading-relaxed">
                      <p className="text-foreground truncate text-xs">Recibe: <span className="font-bold">{selectedAddress.recipientName}</span></p>
                      <p className="truncate text-[10px] sm:text-xs">{`${selectedAddress.streetName} ${selectedAddress.streetNumber}`}</p>
                      <p className="truncate text-[10px] sm:text-xs">{`${selectedAddress.neighborhood}, CP ${selectedAddress.postalCode}`}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </button>

              {shippingCostValue === null ? (
                <Alert variant="destructive" className="rounded-2xl border-2 border-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-bold text-sm">Sin Cobertura</AlertTitle>
                  <AlertDescription className="text-xs font-medium mt-1">Lo sentimos, no tenemos servicio en el CP {selectedAddress.postalCode}.</AlertDescription>
                </Alert>
              ) : (
                <div className="w-full max-w-full">
                  <GoogleMapEmbed address={selectedAddress} />
                </div>
              )}

              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 rounded-xl border-dashed border-2 border-primary/20 text-primary font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-primary/5 hover:border-primary transition-all" 
                onClick={() => setIsModalOpen(true)}
              >
                Usar otra dirección guardada
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10 w-full">
              <MapIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">No has seleccionado una ubicación</p>
              <Button 
                type="button" 
                className="w-full sm:w-auto rounded-xl h-14 px-8 font-bold text-sm shadow-lg shadow-primary/20 bg-primary hover:bg-[#E6286B] border-none" 
                onClick={() => setIsModalOpen(true)}
              >
                Seleccionar Dirección
              </Button>
            </div>
          )}
          
          <div className="flex justify-center sm:justify-end pt-2">
            <Button 
                type="button" 
                onClick={handleNext} 
              disabled={isGuestCheckout ? false : (!selectedAddress || shippingCostValue === null)}
                className="w-full sm:w-auto h-14 px-12 rounded-2xl font-bold shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95 bg-primary hover:bg-[#E6286B]"
            >
                Continuar
                <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      )}
      
      <AddressModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        addresses={user?.addresses || []}
        onAddressSelect={handleAddressSelect}
        selectedAddressId={addressId}
        onSaveAddress={handleSaveAddress as (address: Address | Omit<Address, 'id'>) => Promise<boolean>}
        onDeleteAddress={handleDeleteAddress}
        isSaving={isSaving}
      />
    </Card>
  );
}
