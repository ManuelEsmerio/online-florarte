
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddressModal } from '@/components/AddressModal';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/page';
import { useAuth } from '@/context/AuthContext';
import { MapPin, AlertCircle, CheckCircle, Home, ArrowRight, Map, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Address } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GoogleMapEmbed = ({ address }: { address: Address }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="aspect-video w-full bg-muted/30 rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/50 max-w-full">
        <Map className="w-8 h-8 text-muted-foreground/30 mb-2" />
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
  const { watch, setValue, trigger } = useFormContext<CheckoutFormValues>();
  const { user, shippingZones, addAddress, updateAddress, deleteAddress, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isGuestCheckout = !user?.id;
  
  const addressId = watch('addressId');
  const selectedAddress = user?.addresses?.find(a => a.id === addressId);
  const currentZone = selectedAddress
    ? shippingZones.find(z => z.postalCode === selectedAddress.postalCode)
      ?? shippingZones.find(z => z.locality === selectedAddress.city)
    : null;
  const shippingCostValue = currentZone?.shippingCost ?? null;

  const isCompleted = isGuestCheckout
    ? currentStep > 2
    : ((!!selectedAddress && shippingCostValue !== null) || currentStep > 2);

  useEffect(() => {
    if (isGuestCheckout) {
      setShippingCost(0);
      return;
    }

    if (selectedAddress) {
      const zone = shippingZones.find(z => z.postalCode === selectedAddress.postalCode)
        ?? shippingZones.find(z => z.locality === selectedAddress.city);
      setShippingCost(zone ? zone.shippingCost : null);
    }
  }, [isGuestCheckout, selectedAddress, shippingZones, setShippingCost]);

  const handleAddressSelect = useCallback((address: Address) => {
    setValue('addressId', address.id, { shouldValidate: true });
    setIsModalOpen(false);
  }, [setValue]);

  const handleSaveAddress = async (address: Address) => {
    setIsSaving(true);
    const action = address.id && address.id > 0 ? updateAddress : addAddress;
    if (action) {
      const result = await action(address);
      if (result.success && result.data?.addresses) {
        if (!address.id || address.id === 0) {
          const newAddress = result.data.addresses.at(-1);
          if (newAddress) setValue('addressId', newAddress.id, { shouldValidate: true });
        }
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
              <h3 className="text-base md:text-xl font-bold font-headline truncate">Elige a quién enviarlo</h3>
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
            <Alert className="rounded-2xl border-primary/20 bg-primary/5">
              <MapPin className="h-5 w-5 text-primary" />
              <AlertTitle className="font-bold text-sm">Checkout como invitado</AlertTitle>
              <AlertDescription className="text-xs font-medium mt-1">
                Continuarás con costo de envío provisional de $0.00. Confirmaremos dirección y ruta contigo por teléfono.
              </AlertDescription>
            </Alert>
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
              <Map className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
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
        onSaveAddress={handleSaveAddress}
        onDeleteAddress={handleDeleteAddress}
        isSaving={isSaving}
      />
    </Card>
  );
}
