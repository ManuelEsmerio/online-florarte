'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Subscriber = {
  id: number;
  email: string;
  source: string | null;
  isActive: boolean;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function NewsletterAdminPage() {
  const { apiFetch } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  type FilterState = {
    search: string;
    source: 'all' | 'home' | 'footer';
    status: 'all' | 'active' | 'inactive';
  };

  type FilterAction =
    | { type: 'SET_SEARCH'; payload: string }
    | { type: 'SET_SOURCE'; payload: 'all' | 'home' | 'footer' }
    | { type: 'SET_STATUS'; payload: 'all' | 'active' | 'inactive' };

  const [filters, dispatchFilters] = useReducer(
    (state: FilterState, action: FilterAction): FilterState => {
      switch (action.type) {
        case 'SET_SEARCH':
          return { ...state, search: action.payload };
        case 'SET_SOURCE':
          return { ...state, source: action.payload };
        case 'SET_STATUS':
          return { ...state, status: action.payload };
        default:
          return state;
      }
    },
    {
      search: '',
      source: 'all',
      status: 'active',
    }
  );

  const { search, source, status } = filters;

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('source', source);
      params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const response = await apiFetch(`/api/admin/newsletter?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'No se pudieron cargar los suscriptores.');
      }

      setItems((result.data?.subscribers ?? []) as Subscriber[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'No fue posible obtener los suscriptores.',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, source, status, search, toast]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const totals = useMemo(() => {
    const active = items.filter(i => i.isActive).length;
    const home = items.filter(i => (i.source || '').toLowerCase() === 'home').length;
    const footer = items.filter(i => (i.source || '').toLowerCase() === 'footer').length;
    return { total: items.length, active, home, footer };
  }, [items]);

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Newsletter</h2>
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Suscriptores por fuente</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-5"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total</p><p className="text-2xl font-bold">{totals.total}</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-5"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Activos</p><p className="text-2xl font-bold">{totals.active}</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-5"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Home</p><p className="text-2xl font-bold">{totals.home}</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-5"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Footer</p><p className="text-2xl font-bold">{totals.footer}</p></CardContent></Card>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Listado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => dispatchFilters({ type: 'SET_SEARCH', payload: e.target.value })}
                placeholder="Buscar por email..."
                className="pl-9 h-11 rounded-xl"
              />
            </div>
            <Select value={source} onValueChange={(v: 'all' | 'home' | 'footer') => dispatchFilters({ type: 'SET_SOURCE', payload: v })}>
              <SelectTrigger className="h-11 rounded-xl md:w-44"><SelectValue placeholder="Fuente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v: 'all' | 'active' | 'inactive') => dispatchFilters({ type: 'SET_STATUS', payload: v })}>
              <SelectTrigger className="h-11 rounded-xl md:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No hay suscriptores con esos filtros.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/50">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Email</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Fuente</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Estado</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Confirmado</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border/50">
                      <td className="px-4 py-3 font-medium">{item.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="uppercase">{item.source || 'N/A'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={item.isActive ? 'bg-green-600 text-white' : 'bg-slate-500 text-white'}>
                          {item.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{item.confirmed ? 'Sí' : 'No'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
