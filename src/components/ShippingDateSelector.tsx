'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeliveryDateModal } from './DeliveryDateModal';

export function ShippingDateSelector() {
    const { toast } = useToast();
    const router = useRouter();
    const { shippingZones, loading: authLoading } = useAuth();
    const { selectedCity, setSelectedCity, deliveryDate, setDeliveryDate } = useCart();
    
    const [city, setCity] = useState<string>('');
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        setCity(selectedCity?.locality || '');
    }, [selectedCity]);

    const localities = useMemo(() => {
        const uniqueLocalities = new Map<string, { postalCode: string; locality: string; shippingCost: number }>();
        shippingZones.forEach(zone => {
            if (!uniqueLocalities.has(zone.locality)) {
                uniqueLocalities.set(zone.locality, {
                    postalCode: zone.postalCode,
                    locality: zone.locality,
                    shippingCost: zone.shippingCost,
                });
            }
        });
        return Array.from(uniqueLocalities.values());
    }, [shippingZones]);

    const handleCityChange = (locality: string) => {
        const selected = localities.find(l => l.locality === locality);
        if (selected && setSelectedCity) {
            setSelectedCity(selected);
        }
    }
    
    const handleDateSave = (selectedDate: Date) => {
        if(setDeliveryDate) {
            setDeliveryDate(format(selectedDate, 'yyyy-MM-dd'));
        }
    }

    const handleViewGifts = () => {
        if (!city || !deliveryDate) {
            toast({
                variant: 'info',
                title: '¡Un momento!',
                description: 'Por favor, elige una ciudad y fecha de envío para continuar.',
            });
            return;
        }
        router.push('/products/all');
    };

    const formattedDate = useMemo(() => {
        if (!mounted) return 'Cargando fecha...';
        if (!deliveryDate || deliveryDate.includes('No especificada')) return 'Selecciona una fecha';
        try {
            const dateString = deliveryDate.includes('T') ? deliveryDate : `${deliveryDate}T12:00:00`;
            const date = new Date(dateString);
            return format(date, 'PPP', { locale: es });
        } catch (e) {
            return deliveryDate;
        }
    }, [deliveryDate, mounted]);
    
    return (
        <div className="container mx-auto px-4">
            <div className="group bg-card p-5 md:p-8 rounded-[2rem] shadow-2xl border border-border/50 relative z-20 transition-all duration-300 overflow-hidden">
                {/* Decoración de Flor en la parte superior con animación */}
                <div className="absolute top-4 right-4 opacity-50 pointer-events-none -z-10 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                    <Flower2 className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                </div>

                <p className="font-headline text-lg md:text-xl font-bold mb-4 md:mb-6 text-foreground text-center md:text-left relative z-10">¿A dónde quieres enviar?</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end relative z-10">
                    <div className="space-y-1.5 md:col-span-1">
                        <Label htmlFor="state" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Estado</Label>
                        <Input id="state" value="Jalisco" disabled className="h-11 md:h-12 rounded-xl bg-muted/30 border-none !transition-none !duration-0" />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <Label htmlFor="city-select" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Ciudad</Label>
                         <Select value={city} onValueChange={handleCityChange}>
                            <SelectTrigger id="city-select" className="h-11 md:h-12 rounded-xl bg-muted/30 border-none !transition-none !duration-0 focus:ring-primary/20">
                                <SelectValue placeholder="Selecciona una ciudad" />
                            </SelectTrigger>
                            <SelectContent>
                                {!mounted || authLoading ? (
                                    <SelectItem key="loading-city" value="loading" disabled>Cargando...</SelectItem>
                                ) : (
                                    localities.map(zone => (
                                        <SelectItem key={zone.postalCode || zone.locality} value={zone.locality}>
                                            {zone.locality}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <Label htmlFor="shipping-date" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha de envío</Label>
                        <Button
                            id="shipping-date"
                            variant={'ghost'}
                            className={cn(
                                'w-full h-11 md:h-12 justify-start text-left font-normal rounded-xl bg-muted/30 border-none !transition-none !duration-0 hover:bg-muted/50 hover:text-foreground',
                                (!deliveryDate || deliveryDate.includes('No especificada')) ? 'text-muted-foreground' : 'text-foreground font-medium'
                            )}
                            onClick={() => setIsCalendarModalOpen(true)}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            <span className="truncate text-sm">{formattedDate}</span>
                        </Button>
                    </div>
                    <Button onClick={handleViewGifts} className="w-full h-12 md:w-auto md:col-span-1 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 !transition-none !duration-0 mt-2 md:mt-0 active:scale-95 transition-transform">
                        Ver regalos
                    </Button>
                </div>
            </div>

            <DeliveryDateModal 
                isOpen={isCalendarModalOpen}
                onOpenChange={setIsCalendarModalOpen}
                currentDate={deliveryDate}
                onSave={handleDateSave}
            />
        </div>
    );
}