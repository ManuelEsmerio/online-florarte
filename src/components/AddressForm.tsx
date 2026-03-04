'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import type { Address } from '@/lib/definitions';
import { CheckCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { ADDRESS_TYPE_OPTIONS } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { PHONE_CODES, parsePhoneValue, formatPhoneDisplay, sanitizePhoneDigits } from '@/utils/phone';
import { loadGoogleMapsApi } from '@/lib/googleMaps';

const addressFormSchema = z.object({
  id: z.number().optional(),
  alias: z.string().min(3, 'El alias de la dirección es requerido.'),
  recipientName: z.string().min(3, 'El nombre del destinatario es requerido.'),
    recipientPhone: z.string().min(10, 'El teléfono debe tener 10 dígitos.').max(10, 'El teléfono debe tener 10 dígitos.'),
    recipientPhoneCountryCode: z.enum(PHONE_CODES).default('+52'),
  streetName: z.string().min(3, 'El nombre de la calle es requerido.'),
  streetNumber: z.string().min(1, 'El número exterior es requerido.'),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().min(3, 'La colonia es requerida.'),
  city: z.string().min(3, 'La ciudad es requerida.'),
  state: z.string().min(3, 'El estado es requerido.'),
  postalCode: z.string().min(5, 'El código postal es requerido.'),
  addressType: z.enum(ADDRESS_TYPE_OPTIONS.map(option => option.value) as [string, ...string[]], { required_error: 'Debes seleccionar un tipo de domicilio.' }),
  referenceNotes: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  addressToEdit?: Address | null;
  onSave: (address: Address) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
}

export function AddressForm({ addressToEdit, onSave, onCancel, isSaving }: AddressFormProps) {
    const { shippingZones } = useAuth();
    const parsedRecipientPhone = useMemo(() => parsePhoneValue(addressToEdit?.recipientPhone), [addressToEdit?.recipientPhone]);
    const initialCoordinates = useMemo(() => {
        if (
            addressToEdit?.latitude !== undefined &&
            addressToEdit?.latitude !== null &&
            addressToEdit?.longitude !== undefined &&
            addressToEdit?.longitude !== null
        ) {
            return {
                lat: Number(addressToEdit.latitude),
                lng: Number(addressToEdit.longitude),
            };
        }
        return null;
    }, [addressToEdit?.latitude, addressToEdit?.longitude]);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
        alias: '',
        recipientName: '',
        recipientPhone: '',
                recipientPhoneCountryCode: parsedRecipientPhone.code,
        streetName: '',
        streetNumber: '',
        interiorNumber: '',
        neighborhood: '',
        city: 'Tequila',
        state: 'Jalisco',
        postalCode: '',
        addressType: 'HOME',
        referenceNotes: '',
    },
    values: addressToEdit ? {
        ...addressToEdit,
        recipientPhone: parsedRecipientPhone.digits,
        recipientPhoneCountryCode: parsedRecipientPhone.code,
        interiorNumber: addressToEdit.interiorNumber || '',
        state: 'Jalisco',
        referenceNotes: addressToEdit.referenceNotes || '',
    } : undefined,
    });

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(initialCoordinates);
    const [placeId, setPlaceId] = useState<string | null>(addressToEdit?.googlePlaceId || null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeMessage, setGeocodeMessage] = useState<string | null>(() => {
        if (!googleMapsApiKey) {
            return 'Agrega tu API key de Google Maps para visualizar la ubicación.';
        }
        return initialCoordinates ? null : 'Completa la dirección para mostrar el mapa.';
    });
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const geocoderRef = useRef<any>(null);

    useEffect(() => {
        setCoordinates(initialCoordinates);
        setPlaceId(addressToEdit?.googlePlaceId || null);
        if (!googleMapsApiKey) {
            setGeocodeMessage('Agrega tu API key de Google Maps para visualizar la ubicación.');
        } else if (initialCoordinates) {
            setGeocodeMessage(null);
        }
    }, [initialCoordinates, addressToEdit?.googlePlaceId, googleMapsApiKey]);

    useEffect(() => {
        if (form.getValues('state') !== 'Jalisco') {
            form.setValue('state', 'Jalisco', { shouldValidate: true });
        }
    }, [form]);

    const addressWatch = (useWatch({
        control: form.control,
        name: ['streetName', 'streetNumber', 'interiorNumber', 'neighborhood', 'city', 'state', 'postalCode'],
    }) as (string | undefined)[]) || [];

    const [
        streetNameWatch = '',
        streetNumberWatch = '',
        interiorNumberWatch = '',
        neighborhoodWatch = '',
        cityWatch = '',
        stateWatch = '',
        postalCodeWatch = '',
    ] = addressWatch;

    const cityValue = cityWatch;
    const postalCodeValue = postalCodeWatch;

    const formattedAddress = useMemo(() => {
        const mainLine = [streetNameWatch, streetNumberWatch].filter(Boolean).join(' ').trim();
        const areaLine = [neighborhoodWatch, cityWatch, stateWatch].filter(Boolean).join(', ');
        const postalLine = postalCodeWatch ? `CP ${postalCodeWatch}` : '';
        const optionalInterior = interiorNumberWatch ? `Interior ${interiorNumberWatch}` : '';
        return [mainLine, optionalInterior, areaLine, postalLine, 'México']
            .filter((value) => value && value.length > 0)
            .join(', ');
    }, [streetNameWatch, streetNumberWatch, interiorNumberWatch, neighborhoodWatch, cityWatch, stateWatch, postalCodeWatch]);

    const shouldAttemptGeocode = Boolean(streetNameWatch && streetNumberWatch && cityWatch && stateWatch && postalCodeWatch);
    const shouldShowOverlay = !googleMapsApiKey || (!coordinates && Boolean(geocodeMessage));

    const cityOptions = useMemo(() => {
        const normalized = (shippingZones || [])
            .map(zone => (zone.municipality || zone.locality || '').trim())
            .filter((value): value is string => Boolean(value));

        const uniqueBySlug = new Map<string, string>();
        for (const name of normalized) {
            const key = name.toLowerCase();
            if (!uniqueBySlug.has(key)) {
                uniqueBySlug.set(key, name);
            }
        }

        return Array.from(uniqueBySlug.values()).sort((a, b) => a.localeCompare(b, 'es'));
    }, [shippingZones]);

    useEffect(() => {
        if (!cityValue && cityOptions.length > 0) {
            form.setValue('city', cityOptions[0], { shouldValidate: true });
        }
    }, [cityOptions, cityValue, form]);

    useEffect(() => {
        if (!postalCodeValue) return;
        const matchedZone = shippingZones.find(zone => zone.postalCode === postalCodeValue);
        const matchedMunicipality = matchedZone?.municipality || matchedZone?.locality;
        if (matchedMunicipality && matchedMunicipality !== cityValue) {
            form.setValue('city', matchedMunicipality, { shouldValidate: true });
        }
    }, [postalCodeValue, shippingZones, cityValue, form]);

    useEffect(() => {
        if (!googleMapsApiKey) {
            setGeocodeMessage('Agrega tu API key de Google Maps para visualizar la ubicación.');
            setIsGeocoding(false);
            return;
        }

        if (!shouldAttemptGeocode && !coordinates) {
            setGeocodeMessage('Completa la calle, número, ciudad y C.P. para mostrar el mapa.');
            setIsGeocoding(false);
        }
    }, [googleMapsApiKey, shouldAttemptGeocode, coordinates]);

    useEffect(() => {
        if (!googleMapsApiKey || !shouldAttemptGeocode) {
            return;
        }

        const addressQuery = formattedAddress.trim();
        if (!addressQuery) return;

        setIsGeocoding(true);
        setGeocodeMessage('Actualizando ubicación...');

        let cancelled = false;
        const debounceId = window.setTimeout(() => {
            loadGoogleMapsApi(googleMapsApiKey)
                .then((maps) => {
                    if (cancelled) return;
                    if (!geocoderRef.current) {
                        geocoderRef.current = new maps.Geocoder();
                    }
                    geocoderRef.current.geocode({ address: addressQuery }, (results: any, status: string) => {
                        if (cancelled) return;
                        setIsGeocoding(false);
                        if (status === 'OK' && results?.length) {
                            const firstResult = results[0];
                            const location = firstResult.geometry.location;
                            if (location) {
                                const nextCoords = { lat: location.lat(), lng: location.lng() };
                                setCoordinates(nextCoords);
                                setPlaceId(firstResult.place_id || null);
                                setGeocodeMessage(null);
                            }
                        } else {
                            setGeocodeMessage('No pudimos ubicar esta dirección. Revisa los datos ingresados.');
                        }
                    });
                })
                .catch((error) => {
                    if (cancelled) return;
                    setIsGeocoding(false);
                    setGeocodeMessage(error.message || 'Error al conectar con Google Maps.');
                });
        }, 600);

        return () => {
            cancelled = true;
            window.clearTimeout(debounceId);
        };
    }, [formattedAddress, shouldAttemptGeocode, googleMapsApiKey]);

    useEffect(() => {
        if (!googleMapsApiKey || !coordinates) {
            return;
        }

        let cancelled = false;

        loadGoogleMapsApi(googleMapsApiKey)
            .then((maps) => {
                if (cancelled || !mapContainerRef.current) return;

                if (!mapInstanceRef.current) {
                    mapInstanceRef.current = new maps.Map(mapContainerRef.current, {
                        center: coordinates,
                        zoom: 16,
                        disableDefaultUI: true,
                        zoomControl: true,
                        gestureHandling: 'greedy',
                    });
                } else {
                    mapInstanceRef.current.setCenter(coordinates);
                    mapInstanceRef.current.setZoom(16);
                }

                if (!markerRef.current) {
                    markerRef.current = new maps.Marker({
                        map: mapInstanceRef.current,
                        position: coordinates,
                    });
                } else {
                    markerRef.current.setPosition(coordinates);
                }
            })
            .catch((error) => {
                if (cancelled) return;
                setGeocodeMessage(error.message || 'No pudimos renderizar el mapa.');
            });

        return () => {
            cancelled = true;
        };
    }, [coordinates, googleMapsApiKey]);

    const onSubmit = async (data: AddressFormValues) => {
                const { recipientPhoneCountryCode, recipientPhone, ...rest } = data;
                const phoneDigits = sanitizePhoneDigits(recipientPhone);
                const finalData = {
                        ...rest,
                        state: 'Jalisco',
                        id: addressToEdit?.id ?? 0,
                        recipientPhone: phoneDigits ? formatPhoneDisplay(recipientPhoneCountryCode, phoneDigits) : '',
                        referenceNotes: data.referenceNotes,
                    latitude: coordinates?.lat ?? null,
                    longitude: coordinates?.lng ?? null,
                    googlePlaceId: placeId || null,
                };
        await onSave(finalData as Address);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Alias de la dirección *</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Mi Casa, Oficina de Mamá" {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre de quien recibe *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre y Apellido" {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Teléfono de contacto *</FormLabel>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <FormField
                                    control={form.control}
                                    name="recipientPhoneCountryCode"
                                    render={({ field: codeField }) => (
                                        <FormItem className="sm:w-[160px]">
                                            <FormControl>
                                                <Select onValueChange={codeField.onChange} value={codeField.value}>
                                                    <SelectTrigger className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium">
                                                        <SelectValue placeholder="Prefijo" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        <SelectItem value="+52">México (+52)</SelectItem>
                                                        <SelectItem value="+1">Estados Unidos / Canadá (+1)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormControl>
                                    <Input
                                        placeholder="33 1234 5678"
                                        {...field}
                                        inputMode="numeric"
                                        onChange={(e) => field.onChange(sanitizePhoneDigits(e.target.value))}
                                        className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium tracking-wide"
                                    />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="streetName"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Calle *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="streetNumber"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Núm. Ext *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="interiorNumber"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Núm. Int</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Opcional" className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Colonia *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Ciudad *</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                        <SelectTrigger className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium">
                                                                                <SelectValue placeholder="Selecciona una ciudad" />
                                                                        </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="z-[9999] max-h-[200px]">
                                                                        {cityOptions.length > 0 ? (
                                                                            cityOptions.map((city) => (
                                                                                <SelectItem key={city} value={city}>
                                                                                    {city}
                                                                                </SelectItem>
                                                                            ))
                                                                        ) : (
                                                                            <SelectItem value={field.value || 'sin-localidades'} disabled>
                                                                                Sin localidades disponibles
                                                                            </SelectItem>
                                                                        )}
                                                                </SelectContent>
                                                        </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="state"
                    render={() => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Estado *</FormLabel>
                            <FormControl>
                                <Input value="Jalisco" readOnly disabled className="h-14 rounded-xl bg-muted/30 border-none font-medium opacity-100" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">C.P. *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <section className="space-y-3 rounded-[2rem] border border-border/40 bg-card/70 p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-bold text-foreground">Ubicación aproximada</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">Validamos tu dirección con Google Maps para optimizar la entrega.</p>
                        </div>
                    </div>
                    {isGeocoding && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Actualizando
                        </span>
                    )}
                </div>
                <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-border/40 bg-muted" aria-live="polite">
                    <div ref={mapContainerRef} className="absolute inset-0" aria-hidden={shouldShowOverlay}></div>
                    {shouldShowOverlay && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground bg-background/80 backdrop-blur-sm">
                            <MapPin className="h-6 w-6 opacity-70" />
                            <p className="font-medium">
                                {googleMapsApiKey
                                    ? geocodeMessage || 'Completa la dirección para mostrar el mapa.'
                                    : 'Agrega tu API key de Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) para visualizar la ubicación.'}
                            </p>
                        </div>
                    )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {geocodeMessage ?? 'Si el pin no coincide con la ubicación real, ajusta los datos para mejorar la entrega.'}
                </p>
            </section>

            <FormField
                control={form.control}
                name="addressType"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Tipo de domicilio *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                            </FormControl>
                            {/* AGREGADO: z-[9999] o z-50 para asegurar que flote encima del modal */}
                            <SelectContent className="z-[9999] max-h-[200px]"> 
                                {ADDRESS_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="referenceNotes"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Referencias y notas</FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Ej: Portón café, frente al parque..." 
                                {...field} 
                                className="min-h-[100px] rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium resize-none p-4"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Por favor, verifica que todos los datos sean correctos para asegurar que tus flores lleguen puntuales y frescas a su destino.
            </p>
        </div>
       
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
                type="submit" 
                className="flex-1 h-16 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all gap-2" 
                loading={isSaving}
            >
                <CheckCircle className="h-5 w-5" />
                Guardar Dirección
            </Button>
            <Button 
                type="button" 
                variant="ghost" 
                onClick={onCancel} 
                disabled={isSaving}
                className="h-16 rounded-2xl font-bold text-muted-foreground"
            >
                Cancelar
            </Button>
        </div>
      </form>
    </Form>
  );
}
