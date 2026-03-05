
// src/app/admin/products/product-detail-modal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Product, ProductVariant } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductImageCarousel from '@/components/ProductImageCarousel';
import { Button } from '@/components/ui/button';
import { PenSquare } from 'lucide-react';
import { resolveProductGalleryImages } from '@/lib/product-images';


interface ProductDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onEditProduct?: (product: Product) => void;
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
  onEditProduct,
}: ProductDetailModalProps) {

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(() => {
    if (product?.hasVariants && product?.variants && product.variants.length > 0) {
      return String(product.variants[0].id);
    }
    return undefined;
  });
  const isLoading = !product;

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId || !product?.variants) return null;
    return product.variants.find(v => String(v.id) === selectedVariantId) || null;
  }, [selectedVariantId, product?.variants]);

  const imagesToShow = useMemo(() => {
    return resolveProductGalleryImages(product, selectedVariant);
  }, [product, selectedVariant]);

  const showVariantSelect = Boolean(product?.hasVariants && product?.variants && product.variants.length > 0);

  const activePrice = selectedVariant ? selectedVariant.price : product?.price;
  const activeSalePrice = selectedVariant ? selectedVariant.salePrice : product?.salePrice;
  const activeStock = selectedVariant ? selectedVariant.stock : product?.stock;
  const activeSku = selectedVariant ? selectedVariant.code : product?.code;
  const activeVariantProductName = selectedVariant
    ? ((selectedVariant as any).product_name ?? selectedVariant.productName ?? null)
    : null;

  const handleEditClick = () => {
    if (!product || !onEditProduct) return;
    onOpenChange(false);
    onEditProduct(product);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-primary/15" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="px-7 md:px-9 py-6 border-b bg-gradient-to-r from-primary/10 via-background/70 to-background/60">
          <div className="space-y-2 pr-10">
            <div className="flex items-center flex-wrap gap-3">
              <DialogTitle className="font-headline text-2xl md:text-3xl">{product?.name || 'Cargando...'}</DialogTitle>
              {product?.status && (
                <Badge variant={product.status === 'PUBLISHED' ? 'success' : 'secondary'} className="uppercase tracking-wide shadow-sm shadow-primary/25 border border-primary/30">
                  {product.status === 'PUBLISHED' ? 'Publicado' : product.status === 'HIDDEN' ? 'Oculto' : 'Borrador'}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs md:text-sm">
              SKU: <span className="font-mono">{product?.code ?? 'N/A'}</span>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto px-7 md:px-9 py-8 custom-scrollbar">
            {isLoading ? <ProductDetailSkeleton /> : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-9 md:gap-12">
                    {/* Left Column - Image */}
                    <div className="lg:col-span-5 space-y-4">
                        <ProductImageCarousel images={imagesToShow.map(img => ({ id: typeof img.id === 'number' ? img.id : undefined, src: img.src, alt: img.alt }))} />
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-7 space-y-8">
                        {showVariantSelect && (
                            <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Variante</label>
                            <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                              <SelectTrigger className="border-primary/30 focus-visible:ring-primary/35">
                                    <SelectValue placeholder="Selecciona una variante" />
                                </SelectTrigger>
                                <SelectContent className="z-[120]">
                                    {product.variants?.map(v => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </div>
                        )}

                        {product.description && (
                          <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descripción</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                          </div>
                        )}

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5">
                            {showVariantSelect && (
                              <DetailRow label="Nombre Producto (Variante)" value={<span className="font-semibold">{activeVariantProductName ?? 'N/A'}</span>} />
                            )}
                            <DetailRow label="Precio" value={<span className="text-xl font-semibold">{formatCurrency(activePrice)}</span>} />
                            <DetailRow label="Precio Oferta" value={<span className="text-base font-medium text-muted-foreground">{formatCurrency(activeSalePrice)}</span>} />
                            <DetailRow label="Stock" value={<span className="font-semibold">{activeStock ?? 0} unidades</span>} />
                            <DetailRow label="Categoría" value={<span className="font-semibold">{product.category?.name ?? 'N/A'}</span>} />
                            <DetailRow label="SKU" value={<span className="font-mono text-xs">{activeSku ?? 'N/A'}</span>} />
                            <DetailRow
                                label="Permite Foto"
                                value={
                                    <span className="flex items-center gap-2 justify-end sm:justify-start">
                                        <Badge variant={product.allowPhoto ? "success" : "secondary"}>{product.allowPhoto ? 'Sí' : 'No'}</Badge>
                                        {product.allowPhoto && <span className="text-xs text-muted-foreground">{formatCurrency(product.photoPrice)}</span>}
                                    </span>
                                }
                            />
                            <DetailRow
                                label="Etiquetas"
                                value={product.tags && product.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 justify-end sm:justify-start">
                                    {product.tags.map(tag => <Badge key={tag.tagId} variant="secondary">{tag.tag?.name}</Badge>)}
                                  </div>
                                ) : <span className="text-muted-foreground italic">Sin etiquetas</span>}
                            />
                            <DetailRow
                                label="Ocasiones"
                                value={product.occasions && product.occasions.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 justify-end sm:justify-start">
                                    {product.occasions.map(occ => <Badge key={occ.occasionId} variant="outline">{occ.occasion?.name}</Badge>)}
                                  </div>
                                ) : <span className="text-muted-foreground italic">Sin ocasiones</span>}
                            />
                        </dl>
                    </div>
                    </div>
                    {/* Full-width sections */}
                    <div className="space-y-7">
                        {product.shortDescription && (<div><h4 className="font-semibold text-foreground mb-1">Descripción Corta</h4><p className="text-sm text-muted-foreground">{product.shortDescription}</p></div>)}
                        
                        {(product.specifications && product.specifications.length > 0) && (
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Especificaciones</h4>
                                <SpecificationsTable specifications={product.specifications} />
                            </div>
                        )}
                        
                        {product.care && (<div><h4 className="font-semibold text-foreground mb-1">Cuidados</h4><p className="text-sm text-muted-foreground">{product.care}</p></div>)}

                        {product.hasVariants && product.variants && product.variants.length > 0 && selectedVariant && (
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Detalles de la Variante: {selectedVariant.name}</h4>
                                <div className="space-y-2">
                                  {activeVariantProductName && (
                                    <p className="text-sm text-muted-foreground">
                                      <span className="font-medium text-foreground">Producto:</span> {activeVariantProductName}
                                    </p>
                                  )}
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
        <DialogFooter className="px-7 md:px-9 py-5 border-t bg-gradient-to-r from-background to-primary/5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" className="shadow-md shadow-primary/25" onClick={handleEditClick} disabled={!product || !onEditProduct}>
            <PenSquare className="w-4 h-4 mr-2" />
            Editar Producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
