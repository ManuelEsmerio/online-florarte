
'use client';

import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Copy, Check, SlidersHorizontal, Search, Ticket as TicketIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Coupon, CouponStatus } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ITEMS_PER_PAGE = 4;

const CouponSkeleton = () => (
  <div className="bg-white dark:bg-zinc-800 border-2 border-slate-100 dark:border-zinc-700 rounded-[1.5rem] p-6 space-y-4">
    <div className="flex justify-between">
      <div className="space-y-2 w-full">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    <div className="border-b border-dashed border-slate-200 dark:border-slate-700" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  </div>
);

export default function CouponsPage() {
  const { user, getCoupons, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CouponStatus | 'todos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const getEffectiveStatus = (coupon: Coupon): CouponStatus => {
    const isUsed = coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usesCount >= coupon.maxUses;
    if (isUsed) return 'USED';

    const isExpired = coupon.validUntil ? new Date() > new Date(coupon.validUntil) : false;
    if (isExpired) return 'EXPIRED';

    return coupon.status;
  };

  // user?.id en lugar del objeto completo: fetchCouponsData solo se re-dispara
  // al cambiar la identidad del usuario (login/logout), no al actualizar perfil.
  const userId = user?.id;
  useEffect(() => {
    if (!authLoading && !userId) {
      router.push('/login?redirect=/coupons');
      return;
    }

    const fetchCouponsData = async () => {
      if (!getCoupons || !userId) return;
      setIsLoading(true);
      try {
        const data = await getCoupons();
        setCoupons(data);
      } catch (error) {
        console.error("Error fetching coupons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) fetchCouponsData();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, getCoupons, router, authLoading]);

  const filteredCoupons = useMemo(() => {
    return coupons
      .filter(coupon => {
        const searchTermMatch = 
          coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
          coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = selectedStatus === 'todos' || getEffectiveStatus(coupon) === selectedStatus;
        return searchTermMatch && statusMatch;
      })
      .sort((a, b) => {
          const aStatus = getEffectiveStatus(a);
          const bStatus = getEffectiveStatus(b);
          if (aStatus === 'ACTIVE' && bStatus !== 'ACTIVE') return -1;
          if (aStatus !== 'ACTIVE' && bStatus === 'ACTIVE') return 1;
          return new Date(a.validUntil || '').getTime() - new Date(b.validUntil || '').getTime();
      });
  }, [coupons, searchTerm, selectedStatus]);

  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCoupons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCoupons, currentPage]);

  const totalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);
  
  const handleCopyCoupon = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: '¡Copiado!',
      description: `Código ${code} copiado.`,
      variant: 'success'
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const statusOptions: (CouponStatus | 'todos')[] = ['todos', 'ACTIVE', 'EXPIRED', 'USED', 'PAUSED'];
  const statusTranslations: { [key in CouponStatus | 'todos']: string } = {
    'todos': 'Todos',
    'ACTIVE': 'Vigente',
    'EXPIRED': 'Vencido',
    'USED': 'Utilizado',
    'PAUSED': 'Pausado',
  }

  if (authLoading || (!user && !authLoading)) {
      return (
          <div className="flex h-screen items-center justify-center bg-background">
              <Skeleton className="h-12 w-12 rounded-full" />
          </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary/30 py-8 md:py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-slate-900 dark:text-white mb-2">Mis Recompensas</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Gestiona tus beneficios y cupones exclusivos</p>
          </div>

          <Card className="rounded-[2rem] border-none shadow-sm bg-background p-6 md:p-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-2">Cupones y Recompensas</h2>
              <p className="text-xs text-muted-foreground mb-8">Aquí puedes ver todos tus cupones de descuento y recompensas de lealtad. ¡Aprovéchalos antes de que venzan!</p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-grow group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Buscar por código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 rounded-2xl pl-11 pr-4 bg-muted/30 border-none focus-visible:ring-primary/20 transition-all text-sm font-medium"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-12 px-6 rounded-2xl bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center justify-center gap-2 font-bold whitespace-nowrap">
                      <SlidersHorizontal className="h-4 w-4" />
                      Estado: {statusTranslations[selectedStatus]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl min-w-[180px]">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Filtrar</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-muted/50" />
                    {statusOptions.map(status => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={selectedStatus === status}
                        onCheckedChange={() => setSelectedStatus(status)}
                        className="rounded-xl my-1 py-2 font-medium"
                      >
                        {statusTranslations[status]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => <CouponSkeleton key={i} />)}
                </div>
              ) : paginatedCoupons.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedCoupons.map((coupon, index) => {
                      const effectiveStatus = getEffectiveStatus(coupon);
                      const isCopied = copiedCode === coupon.code;
                      const isActive = effectiveStatus === 'ACTIVE';
                      const isExpired = effectiveStatus === 'EXPIRED';
                      const isUsed = effectiveStatus === 'USED';

                      return (
                          <div 
                              key={coupon.id} 
                              className={cn(
                                  "relative group transition-all duration-300 animate-fade-in-up",
                                  !isActive && "opacity-60 grayscale"
                              )}
                              style={{ animationDelay: `${index * 100}ms` }}
                          >
                              <div className={cn(
                                  "bg-background dark:bg-zinc-900 border-2 rounded-[1.5rem] p-6 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all",
                                  isActive ? "border-primary/20" : "border-slate-200 dark:border-slate-800"
                              )}>
                                  <div className="flex justify-between items-start mb-5">
                                      <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                              <span className={cn(
                                                  "font-bold text-xl tracking-wider",
                                                  isActive ? "text-primary" : "text-slate-400 line-through"
                                              )}>
                                                  {coupon.code}
                                              </span>
                                              {isActive && (
                                                  <button 
                                                      onClick={(e) => handleCopyCoupon(e, coupon.code)}
                                                      className="p-1 text-slate-400 hover:text-primary transition-colors active:scale-90"
                                                      title="Copiar código"
                                                  >
                                                      {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                  </button>
                                              )}
                                          </div>
                                          <p className={cn(
                                              "text-sm font-bold",
                                              isActive ? "text-slate-700 dark:text-slate-200" : "text-slate-400"
                                          )}>
                                              {coupon.discountType === 'PERCENTAGE'
                                                ? `${coupon.discountValue}% de descuento`
                                                : `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(coupon.discountValue)} de descuento`
                                              }
                                          </p>
                                      </div>
                                      <div className={cn(
                                          "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
                                          isActive ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                      )}>
                                          <TicketIcon className="h-5 w-5" />
                                      </div>
                                  </div>

                                  {/* Divisor punteado estilo cupón */}
                                  <div className="border-b border-dashed border-slate-200 dark:border-slate-700 mb-5" />

                                  <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                                      <span className="text-muted-foreground/70">
                                          {isExpired ? 'Venció: ' : isUsed ? 'Usado: ' : 'Vence: '}
                                        {coupon.validUntil ? format(new Date(coupon.validUntil), "d 'de' MMM, yyyy", { locale: es }) : 'Nunca'}
                                      </span>
                                      <Badge 
                                          variant="outline" 
                                          className={cn(
                                              "h-6 px-3 rounded-full text-[9px] border-none",
                                              isActive && "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400",
                                              isExpired && "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
                                              isUsed && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                          )}
                                      >
                                              {statusTranslations[effectiveStatus]}
                                      </Badge>
                                  </div>
                              </div>
                          </div>
                      )
                    })}
                  </div>

                  {/* Paginación Mobile-First */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-between gap-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                        disabled={currentPage === 1}
                        className="rounded-2xl h-12 px-6 bg-muted/30 border-none shadow-sm text-slate-500 font-bold text-xs gap-2 active:scale-95 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        PÁG {currentPage} DE {totalPages}
                      </span>

                      <Button 
                        variant="ghost" 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                        disabled={currentPage === totalPages}
                        className="rounded-2xl h-12 px-6 bg-muted/30 border-none shadow-sm text-slate-500 font-bold text-xs gap-2 active:scale-95 transition-all"
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 animate-fade-in">
                  <div className="inline-flex p-6 bg-secondary/50 rounded-full mb-6">
                    <TicketIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-2xl font-bold font-headline mb-3">No hay beneficios</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-10">
                    No tienes cupones que coincidan con tu búsqueda. ¡Mantente atento a nuestras promociones!
                  </p>
                   <Button asChild size="lg" className="h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20">
                    <Link href="/products/all">Explorar Tienda</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
