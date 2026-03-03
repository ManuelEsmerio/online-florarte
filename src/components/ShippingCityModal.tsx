
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import type { ShippingZone } from '@/lib/definitions';
import { ArrowRight, ChevronDown, Flower2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Isotype } from './icons/Isotype';

export interface SelectedCity {
    postalCode: string;
    locality: string;
    shippingCost: number;
}

interface ShippingCityModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    shippingZones: ShippingZone[];
    onConfirm: (city: SelectedCity) => void;
}

export function ShippingCityModal({
    isOpen,
    onOpenChange,
    shippingZones,
    onConfirm,
}: ShippingCityModalProps) {
    const { toast } = useToast();
    const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');

    const municipalities = useMemo(() => {
        const uniqueMunicipalities = new Map<string, ShippingZone>();
        shippingZones.forEach(zone => {
            const key = (zone.municipality ?? zone.locality ?? '').trim();
            if (!key) return;
            if (!uniqueMunicipalities.has(key)) {
                uniqueMunicipalities.set(key, zone);
            }
        });
        return Array.from(uniqueMunicipalities.entries()).map(([name, zone]) => ({ name, zone }));
    }, [shippingZones]);

    const handleConfirm = () => {
        if (!selectedMunicipality) {
            toast({
                title: 'Selección requerida',
                description: 'Por favor, selecciona una ciudad de entrega.',
                variant: 'destructive',
            });
            return;
        }

        const selectedZone = shippingZones.find(zone => {
            const key = (zone.municipality ?? zone.locality ?? '').trim();
            return key === selectedMunicipality;
        }) ?? municipalities.find(entry => entry.name === selectedMunicipality)?.zone;

        if (selectedZone) {
            onConfirm({
                locality: selectedZone.municipality ?? selectedZone.locality,
                postalCode: selectedZone.postalCode,
                shippingCost: selectedZone.shippingCost,
            });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
                <div className="p-8 pt-12 md:p-10 md:pt-14 relative">
                    <div className="text-center mb-10">
                        <DialogTitle className="font-headline text-3xl md:text-4xl text-foreground mb-3">
                            ¿A dónde quieres enviar?
                        </DialogTitle>
                        <DialogDescription className="text-sm md:text-base text-muted-foreground leading-relaxed px-2">
                            Los regalos y las opciones de envío podrían variar según la ciudad de entrega.
                        </DialogDescription>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="state" className="block text-sm font-semibold text-foreground/80 ml-1">
                                Estado <span className="text-primary">*</span>
                            </Label>
                            <div className="relative">
                                <Input 
                                    id="state" 
                                    value="Jalisco" 
                                    readOnly 
                                    className="w-full h-14 px-5 py-4 bg-muted/30 border-none rounded-2xl text-foreground font-medium cursor-default focus-visible:ring-0" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city" className="block text-sm font-semibold text-foreground/80 ml-1">
                                Ciudad <span className="text-primary">*</span>
                            </Label>
                            <div className="relative group">
                                <Select
                                    value={selectedMunicipality}
                                    onValueChange={setSelectedMunicipality}
                                >
                                    <SelectTrigger className="w-full h-14 px-5 py-4 bg-muted/30 border-none rounded-2xl text-foreground font-medium focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Selecciona una ciudad" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[2000] rounded-2xl border-none shadow-xl">
                                        {municipalities.map(({ name, zone }) => (
                                            <SelectItem key={`${name}-${zone.postalCode}`} value={name} className="rounded-lg py-3">
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleConfirm} 
                                className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            >
                                <span className="text-lg">Confirmar</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-center opacity-30">
                        <div className="flex items-center gap-2 grayscale">
                            <Isotype className="w-5 h-5" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Florarte</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
