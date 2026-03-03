
'use client';

import { useState, useMemo, useEffect } from "react";
import type { Product, ProductVariant } from "@/lib/definitions";
import { Flower2, CalendarIcon, Gift, Loader2, Heart, ShieldCheck, Truck, Clock, FileText, Share2, Star, CheckCircle, RefreshCw, Palette, Info, ChevronRight, MapPin, Zap, Phone, Mail, AlertTriangle } from 'lucide-react';
import ProductImageCarousel from "@/components/ProductImageCarousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from "./ui/label";
import { DeliveryDateModal } from "./DeliveryDateModal";
import { ComplementSlider } from "./ComplementSlider";
import { Separator } from "./ui/separator";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface ProductDetailProps {
    product: Product;
    complementProducts: Product[];
}

export function ProductDetail({ product }: ProductDetailProps) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    
    const { addToCart, isAddingToCart, deliveryDate: globalDateString, setDeliveryDate: setGlobalDateString } = useCart();

    useEffect(() => {
        const defaultVariant = (product.hasVariants && product.variants?.length) 
            ? [...product.variants].sort((a,b) => a.price - b.price).find(v => v.stock > 0) || null 
            : null;
        setSelectedVariant(defaultVariant);
    }, [product]);

    const handleDateSave = (selectedDate: Date) => {
        if(setGlobalDateString) {
            setGlobalDateString(format(selectedDate, 'yyyy-MM-dd'));
        }
    };

    const handleShare = async () => {
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/products/${product.slug}` : '';
        const shareData = {
            title: product.name,
            text: `Mira este hermoso arreglo en Florarte: ${product.name}`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                throw new Error('Share not supported');
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("¡Enlace copiado!", {
                        description: "Se ha copiado el enlace al portapapeles."
                    });
                } catch (clipError) {
                    console.error("Error copying to clipboard:", clipError);
                }
            }
        }
    };

    const handleAddToCart = async () => {
        if (!globalDateString || globalDateString.includes('No especificada')) {
            toast.info('¡Un momento!', {
                description: 'Por favor, selecciona una fecha de envío.'
            });
            setIsCalendarModalOpen(true);
            return;
        }
        if (product.hasVariants && !selectedVariant) {
            toast.info('¡Selecciona una opción!', {
                description: 'Por favor, elige una de las variantes del producto.'
            });
            return;
        }
        await addToCart({ 
            product: { ...product, variants: selectedVariant ? [selectedVariant] : [] }, 
            quantity: 1, 
            deliveryDate: globalDateString 
        });
    };

    const imagesToShow = useMemo(() => {
        if (selectedVariant?.images?.length) return selectedVariant.images;
        return product.images || (product.mainImage ? [{ src: product.mainImage, alt: product.name, isPrimary: true }] : []);
    }, [product, selectedVariant]);
    
    const displayPrice = selectedVariant ? selectedVariant.price : product.price;
    const displaySalePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
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

    const ShippingPolicyContent = () => (
        <div className="space-y-8 py-4">
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">1. Cobertura de Entrega</h4>
                        <p className="text-xs text-muted-foreground mt-1">Servicio en Tequila, Jalisco y municipios de la Región Valles. Para envíos externos, consultar disponibilidad y costos adicionales.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">2. Horarios de Entrega</h4>
                        <p className="text-xs text-muted-foreground mt-1">Realizados en bloques seleccionables. Sujetos a tráfico y demanda. Se consideran estimados, no garantizados.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">3. Entregas el Mismo Día</h4>
                        <p className="text-xs text-muted-foreground mt-1">Pedidos antes de las 2:30 PM (L-S) califican para entrega el mismo día.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">4. Proceso de Entrega</h4>
                        <p className="text-xs text-muted-foreground mt-1">En ausencia del destinatario, se intentará contactar o el pedido retornará para reprogramación con costo extra.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">5. Soporte y Seguimiento</h4>
                        <p className="text-xs text-muted-foreground mt-1">Contacto directo: soporte@floreriaflorarte.com para cualquier duda sobre tu ruta.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const SubstitutionPolicyContent = () => (
        <div className="space-y-8 py-4">
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">1. Naturaleza del Producto</h4>
                        <p className="text-xs text-muted-foreground mt-1">Debido a la estacionalidad, la disponibilidad de flores específicas puede variar sin previo aviso.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">2. Valor Equivalente</h4>
                        <p className="text-xs text-muted-foreground mt-1">Sustituiremos flores por otras de igual o mayor valor, manteniendo siempre la integridad del arreglo.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">3. Respeto al Diseño</h4>
                        <p className="text-xs text-muted-foreground mt-1">Procuramos siempre conservar el estilo, color y forma original del diseño seleccionado.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Flower2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">4. Flores Principales</h4>
                        <p className="text-xs text-muted-foreground mt-1">Las flores protagonistas (ej. Orquídeas) no serán sustituidas por especies distintas sin tu autorización.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">5. Temporadas Altas</h4>
                        <p className="text-xs text-muted-foreground mt-1">En fechas como San Valentín, la necesidad de sustituciones puede ser mayor debido a la alta demanda.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const FullDetailsSidebar = () => (
        <Sheet>
            <SheetTrigger asChild>
                <button className="text-primary font-bold hover:underline text-sm mt-2 focus:outline-none">
                    Ver detalles
                </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="pb-6">
                    <SheetTitle className="font-headline text-2xl">Detalles del Producto</SheetTitle>
                </SheetHeader>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Info className="w-4 h-4" /> Descripción
                        </h4>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {product.description}
                        </p>
                    </div>

                    {(selectedVariant?.specifications || product.specifications) && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Palette className="w-4 h-4" /> Especificaciones
                            </h4>
                            <div className="border rounded-2xl overflow-hidden">
                                <Table>
                                    <TableBody>
                                        {(selectedVariant?.specifications || product.specifications)?.map((spec, i) => (
                                            <TableRow key={i} className="border-b last:border-0">
                                                <TableCell className="font-bold text-xs bg-muted/30 w-1/3">{spec.key}</TableCell>
                                                <TableCell className="text-xs">{spec.value}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Heart className="w-4 h-4" /> Cuidados
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 p-4 rounded-2xl border border-primary/10 italic">
                            {product.care || 'Mantener en lugar fresco y añadir agua limpia cada dos días.'}
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );

    const TabsSection = () => (
        <div className="w-full">
            <Tabs defaultValue="details" className="w-full">
                <div className="bg-slate-100 dark:bg-neutral-900/50 p-1.5 rounded-2xl flex w-full mb-12">
                    <TabsList className="bg-transparent h-auto p-0 gap-1.5 w-full grid grid-cols-3">
                        <TabsTrigger value="details" className="px-8 py-3 rounded-xl text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">Detalles</TabsTrigger>
                        <TabsTrigger value="shipping" className="px-8 py-3 rounded-xl text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">Envíos</TabsTrigger>
                        <TabsTrigger value="substitution" className="px-8 py-3 rounded-xl text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">Sustitución</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="details" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold">Descripción</h3>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                {product.shortDescription || product.description?.substring(0, 150) + "..."}
                            </p>
                            <FullDetailsSidebar />
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" /> Especificaciones
                            </h3>
                            <div className="border rounded-2xl overflow-hidden bg-background">
                                <Table>
                                    <TableBody>
                                        {(selectedVariant?.specifications || product.specifications || []).map((spec, i) => (
                                            <TableRow key={i} className="border-b last:border-0 hover:bg-transparent">
                                                <TableCell className="font-bold text-xs bg-muted/20 w-1/3 py-3">{spec.key}</TableCell>
                                                <TableCell className="text-xs py-3">{spec.value}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="shipping" className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-muted/30 p-8 rounded-3xl space-y-6 border border-border/50">
                        <div className="flex items-center gap-4 text-base font-semibold text-foreground/80">
                            <Truck className="w-6 h-6 text-primary" />
                            <span>Entregas en Tequila y Región Valles.</span>
                        </div>
                        <div className="flex items-center gap-4 text-base font-semibold text-foreground/80">
                            <Clock className="w-6 h-6 text-primary" />
                            <span>Horarios estimados según disponibilidad y temporada.</span>
                        </div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="flex items-center gap-4 text-base font-semibold text-foreground/80 group hover:text-primary transition-colors text-left">
                                    <FileText className="w-6 h-6 text-primary" />
                                    <span className="underline decoration-primary/30">Consulta nuestras Políticas de Envío.</span>
                                </button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                <SheetHeader className="pb-6">
                                    <SheetTitle className="font-headline text-2xl">Políticas de Envío</SheetTitle>
                                </SheetHeader>
                                <ShippingPolicyContent />
                            </SheetContent>
                        </Sheet>
                    </div>
                </TabsContent>
                <TabsContent value="substitution" className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-muted/30 p-8 rounded-3xl space-y-6 border border-border/50">
                        <div className="flex items-center gap-4 text-base font-semibold text-foreground/80">
                            <RefreshCw className="w-6 h-6 text-primary" />
                            <span>Sustituimos por flores de igual o mayor valor cuando es necesario.</span>
                        </div>
                        <div className="flex items-center gap-4 text-base font-semibold text-foreground/80">
                            <Palette className="w-6 h-6 text-primary" />
                            <span>Respetamos siempre el estilo y diseño original.</span>
                        </div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="flex items-center gap-4 text-base font-semibold text-foreground/80 group hover:text-primary transition-colors text-left">
                                    <FileText className="w-6 h-6 text-primary" />
                                    <span className="underline decoration-primary/30">Consulta nuestra Política de Sustitución.</span>
                                </button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                <SheetHeader className="pb-6">
                                    <SheetTitle className="font-headline text-2xl">Política de Sustitución</SheetTitle>
                                </SheetHeader>
                                <SubstitutionPolicyContent />
                            </SheetContent>
                        </Sheet>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32 md:pb-24 animate-fade-in">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-16 items-start">
                
                {/* Image Section (Col 7) */}
                <div className="lg:col-span-7">
                    <ProductImageCarousel images={imagesToShow as any} />
                </div>

                {/* Info Section (Col 5) */}
                <div className="lg:col-span-5 mt-10 lg:mt-0 space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-headline font-bold text-slate-900 dark:text-white leading-tight">{product.name}</h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-widest uppercase">SKU: {selectedVariant?.code || product.code}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 shrink-0 active:scale-95 group"
                            onClick={handleShare}
                        >
                            <Share2 className="h-5 w-5 transition-colors group-hover:text-primary"/>
                        </Button>
                    </div>
                    
                    <div>
                        <h2 className="text-3xl font-bold text-primary">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(priceToShow || 0)} 
                        </h2>
                        {displaySalePrice && (
                            <span className="text-sm text-muted-foreground line-through opacity-60 ml-2">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(displayPrice || 0)}
                            </span>
                        )}
                    </div>

                    <div className="space-y-8">
                        {product.hasVariants && product.variants && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 block">Opciones</Label>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((variant) => (
                                        <button 
                                            key={variant.id} 
                                            onClick={() => setSelectedVariant(variant)} 
                                            disabled={variant.stock <= 0}
                                            className={cn(
                                                "px-5 py-2.5 rounded-lg border text-sm font-medium transition-all duration-300",
                                                selectedVariant?.id === variant.id 
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 font-bold" 
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
                            <Label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 block">Fecha de Envío</Label>
                            <div className="relative max-w-sm group">
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        'w-full h-12 justify-start text-left font-medium rounded-xl bg-slate-50 dark:bg-neutral-900/30 border-slate-200 dark:border-white/5 pl-12 pr-4 text-sm transition-all hover:bg-white hover:border-primary/50 hover:shadow-md hover:ring-4 hover:ring-primary/5 hover:text-foreground',
                                        (!globalDateString || globalDateString.includes('No especificada')) && 'text-muted-foreground'
                                    )}
                                    onClick={() => setIsCalendarModalOpen(true)}
                                >
                                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-hover:text-primary transition-colors">
                                        <CalendarIcon className="w-5 h-5" />
                                    </span>
                                    <span className="truncate">{formattedDate}</span>
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="pt-2">
                            <ComplementSlider product={product} />
                        </div>
                        
                        <div className="hidden lg:block pt-4">
                            <Button 
                                onClick={handleAddToCart} 
                                size="lg" 
                                className="w-full h-14 font-bold text-lg rounded-2xl shadow-xl shadow-primary/25 transition-all active:scale-[0.98] btn-hover-glow" 
                                disabled={isAddingToCart}
                            >
                                {isAddingToCart ? <Loader2 className="animate-spin h-6 w-6" /> : "Agregar al Carrito"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section - Full Width */}
            <div className="mt-24 w-full">
                <TabsSection />
            </div>

            {/* Sticky Mobile Footer */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 p-4 px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                    <span className="text-xl font-bold text-foreground">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(priceToShow || 0)}
                    </span>
                </div>
                <Button 
                    onClick={handleAddToCart} 
                    className="h-12 px-10 font-bold rounded-2xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all active:scale-95 btn-hover-glow"
                    disabled={isAddingToCart}
                >
                    {isAddingToCart ? <Loader2 className="animate-spin h-5 w-5" /> : "Comprar ahora"}
                </Button>
            </div>

            <DeliveryDateModal 
                isOpen={isCalendarModalOpen}
                onOpenChange={setIsCalendarModalOpen}
                currentDate={globalDateString}
                onSave={handleDateSave}
            />
        </div>
    );
}
