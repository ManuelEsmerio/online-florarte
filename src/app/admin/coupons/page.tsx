'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CouponForm } from './coupon-form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Coupon, CouponStatus } from '@/lib/definitions';
import { allCoupons } from '@/lib/data/coupon-data';
import { allUsers } from '@/lib/data/user-data';
import { allProducts } from '@/lib/data/product-data';
import { allCategories } from '@/lib/data/category-data';
import { CouponCard } from '@/components/admin/coupons/CouponCard';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 6;

export default function CouponsPage() {
  const { toast } = useToast();

  const [allData, setAllData] = useState<Coupon[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [activeFilter, setActiveFilter] = useState<CouponStatus | 'todos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setAllData(allCoupons);
  }, []);

  const filteredCoupons = useMemo(() => {
    if (activeFilter === 'todos') return allData;
    return allData.filter(coupon => coupon.status === activeFilter);
  }, [allData, activeFilter]);

  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCoupons.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCoupons, currentPage]);

  const totalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE);

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setIsFormOpen(true);
  };

  const handleEditCoupon = useCallback((coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsFormOpen(true);
  }, []);

  const handleDeleteRequest = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAllData(prev => prev.filter(c => c.id !== deleteId));
    toast({ title: '¡Cupón Eliminado!', description: 'El cupón ha sido eliminado correctamente.', variant: 'success' });
    setDeleteId(null);
    setIsDeleting(false);
  };

  const handleSaveCoupon = async (couponData: Omit<Coupon, 'id'>, id?: number) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (id) {
      setAllData(prev => prev.map(c => c.id === id ? { ...c, ...couponData, id } : c));
      toast({ title: '¡Cupón Actualizado!', variant: 'success' });
    } else {
      const newId = Math.max(...allData.map(c => c.id), 0) + 1;
      const newCoupon: Coupon = { ...couponData, id: newId, uses_count: 0, status: 'programado' };
      setAllData(prev => [newCoupon, ...prev]);
      toast({ title: '¡Cupón Creado!', variant: 'success' });
    }
    setIsFormOpen(false);
    setSelectedCoupon(null);
    setIsSaving(false);
  };
  
  const filterOptions: { label: string; value: CouponStatus | 'todos' }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Vigente', value: 'vigente' },
    { label: 'Vencido', value: 'vencido' },
    { label: 'Utilizado', value: 'utilizado' },
    { label: 'Programado', value: 'programado' },
  ];

  const stats = useMemo(() => {
    const activeCoupons = allData.filter(c => c.status === 'vigente').length;
    const totalUsage = allData.reduce((acc, c) => acc + (c.uses_count || 0), 0);
    const totalLimit = allData.reduce((acc, c) => acc + (c.max_uses || 0), 0);
    const averageUsage = totalLimit > 0 ? Math.round((totalUsage / totalLimit) * 100) : 0;
    const totalValue = allData.reduce((acc, c) => {
        if (c.discount_type === 'fixed') return acc + c.value * (c.uses_count || 0)
        return acc + (c.value * 10) * (c.uses_count || 0);
    }, 0);

    return {
        activeCoupons,
        averageUsage,
        savedAmount: totalValue / 1000
    }
  }, [allData]);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Gestión de Cupones</h1>
          <p className="text-muted-foreground max-w-md">Panel administrativo para la gestión de beneficios y descuentos.</p>
        </div>
        <Button onClick={handleAddCoupon} size="lg" className="rounded-full font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20">
          <PlusCircle className="h-5 w-5" />
          Nuevo Cupón
        </Button>
      </div>

      <div className="flex items-center gap-2 md:gap-4 mb-8 border-b pb-1 overflow-x-auto">
        {filterOptions.map(opt => (
            <Button 
                key={opt.value} 
                variant="ghost"
                onClick={() => { setActiveFilter(opt.value); setCurrentPage(1); }}
                className={cn(
                    "px-4 py-3 text-sm font-medium rounded-none transition-colors hover:bg-primary/10 hover:text-primary",
                    activeFilter === opt.value 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-muted-foreground hover:text-primary'
                )}
            >
                {opt.label}
            </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[30rem]">
        {paginatedCoupons.map(coupon => (
          <CouponCard key={coupon.id} coupon={coupon} onEdit={handleEditCoupon} onDelete={handleDeleteRequest} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-2">
            <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="ghost" className="flex items-center gap-1 group">
                <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Anterior
            </Button>
            <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                    <Button 
                        key={i} 
                        onClick={() => setCurrentPage(i + 1)} 
                        size="icon" 
                        className="w-10 h-10 rounded-full"
                        variant={currentPage === i + 1 ? 'default' : 'ghost'}
                    >
                        {i + 1}
                    </Button>
                ))}
            </div>
            <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="ghost" className="flex items-center gap-1 group">
                Siguiente
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      )}

        <div className="mt-12 p-6 glass-card rounded-2xl flex flex-wrap items-center justify-between gap-8">
            <div className="flex gap-6 md:gap-12">
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Total Activos</span>
                    <span className="text-2xl font-black text-foreground">{stats.activeCoupons}</span>
                </div>
                <div className="flex flex-col border-l border-primary/10 pl-6 md:pl-12">
                    <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Uso Promedio</span>
                    <span className="text-2xl font-black text-foreground">{stats.averageUsage}%</span>
                </div>
                <div className="flex flex-col border-l border-primary/10 pl-6 md:pl-12">
                    <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Ahorro Generado</span>
                    <span className="text-2xl font-black text-primary">${stats.savedAmount.toFixed(1)}k</span>
                </div>
            </div>
            <Button variant="outline" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded-full text-sm font-bold">
                Descargar Reporte
            </Button>
        </div>

      <CouponForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveCoupon}
        coupon={selectedCoupon}
        isSaving={isSaving}
        customers={allUsers}
        products={allProducts}
        categories={allCategories}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="font-headline text-2xl">¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed">
                    Esta acción eliminará el cupón de forma permanente. No podrás deshacer esta acción.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
                <AlertDialogCancel asChild>
                  <Button variant="ghost" className="rounded-2xl h-12 font-bold" onClick={() => setDeleteId(null)}>Cancelar</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button 
                    variant="destructive"
                    className="rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                    </Button>
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
