
// src/app/admin/products/product-detail-modal.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Product, ProductVariant } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductImageCarousel from '@/components/ProductImageCarousel';


interface ProductDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
}

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (!value && typeof value !== 'number') return null;
    return (
        <div className="flex justify-between items-start text-sm">
            <dt className="text-muted-foreground font-medium">{label}</dt>
            <dd className="text-foreground text-right">{value}</dd>
        </div>
    )
};

const ProductDetailSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-lg" />
            <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4">
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-5 w-1/2" /></div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-5 w-1/2" /></div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-5 w-1/2" /></div>
        </div>
    </div>
);

const SpecificationsTable = ({ specifications, className }: { specifications?: { key: string, value: string }[] | null, className?: string }) => {
    const groupedSpecs = useMemo(() => {
        if (!specifications || specifications.length === 0) return new Map<string, string[]>();
        
        return specifications.reduce((acc, spec) => {
            const values = acc.get(spec.key) || [];
            values.push(spec.value);
            acc.set(spec.key, values);
            return acc;
        }, new Map<string, string[]>());
    }, [specifications]);

    if (groupedSpecs.size === 0) return null;
    
    return (
        <Table className={className}>
            <TableBody>
                {Array.from(groupedSpecs.entries()).map(([key, values]) => (
                    <TableRow key={key}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell>
                            {values.length > 1 ? (
                                <ul className="list-disc pl-5">
                                    {values.map((val, index) => <li key={index}>{val}</li>)}
                                </ul>
                            ) : (
                                values[0]
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


export function ProductDetailModal({
  isOpen,
  onOpenChange,
  product,
}: ProductDetailModalProps) {

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const isLoading = !product;

  useEffect(() => {
    if (product?.has_variants && product.variants && product.variants.length > 0) {
      setSelectedVariantId(String(product.variants[0].id));
    } else {
      setSelectedVariantId(undefined);
    }
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId || !product?.variants) return null;
    return product.variants.find(v => String(v.id) === selectedVariantId) || null;
  }, [selectedVariantId, product?.variants]);

  const imagesToShow = useMemo(() => {
    if (!product) return [];

    // Si hay una variante seleccionada y tiene imágenes, úsalas.
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    
    // Si no, usa las imágenes principales del producto.
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    
    // Fallback: si no hay imágenes principales pero hay variantes, usa las de la primera variante.
    const firstVariantWithImages = product.variants?.find(v => v.images && v.images.length > 0);
    if (firstVariantWithImages) {
      return firstVariantWithImages.images!;
    }
    
    // Último recurso: placeholder
    return [{ id: 0, src: product.image, alt: product.name, is_primary: true }];
  }, [product, selectedVariant]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{product?.name || 'Cargando...'}</DialogTitle>
          <DialogDescription>
            Detalles completos del producto <span className="font-mono">{product?.code}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            {isLoading ? <ProductDetailSkeleton /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - Image */}
                    <div className="space-y-4">
                        <ProductImageCarousel images={imagesToShow} />
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6">
                         {product.has_variants && product.variants && (
                          <div className="space-y-2">
                            <label className="font-semibold text-foreground">Variante</label>
                            <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una variante" />
                                </SelectTrigger>
                                <SelectContent>
                                    {product.variants.map(v => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </div>
                        )}
                        <dl className="space-y-3">
                            <DetailRow label="Precio" value={formatCurrency(selectedVariant ? selectedVariant.price : product.price)} />
                            <DetailRow label="Precio de Oferta" value={formatCurrency(selectedVariant ? selectedVariant.sale_price : product.sale_price)} />
                            <DetailRow label="Stock" value={selectedVariant ? selectedVariant.stock : product.stock} />
                            <DetailRow label="SKU" value={<span className="font-mono text-xs">{selectedVariant ? selectedVariant.code : product.code}</span>} />
                            <DetailRow label="Estado" value={<Badge className="capitalize">{product.status}</Badge>} />
                            <DetailRow label="Categoría" value={product.category?.name} />
                            <DetailRow label="Slug" value={<span className="font-mono text-xs">{product.slug}</span>} />
                            <DetailRow 
                                label="Permite Foto" 
                                value={
                                    <span className="flex items-center gap-2 justify-end">
                                        <Badge variant={product.allow_photo ? "success" : "secondary"}>{product.allow_photo ? 'Sí' : 'No'}</Badge>
                                        {product.allow_photo && `(${formatCurrency(product.photo_price)})`}
                                    </span>
                                } 
                            />
                        </dl>
                        <Separator />
                        <div className="space-y-3">
                            <DetailRow label="Etiquetas" value={product.tags && product.tags.length > 0 ? (<div className="flex flex-wrap gap-1 justify-end">{product.tags.map(tag => <Badge key={tag.id} variant="secondary">{tag.name}</Badge>)}</div>) : 'N/A'} />
                            <DetailRow label="Ocasiones" value={product.occasions && product.occasions.length > 0 ? (<div className="flex flex-wrap gap-1 justify-end">{product.occasions.map(occ => <Badge key={occ.id} variant="outline">{occ.name}</Badge>)}</div>) : 'N/A'} />
                        </div>
                    </div>
                    {/* Full-width sections */}
                    <div className="md:col-span-2 space-y-6">
                        {product.short_description && (<div><h4 className="font-semibold text-foreground mb-1">Descripción Corta</h4><p className="text-sm text-muted-foreground">{product.short_description}</p></div>)}
                        {product.description && (<div><h4 className="font-semibold text-foreground mb-1">Descripción Completa</h4><p className="text-sm text-muted-foreground">{product.description}</p></div>)}
                        
                        {(product.specifications && product.specifications.length > 0) && (
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Especificaciones</h4>
                                <SpecificationsTable specifications={product.specifications} />
                            </div>
                        )}
                        
                        {product.care && (<div><h4 className="font-semibold text-foreground mb-1">Cuidados</h4><p className="text-sm text-muted-foreground">{product.care}</p></div>)}

                        {product.has_variants && product.variants && product.variants.length > 0 && selectedVariant && (
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Detalles de la Variante: {selectedVariant.name}</h4>
                                <div className="space-y-2">
                                  {selectedVariant.description && <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-md">{selectedVariant.description}</p>}
                                  {(selectedVariant.specifications && selectedVariant.specifications.length > 0) && (
                                    <SpecificationsTable specifications={selectedVariant.specifications} />
                                  )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
