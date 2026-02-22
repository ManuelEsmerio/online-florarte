'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddressForm } from './AddressForm';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { PlusCircle, Edit, Trash2, Search, ArrowLeft, Copy, X, MapPin } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Input } from './ui/input';
import type { Address } from '@/lib/definitions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface AddressModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onAddressSelect: (address: Address) => void;
    onSaveAddress: (address: Omit<Address, 'id'> | Address) => Promise<boolean>;
    onDeleteAddress: (addressId: number) => Promise<void>;
    selectedAddressId?: number;
    addresses: Address[];
    isSaving: boolean;
    addressToEdit?: Address | null;
}

export function AddressModal({
    isOpen,
    onOpenChange,
    onAddressSelect,
    onSaveAddress,
    onDeleteAddress,
    selectedAddressId,
    addresses,
    isSaving,
    addressToEdit: initialAddressToEdit,
}: AddressModalProps) {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [addressToEdit, setAddressToEdit] = useState<Address | null>(initialAddressToEdit || null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAddresses = useMemo(() => {
        if (!searchTerm) return addresses;
        const lowercasedTerm = searchTerm.toLowerCase();
        return addresses.filter(addr => 
            addr.alias.toLowerCase().includes(lowercasedTerm) ||
            addr.recipientName.toLowerCase().includes(lowercasedTerm) ||
            addr.streetName.toLowerCase().includes(lowercasedTerm)
        );
    }, [addresses, searchTerm]);
    
    const handleDuplicateAndEdit = (address: Address) => {
        setAddressToEdit({
            ...address,
            id: 0, 
            recipientName: '',
            alias: `${address.alias} (Copia)`
        });
        setView('form');
    }

    const handleEdit = (address: Address) => {
        setAddressToEdit(address);
        setView('form');
    };
    
    const handleAddNew = () => {
        setAddressToEdit(null);
        setView('form');
    }
    
    const handleBackToList = () => {
        if (addresses.length === 0) {
            onOpenChange(false);
            return;
        }
        setView('list');
        setAddressToEdit(null);
    }
    
    const handleSave = async (address: Address) => {
      const success = await onSaveAddress(address);
      if (success) {
        setView('list');
      }
      return success;
    }

    useEffect(() => {
        if (isOpen) {
            if (initialAddressToEdit) {
                setAddressToEdit(initialAddressToEdit);
                setView('form');
            } else if (addresses.length === 0) {
                setView('form');
            } else {
                setView('list');
            }
            setSearchTerm('');
        }
    }, [isOpen, addresses.length, initialAddressToEdit]);


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
                className="w-[95vw] sm:w-full sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-background"
                hideCloseButton={true}
            >
                <DialogHeader className="p-6 md:p-8 pb-4 text-center relative border-b border-border/50">
                    {view === 'form' && addresses.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleBackToList} 
                            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div className="space-y-1">
                        <DialogTitle className="font-headline text-2xl md:text-3xl font-bold">
                            {view === 'form' ? (addressToEdit ? 'Editar Dirección' : 'Nueva Dirección') : 'Seleccionar Dirección'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs md:text-sm font-medium">
                            {view === 'form' ? 'Completa la información para guardar.' : 'Elige dónde entregaremos tus flores.'}
                        </DialogDescription>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </DialogHeader>

                <div className="p-4 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {view === 'form' ? (
                        <AddressForm 
                            addressToEdit={addressToEdit}
                            onSave={handleSave}
                            onCancel={handleBackToList}
                            isSaving={isSaving}
                        />
                    ) : (
                        <div className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Buscar por alias, destinatario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-12 pl-11 pr-4 bg-muted/30 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-medium text-sm"
                                />
                            </div>

                            <RadioGroup
                                value={selectedAddressId?.toString()}
                                onValueChange={(val) => {
                                    const selected = addresses.find(a => a.id === Number(val));
                                    if(selected) onAddressSelect(selected);
                                }}
                                className="grid grid-cols-1 gap-4"
                            >
                                {filteredAddresses?.map(address => (
                                     <div key={address.id} className="relative">
                                        <Label 
                                            htmlFor={`modal-addr-${address.id}`} 
                                            className={cn(
                                                "block p-4 md:p-6 rounded-[2rem] border-2 transition-all cursor-pointer group",
                                                selectedAddressId === address.id 
                                                    ? "border-primary bg-primary/5 ring-4 ring-primary/5" 
                                                    : "border-border/50 bg-card hover:border-primary/30"
                                            )}
                                        >
                                            <div className="flex items-start gap-3 md:gap-4">
                                                <RadioGroupItem value={String(address.id)} id={`modal-addr-${address.id}`} className="mt-1" />
                                                <div className="flex-1 min-w-0 pr-14">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-bold text-base md:text-lg">{address.alias}</span>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                                            {address.addressType}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs md:text-sm text-muted-foreground space-y-0.5 font-medium leading-relaxed">
                                                        <p className="truncate">Para: <span className="text-foreground">{address.recipientName}</span></p>
                                                        <p className="truncate">{address.streetName} {address.streetNumber}{address.interiorNumber ? `, Int ${address.interiorNumber}` : ''}</p>
                                                        <p className="truncate">{address.neighborhood}, CP {address.postalCode}</p>
                                                        <p className="truncate">{address.city}, {address.state}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Label>
                                        
                                        <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-background shadow-sm border border-border/50 text-muted-foreground hover:text-primary transition-all" onClick={(e) => { e.preventDefault(); handleEdit(address); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-background shadow-sm border border-border/50 text-muted-foreground hover:text-destructive transition-all">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl w-[90vw] max-w-sm">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="font-headline text-2xl">¿Eliminar?</AlertDialogTitle>
                                                        <AlertDialogDescription>Se eliminará "{address.alias}" de tu perfil.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="gap-2">
                                                        <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted/50 font-bold">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDeleteAddress(address.id)} className="bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20">Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-background shadow-sm border border-border/50 text-muted-foreground hover:text-primary transition-all hidden md:flex" onClick={(e) => { e.preventDefault(); handleDuplicateAndEdit(address); }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                     </div>
                                ))}
                            </RadioGroup>

                             <Button 
                                variant="outline" 
                                className="w-full h-14 md:h-16 rounded-2xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary font-bold text-base md:text-lg gap-3 transition-all" 
                                onClick={handleAddNew}
                             >
                                <PlusCircle className="h-5 w-5 md:h-6 md:w-6" />
                                Agregar Nueva Dirección
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.2); border-radius: 10px; }
            `}</style>
        </Dialog>
    );
}
