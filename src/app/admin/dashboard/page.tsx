
// src/app/admin/dashboard/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, ShoppingCart, ArrowRight, Package, TrendingUp, TrendingDown, Minus, UserPlus, PackageSearch, Ticket, Sparkles, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/definitions';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Activity, DashboardStats } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, AreaChart, BarChart, XAxis, YAxis, CartesianGrid, Area, Tooltip, Bar, Legend } from 'recharts';
import { handleApiResponse } from '@/utils/handleApiResponse';

const statusStyles: { [key in OrderStatus]: string } = {
  pendiente: 'bg-slate-100 text-slate-600 border-slate-200',
  completado: 'bg-green-50 text-green-600 border-green-100',
  en_reparto: 'bg-blue-50 text-blue-600 border-blue-100',
  procesando: 'bg-amber-50 text-amber-600 border-amber-100',
  cancelado: 'bg-red-50 text-red-600 border-red-100',
};

const statusTranslations: { [key in OrderStatus]: string } = {
  pendiente: 'Pendiente',
  procesando: 'En Proceso',
  en_reparto: 'En Camino',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const activityIcons: Record<Activity['type'], React.ReactNode> = {
    'new_order': <ShoppingCart className="h-4 w-4 text-blue-500" />,
    'new_user': <UserPlus className="h-4 w-4 text-green-500" />,
    'low_stock': <PackageSearch className="h-4 w-4 text-orange-500" />
};

const activityText = (activity: Activity): React.ReactNode => {
    switch (activity.type) {
        case 'new_order':
            return (
                <p className="font-medium text-slate-700 dark:text-slate-300">Nuevo pedido <Link href={`/admin/orders`} className="font-bold text-primary hover:underline">ORD{String(activity.entity_id).padStart(4, '0')}</Link> de {activity.details.customer_name}.</p>
            );
        case 'new_user':
             return (
                 <p className="font-medium text-slate-700 dark:text-slate-300">Nuevo usuario: <Link href={`/admin/customers`} className="font-bold text-primary hover:underline">{activity.details.user_name}</Link>.</p>
            );
        case 'low_stock':
             return (
                 <p className="font-medium text-slate-700 dark:text-slate-300">Stock bajo: <Link href={`/admin/products`} className="font-bold text-primary hover:underline">{activity.details.product_name}</Link>.</p>
            );
        default:
            return <p>Actividad desconocida.</p>;
    }
}

const StatCardSkeleton = () => (
    <Card className="rounded-[2rem] border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
        </CardContent>
    </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryChartFilter, setCategoryChartFilter] = useState<'main' | 'sub'>('main');
  const { apiFetch } = useAuth();

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await apiFetch('/api/admin/dashboard');
        const data = await handleApiResponse(response);
        setStats(data);
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
    } finally {
        setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border-none bg-background p-4 shadow-2xl ring-1 ring-black/5">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(payload[0].value)}</p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value);
  }
  
  const formatPercentage = (change: number | null | undefined) => {
    if (change === null || change === undefined) return "N/A";
    if (change === Infinity) return "+100%";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  }
  
  const getChangeIcon = (change: number) => {
    if (change === Infinity || change > 0) return <TrendingUp className="h-3.5 w-3.5" />;
    if (change < 0) return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  }
  
  const getChangeColor = (change: number) => {
    if (change === Infinity || change > 0) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10";
    if (change < 0) return "text-red-600 bg-red-50 dark:bg-red-500/10";
    return "text-slate-500 bg-slate-50";
  }
  
  const filteredCategoryData = useMemo(() => {
    if (!stats?.categoryProductCounts) return [];
    return stats.categoryProductCounts.filter(cat => {
        return categoryChartFilter === 'main' ? !cat.isSubcategory : cat.isSubcategory;
    });
  }, [stats?.categoryProductCounts, categoryChartFilter]);

  const statCards = [
      { 
        title: "Ventas Mensuales", 
        value: stats ? formatCurrency(stats.totalSales.current) : '',
        change: stats ? formatPercentage(stats.totalSales.change) : '',
        icon: DollarSign,
        changeValue: stats?.totalSales.change,
        accent: "bg-primary/10 text-primary"
      },
      { 
        title: "Nuevos Usuarios", 
        value: stats ? stats.newCustomers.current.toString() : '',
        change: stats ? formatPercentage(stats.newCustomers.change) : '',
        icon: Users,
        changeValue: stats?.newCustomers.change,
        accent: "bg-blue-500/10 text-blue-500"
      },
      { 
        title: "Pedidos Recibidos", 
        value: stats ? stats.orders.current.toString() : '',
        change: stats ? formatPercentage(stats.orders.change) : '',
        icon: ShoppingCart,
        changeValue: stats?.orders.change,
        accent: "bg-purple-500/10 text-purple-500"
      },
      { 
        title: "Ahorro en Cupones", 
        value: stats ? formatCurrency(stats.usedCoupons.current) : '', 
        change: stats ? formatPercentage(stats.usedCoupons.change) : '', 
        icon: Ticket,
        changeValue: stats?.usedCoupons.change,
        accent: "bg-orange-500/10 text-orange-500"
      }
  ]

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-slate-50/50 dark:bg-zinc-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="animate-fade-in">
                <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Panel de Control</h2>
                <p className="text-muted-foreground mt-1 font-medium">Bienvenido de vuelta al taller de Florarte.</p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-2xl h-11 px-6 font-bold shadow-sm" onClick={() => fetchStats()}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                    Sincronizar
                </Button>
                <Button className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20" asChild>
                    <Link href="/admin/products">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Arreglo
                    </Link>
                </Button>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             {isLoading ? (
                Array.from({length: 4}).map((_, index) => <StatCardSkeleton key={index}/>)
            ) : (
                statCards.map((item, index) => (
                    <Card 
                        key={item.title} 
                        className="border-none rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-all duration-500 hover:-translate-y-2 group animate-fade-in-up bg-white dark:bg-zinc-900"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.title}</CardTitle>
                            <div className={cn("p-2.5 rounded-2xl transition-transform group-hover:scale-110", item.accent)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-sans tracking-tight mb-3">{item.value}</div>
                            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", getChangeColor(item.changeValue || 0))}>
                                {getChangeIcon(item.changeValue || 0)}
                                <span>{item.change}</span>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase ml-2 tracking-tighter">vs mes anterior</span>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
            <Card className="lg:col-span-3 border-none rounded-[3rem] shadow-2xl bg-white dark:bg-zinc-900 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <CardHeader className="p-10 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl"><Sparkles className="w-5 h-5 text-primary" /></div>
                        <CardTitle className="font-headline text-2xl font-bold">Rendimiento de Ventas</CardTitle>
                    </div>
                    <CardDescription className="text-sm font-medium">Ingresos de los últimos 6 meses (completados).</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-10 pl-4">
                    <ResponsiveContainer width="100%" height={350}>
                        {isLoading || !stats?.salesData ? (
                            <Skeleton className="w-full h-full rounded-2xl" />
                        ) : (
                            <AreaChart data={stats.salesData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </CardContent>
            </Card>

             <Card className="lg:col-span-2 border-none rounded-[3rem] shadow-2xl bg-white dark:bg-zinc-900 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <CardHeader className="p-10 pb-6">
                    <CardTitle className="font-headline text-2xl font-bold">Actividad Reciente</CardTitle>
                    <CardDescription className="font-medium">Eventos en vivo de la tienda.</CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-10 space-y-6">
                     {isLoading || !stats?.recentActivity ? (
                        <div className="space-y-6">
                            {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
                        </div>
                    ) : (
                        stats.recentActivity.length > 0 ? (
                           stats.recentActivity.map((activity, index) => (
                               <div key={index} className="flex items-center gap-5 group transition-all">
                                   <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl transition-transform group-hover:scale-110 shadow-sm">
                                       {activityIcons[activity.type]}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       {activityText(activity)}
                                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                           {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true, locale: es })}
                                       </p>
                                   </div>
                               </div>
                           ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-sm text-muted-foreground font-medium">No hay actividad reciente.</p>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-none rounded-[3rem] shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <CardHeader className="p-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="font-headline text-2xl font-bold">Stock por Categoría</CardTitle>
                            <CardDescription className="font-medium mt-1">Distribución del catálogo actual.</CardDescription>
                        </div>
                        <Select value={categoryChartFilter} onValueChange={(value) => setCategoryChartFilter(value as 'main' | 'sub')}>
                            <SelectTrigger className="w-[160px] h-10 rounded-xl bg-slate-50 dark:bg-white/5 border-none shadow-sm font-bold text-xs uppercase tracking-widest">
                                <SelectValue placeholder="Vista" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="main" className="rounded-xl font-bold text-xs">PRINCIPALES</SelectItem>
                                <SelectItem value="sub" className="rounded-xl font-bold text-xs">SUBCATEGORÍAS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                     <ResponsiveContainer width="100%" height={350}>
                        {isLoading ? (
                            <Skeleton className="w-full h-full rounded-2xl" />
                        ) : (
                            <BarChart data={filteredCategoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={80} />
                                <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: [8, 8, 0, 0] }} content={<CustomTooltip />} />
                                <Bar dataKey="productCount" name="Productos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={35} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            
            <Card className="border-none rounded-[3rem] shadow-2xl bg-white dark:bg-zinc-900 animate-fade-in-up overflow-hidden" style={{ animationDelay: '700ms' }}>
                <CardHeader className="p-10 pb-6">
                    <div className='flex justify-between items-center'>
                        <div>
                            <CardTitle className="font-headline text-2xl font-bold">Últimos Pedidos</CardTitle>
                            <CardDescription className="font-medium">Gestión rápida de envíos.</CardDescription>
                        </div>
                        <Button asChild variant="ghost" className="rounded-full h-10 px-5 font-bold text-primary hover:bg-primary/5 group">
                           <Link href="/admin/orders" className="flex items-center">
                                Ver todo
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                           </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-6 pb-10">
                    <div className="rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-white/5">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest px-6 h-12">Cliente</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">Estado</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest px-6 h-12">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading || !stats?.recentOrders ? (
                                    Array.from({length: 5}).map((_, i) => (
                                        <TableRow key={i} className="border-slate-50 dark:border-white/5">
                                            <TableCell className="px-6 py-4"><Skeleton className="h-5 w-32 rounded-md"/></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                                            <TableCell className="px-6"><Skeleton className="h-5 w-16 ml-auto rounded-md"/></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    stats.recentOrders.map((order, index) => (
                                    <TableRow key={order.id} className="border-slate-50 dark:border-white/5 transition-colors hover:bg-slate-50/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">{order.customer_name}</div>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">ORD{String(order.id).padStart(4, '0')}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border-none px-2 py-0.5", statusStyles[order.status])}>
                                                {statusTranslations[order.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6 font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(order.total)}</TableCell>
                                    </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

// Necesario para el ícono de Refresh
const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
