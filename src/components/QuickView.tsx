
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Product, ProductVariant, ProductRow } from '@/lib/definitions';
import ProductImageCarousel from './ProductImageCarousel';
import { Skeleton } from './ui/skeleton';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { useCart } from '@/context/CartContext';
import { 
    Flower2, 
    Calendar as CalendarIcon, 
    Loader2, 
    Heart, 
    Truck, 
    Clock, 
    FileText, 
    Share2, 
    X, 
    RefreshCw, 
    Palette, 
    Info, 
    MapPin, 
    Zap, 
    Phone, 
    Mail, 
    AlertTriangle 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { DeliveryDateModal } from './DeliveryDateModal';
import { ComplementSlider } from './ComplementSlider';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface QuickViewProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: ProductRow;
}

const QuickViewSkeleton = () => (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 items-start h-full animate-pulse p-6 md:p-10">
        <div className="lg:col-span-7 space-y-6">
            <Skeleton className="w-full aspect-[4/5] rounded-[2.5rem]" />
            <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-xl" />
                <Skeleton className="w-20 h-20 rounded-xl" />
                <Skeleton className="w-20 h-20 rounded-xl" />
            </div>
        </div>
        <div className="lg:col-span-5 flex flex-col space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-10 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
            </div>
            <Skeleton className="h-10 w-1/3 rounded-lg" />
            <div className="space-y-6">
                <div className="space-y-3">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-24 rounded-lg" />
                    </div>
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="mt-auto pt-8 border-t border-border/50">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    </div>
);

export default function QuickView({ isOpen, onOpenChange, product: initialProduct }: QuickViewProps) {
    const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    
    const { addToCart, isAddingToCart, deliveryDate: globalDateString, setDeliveryDate: setGlobalDateString } = useCart();
    
    useEffect(() => {
        const fetchDetailedProduct = async () => {
            if (isOpen && initialProduct) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/products/${initialProduct.slug}`);
                    const data = await handleApiResponse(res);
                    const productData = data.product;
                    setDetailedProduct(productData);
                    
                    if (productData.has_variants && productData.variants?.length > 0) {
                        const sortedVariants = [...productData.variants].sort((a, b) => a.price - b.price);
                        setSelectedVariant(sortedVariants.find(v => v.stock > 0) || null);
                    }
                } catch (error) {
                    toast.error('Error al cargar el producto');
                    onOpenChange(false);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchDetailedProduct();
    }, [isOpen, initialProduct, onOpenChange]);

    const handleDateSave = (selectedDate: Date) => {
        if(setGlobalDateString) {
            setGlobalDateString(format(selectedDate, 'yyyy-MM-dd'));
        }
    };

    const handleShare = async () => {
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/products/${initialProduct.slug}` : '';
        const shareData = {
            title: detailedProduct?.name || initialProduct.name,
            text: `Mira este hermoso arreglo en Florarte: ${detailedProduct?.name || initialProduct.name}`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("¡Enlace copiado!");
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error sharing:", error);
            }
        }
    };

    const handleAddToCart = async () => {
        if (!detailedProduct) return;
        if (!globalDateString || globalDateString.includes('No especificada')) {
            toast.info('Por favor, selecciona una fecha de envío.');
            setIsCalendarModalOpen(true);
            return;
        }
        const productForCart = { ...detailedProduct, variants: selectedVariant ? [selectedVariant] : [] };
        await addToCart({ product: productForCart, quantity: 1, deliveryDate: globalDateString });
        onOpenChange(false);
    };

    const imagesToShow = useMemo(() => {
        if (!detailedProduct) return [];
        if (selectedVariant?.images?.length) return selectedVariant.images;
        if (detailedProduct.images?.length) return detailedProduct.images;
        return [{ id: 0, src: detailedProduct.image, alt: detailedProduct.name, is_primary: true }];
    }, [detailedProduct, selectedVariant]);
    
    const displayPrice = selectedVariant ? selectedVariant.price : detailedProduct?.price;
    const displaySalePrice = selectedVariant ? selectedVariant.sale_price : detailedProduct?.sale_price;
    const priceToShow = displaySalePrice ?? displayPrice;

    const formattedDate = useMemo(() => {
        if (!globalDateString || globalDateString.includes('No especificada')) return 'Selecciona una fecha';
        try {
            const dateString = globalDateString.includes('T') ? globalDateString : `${globalDateString}T12:00:00`;
            const date = new Date(dateString);
            return format(date, 'd \'de\' MMMM \'de\' yyyy', { locale: es });
        } catch (e) {
            return globalDateString;
        }
    }, [globalDateString]);

    const shippingPolicyContent = (
        <div className="space-y-8 py-4">
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">1. Cobertura de Entrega</h4>
                        <p className="text-xs text-muted-foreground mt-1">Servicio en Tequila, Jalisco y municipios de la Región Valles.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">2. Horarios de Entrega</h4>
                        <p className="text-xs text-muted-foreground mt-1">Bloques seleccionables sujetos a tráfico y demanda.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const substitutionPolicyContent = (
        <div className="space-y-8 py-4">
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">1. Valor Equivalente</h4>
                        <p className="text-xs text-muted-foreground mt-1">Sustituiremos flores por otras de igual o mayor valor si es necesario.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">2. Respeto al Diseño</h4>
                        <p className="text-xs text-muted-foreground mt-1">Procuramos conservar siempre el estilo y color original.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-w-6xl w-[95vw] p-0 flex flex-col max-h-[90vh] rounded-[2.5rem] overflow-hidden border-none shadow-2xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                hideCloseButton={true}
            >
                 <DialogHeader className="sr-only">
                    <DialogTitle>{detailedProduct?.name || 'Vista Rápida'}</DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                     {isLoading || !detailedProduct ? (
                        <QuickViewSkeleton />
                     ) : (
                        <div className="animate-fade-in">
                            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 items-start p-6 md:p-10">
                                {/* Columna Izquierda: Imágenes */}
                                <div className="lg:col-span-7">
                                    <ProductImageCarousel images={imagesToShow as any} />
                                </div>

                                {/* Columna Derecha: Info y Acciones */}
                                <div className="lg:col-span-5 flex flex-col space-y-8 mt-8 lg:mt-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <h1 className="text-3xl font-headline font-bold text-slate-900 dark:text-white leading-tight">{detailedProduct.name}</h1>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-widest uppercase">SKU: {selectedVariant?.code || detailedProduct.code}</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 shrink-0 group"
                                                onClick={handleShare}
                                            >
                                                <Share2 className="h-5 w-5 transition-colors group-hover:text-primary"/>
                                            </Button>
                                        </div>
                                        
                                        <h2 className="text-3xl font-bold text-primary">
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(priceToShow || 0)} 
                                        </h2>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        {detailedProduct.has_variants && detailedProduct.variants && (
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block">Opciones</Label>
                                                <div className="flex flex-wrap gap-3">
                                                    {detailedProduct.variants.map((variant) => (
                                                        <button 
                                                            key={variant.id} 
                                                            onClick={() => setSelectedVariant(variant)} 
                                                            className={cn(
                                                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300",
                                                                selectedVariant?.id === variant.id 
                                                                    ? "bg-primary text-white border-primary shadow-md font-bold" 
                                                                    : "border-slate-200 dark:border-white/10 hover:border-primary"
                                                            )}
                                                        >
                                                            {variant.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block">Fecha de Envío</Label>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full h-12 justify-start text-left font-medium rounded-xl bg-slate-50 dark:bg-neutral-900/30 border-slate-200 dark:border-white/5 pl-4 text-sm transition-all hover:bg-white hover:border-primary/50 hover:text-foreground',
                                                    (!globalDateString || globalDateString.includes('No especificada')) && 'text-muted-foreground'
                                                )}
                                                onClick={() => setIsCalendarModalOpen(true)}
                                            >
                                                <CalendarIcon className="mr-3 h-5 w-5 text-slate-400" />
                                                <span className="truncate">{formattedDate}</span>
                                            </Button>
                                        </div>

                                        <Separator />

                                        <div className="pt-2">
                                            <ComplementSlider product={detailedProduct} />
                                        </div>
                                    </div>
                                    
                                    <div className="hidden lg:block pt-8 border-t border-border/50 mt-auto">
                                        <Button 
                                            onClick={handleAddToCart} 
                                            size="lg" 
                                            className="w-full h-14 font-bold text-lg rounded-2xl shadow-xl shadow-primary/25 active:scale-[0.98] bg-primary hover:bg-primary/90 text-white" 
                                            disabled={isAddingToCart}
                                        >
                                            {isAddingToCart ? <Loader2 className="animate-spin h-6 w-6" /> : "Agregar al Carrito"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Pestañas de Detalles Inferiores */}
                            <div className="px-6 md:px-10 pb-24 md:pb-10 w-full mt-8 border-t border-border/50 pt-10">
                                <Tabs defaultValue="details" className="w-full">
                                    <div className="bg-slate-100 dark:bg-neutral-900/50 p-1.5 rounded-2xl flex w-full mb-8">
                                        <TabsList className="bg-transparent h-auto p-0 gap-1.5 w-full grid grid-cols-3">
                                            <TabsTrigger value="details" className="px-6 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white duration-300">Detalles</TabsTrigger>
                                            <TabsTrigger value="shipping" className="px-6 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white duration-300">Envíos</TabsTrigger>
                                            <TabsTrigger value="substitution" className="px-6 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white duration-300">Sustitución</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <TabsContent value="details" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold">Descripción</h3>
                                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                                                {detailedProduct.short_description || detailedProduct.description}
                                            </p>
                                            
                                            {(selectedVariant?.specifications || detailedProduct.specifications) && (
                                                <div className="space-y-3">
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Palette className="w-4 h-4" /> Especificaciones
                                                    </h3>
                                                    <div className="border rounded-xl overflow-hidden bg-background">
                                                        <Table>
                                                            <TableBody>
                                                                {(selectedVariant?.specifications || detailedProduct.specifications || []).slice(0, 4).map((spec, i) => (
                                                                    <TableRow key={i} className="border-b last:border-0 hover:bg-transparent">
                                                                        <TableCell className="font-bold text-[10px] bg-muted/20 w-1/3 py-2 px-3">{spec.key}</TableCell>
                                                                        <TableCell className="text-[10px] py-2 px-3">{spec.value}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="shipping" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-border/50">
                                            <p className="text-xs font-semibold flex items-center gap-3 text-foreground/80">
                                                <Truck className="w-4 h-4 text-primary" /> 
                                                <span>Entregas en Tequila y Región Valles.</span>
                                            </p>
                                            {shippingPolicyContent}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="substitution" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-border/50">
                                            {substitutionPolicyContent}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                     )}
                </div>

                {detailedProduct && !isLoading && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 p-4 px-6 flex items-center justify-between shadow-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                            <span className="text-xl font-bold text-foreground">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(priceToShow || 0)}
                            </span>
                        </div>
                        <Button 
                            onClick={handleAddToCart} 
                            className="h-12 px-10 font-bold rounded-2xl shadow-lg bg-primary hover:bg-primary/90 text-white active:scale-95"
                            disabled={isAddingToCart}
                        >
                            {isAddingToCart ? <Loader2 className="animate-spin h-5 w-5" /> : "Comprar"}
                        </Button>
                    </div>
                )}
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onOpenChange(false)}
                    className="absolute right-6 top-6 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all h-10 w-10 z-50"
                >
                    <X className="h-6 w-6" />
                </Button>
            </DialogContent>

            <DeliveryDateModal 
                isOpen={isCalendarModalOpen}
                onOpenChange={setIsCalendarModalOpen}
                currentDate={globalDateString}
                onSave={handleDateSave}
            />
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--primary) / 0.2);
                    border-radius: 10px;
                }
            `}</style>
        </Dialog>
    );
}
