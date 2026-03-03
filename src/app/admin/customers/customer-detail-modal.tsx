
'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { User, Address } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Gem, Mail, Phone, Calendar, Home, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
}

const DetailRow = ({ label, value, icon }: { label: string; value: React.ReactNode, icon: React.ReactNode }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm">
            <dt className="flex-shrink-0 text-primary w-8 mt-0.5">{icon}</dt>
            <dd className="text-foreground flex-1">
                <span className='font-bold text-[10px] uppercase tracking-widest text-muted-foreground block mb-0.5'>{label}</span>
                <div className="font-medium text-sm md:text-base">{value}</div>
            </dd>
        </div>
    )
};

export function CustomerDetailModal({
  isOpen,
  onOpenChange,
  user,
}: CustomerDetailModalProps) {
    const { shippingZones } = useAuth();

    const localityByPostalCode = useMemo(() => {
        const entries = (shippingZones || []).map(zone => [zone.postalCode, zone.locality] as const);
        return new Map(entries);
    }, [shippingZones]);

    const getAddressLocality = (address: Address) => {
        return localityByPostalCode.get(address.postalCode) || address.city;
    };

    if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] md:rounded-[2.5rem] bg-background flex flex-col max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 md:p-8 pb-4 border-b border-border/50 relative">
          <DialogTitle className="font-headline text-2xl md:text-3xl font-bold">Detalles del Perfil</DialogTitle>
          <DialogDescription className="text-xs md:text-sm font-medium">
            Información completa del usuario y su actividad.
          </DialogDescription>
          {/* <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full h-10 w-10 text-muted-foreground hover:text-primary transition-all"
          >
            <X className="h-5 w-5" />
          </Button> */}
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-muted/20 rounded-[2rem] border border-border/50">
                <div className="relative group">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-lg transition-transform duration-500 group-hover:scale-105">
                        <AvatarImage src={user.profilePicUrl || undefined} alt={user.name} />
                        <AvatarFallback className="text-2xl md:text-3xl bg-primary text-white font-bold">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-background rounded-full" />
                </div>
                <div className="text-center sm:text-left flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold font-headline leading-tight truncate">{user.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                        <Badge variant="secondary" className="capitalize text-[10px] font-bold px-2 py-0.5">{user.role}</Badge>
                        <Badge variant={user.isDeleted ? 'destructive' : 'success'} className="text-[10px] font-bold px-2 py-0.5">
                            {user.isDeleted ? 'Desactivado' : 'Activo'}
                        </Badge>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                <div className="space-y-6">
                     <DetailRow label="Correo Electrónico" icon={<Mail className="w-4 h-4" />} value={user.email} />
                     <DetailRow label="Teléfono Directo" icon={<Phone className="w-4 h-4" />} value={user.phone || 'No registrado'} />
                </div>
                 <div className="space-y-6">
                     <DetailRow label="Puntos Acumulados" icon={<Gem className="w-4 h-4" />} value={<span className="font-bold text-primary font-sans">{user.loyaltyPoints || 0} pts</span>} />
                     {user.createdAt && <DetailRow label="Miembro desde" icon={<Calendar className="w-4 h-4" />} value={format(new Date(user.createdAt), 'dd MMM, yyyy', { locale: es })} />}
                </div>
            </div>
            
            <Separator className="bg-border/30" />

            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-lg md:text-xl font-headline flex items-center gap-2">
                        <Home className="w-5 h-5 text-primary" />
                        Direcciones Guardadas
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold">{user.addresses?.length || 0} / 5</Badge>
                </div>
                
                {user.addresses && user.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {user.addresses.map((address) => (
                            <div key={address.id} className="p-5 rounded-[1.5rem] border-2 border-border/50 text-sm bg-card hover:border-primary/20 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="font-bold text-base flex items-center gap-2">
                                        {address.alias}
                                        {address.isDefault && <Badge className="h-4 text-[8px] bg-primary text-white border-none">Predeterminada</Badge>}
                                    </p>
                                    <Badge variant="secondary" className="capitalize text-[9px] font-bold">{address.addressType?.replace('-', ' ')}</Badge>
                                </div>
                                <div className="text-muted-foreground space-y-1 pl-1">
                                    <p className="text-xs"><strong>Recibe:</strong> {address.recipientName} ({address.recipientPhone || 'Sin teléfono'})</p>
                                    <p className="text-xs leading-relaxed">{`${address.streetName} ${address.streetNumber}${address.interiorNumber ? `, Int. ${address.interiorNumber}` : ''}`}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">{`${address.neighborhood}, ${getAddressLocality(address)}, CP ${address.postalCode}`}</p>
                                    {address.referenceNotes && (
                                        <div className="mt-3 p-3 rounded-xl bg-muted/50 text-[10px] italic border-l-2 border-primary/30">
                                            Ref: {address.referenceNotes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/50">
                        <Home className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">Este usuario no tiene direcciones guardadas.</p>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
