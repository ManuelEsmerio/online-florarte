
// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Order, Product, Address, ShippingZone, Coupon, User } from '@/lib/definitions';
import type { LoginCredentials, RegisterData } from '@/lib/definitions';
import { apiFetch as baseApiFetch } from '@/lib/apiFetch';
import { allShippingZones } from '@/lib/data/shipping-zones';
import { allUsers } from '@/lib/data/user-data';

// ─── Módulo-level guards ─────────────────────────────────────────────────────
// Evitan que React Strict Mode (doble-invocación en dev) o navegaciones rápidas
// lancen la misma petición varias veces simultáneamente.
let profileInFlight: Promise<void> | null = null;
let shippingZonesMemoryCache: ShippingZone[] | null = null;
let shippingZonesInFlight: Promise<ShippingZone[]> | null = null;

interface AuthResult {
  success: boolean;
  message: string;
  errorCode?: string;
  data?: any;
}

interface ToggleWishlistResult {
  success: boolean;
  type?: 'added' | 'removed';
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  wishlist: Product[];
  shippingZones: ShippingZone[];
  allUsers: User[];
  fetchUserData: () => Promise<void>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => void;
  register: (data: RegisterData) => Promise<AuthResult>;
  updateUser: (user: Partial<User>) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<AuthResult>;
  updateAddress: (address: Address) => Promise<AuthResult>;
  deleteAddress: (addressId: number) => Promise<AuthResult>;
  setDefaultAddress: (addressId: number) => Promise<AuthResult>;
  getOrders: () => Promise<Order[]>;
  getCoupons: () => Promise<Coupon[]>;
  toggleWishlist: (productId: number, product: Product) => Promise<ToggleWishlistResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  // Ref que siempre apunta al usuario actual sin causar recreación de callbacks
  const userRef = useRef<User | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  // Refs para dedup de orders
  const ordersInFlightRef = useRef<Promise<Order[]> | null>(null);
  const ordersCacheRef = useRef<{ userId: number; data: Order[]; fetchedAt: number } | null>(null);

  const apiFetch = useCallback(
    (url: string, options: RequestInit = {}) => baseApiFetch(url, options),
    []
  );

  // ─── fetchShippingZones ────────────────────────────────────────────────────
  // Cache de módulo + in-flight guard: solo 1 request por sesión de app.
  const fetchShippingZones = useCallback(async () => {
    if (shippingZonesMemoryCache && shippingZonesMemoryCache.length > 0) {
      setShippingZones(shippingZonesMemoryCache);
      return;
    }

    if (!shippingZonesInFlight) {
      shippingZonesInFlight = (async () => {
        try {
          const res = await baseApiFetch('/api/shipping');
          if (!res.ok) return allShippingZones as unknown as ShippingZone[];
          const result = await res.json();
          const zones = Array.isArray(result?.data) ? (result.data as ShippingZone[]) : [];
          return zones.length > 0 ? zones : (allShippingZones as unknown as ShippingZone[]);
        } catch {
          return allShippingZones as unknown as ShippingZone[];
        }
      })();
    }

    try {
      const zones = await shippingZonesInFlight;
      shippingZonesMemoryCache = zones;
      setShippingZones(zones);
    } finally {
      shippingZonesInFlight = null;
    }
  }, []);

  // ─── fetchUserData ────────────────────────────────────────────────────────
  // In-flight guard de módulo: si ya hay una petición en curso (ej. React
  // Strict Mode la invoca dos veces) se reutiliza la misma Promise.
  //
  // La wishlist se dispara en background (fire-and-forget) para que
  // profileInFlight resuelva lo antes posible y no bloquee la UI.
  const fetchUserData = useCallback(async (): Promise<void> => {
    if (profileInFlight) return profileInFlight;

    profileInFlight = (async () => {
      try {
        const res = await apiFetch('/api/users/profile');

        if (!res.ok) {
          console.warn('Sesión inválida en backend');
          setUser(null);
          setWishlist([]);
          localStorage.removeItem('florarte_user_session');
          return;
        }

        const result = await res.json();
        const userData = result.data;
        setUser(userData);
        localStorage.setItem('florarte_user_session', JSON.stringify(userData));

        // Wishlist: fire-and-forget — NO await aquí.
        // profileInFlight resuelve inmediatamente después de setUser,
        // la wishlist se carga en paralelo sin bloquear loading.
        apiFetch('/api/wishlist')
          .then(async (wRes) => {
            if (wRes.ok) {
              const wResult = await wRes.json();
              setWishlist(wResult.data?.wishlistItems ?? []);
            }
          })
          .catch(() => { /* no crítica */ });

      } catch (error) {
        console.error(error);
        setUser(null);
        setWishlist([]);
        localStorage.removeItem('florarte_user_session');
      } finally {
        profileInFlight = null;
      }
    })();

    return profileInFlight;
  }, [apiFetch]);

  // ─── Inicialización — Stale-While-Revalidate ──────────────────────────────
  //
  // Patrón: mostrar datos del caché inmediatamente y validar en la red en
  // segundo plano. Así el Header y el CartContext arrancan sin esperar la red.
  //
  // Flujo para usuario con sesión cacheada:
  //   1. Restaurar user desde localStorage → setLoading(false) (instantáneo)
  //   2. Validar en red (background) → actualizar user con datos frescos
  //   3. Shipping zones en background (no bloquean el loading)
  //
  // Flujo para usuario sin sesión:
  //   1. setLoading(true) y esperar respuesta del servidor
  //   2. Si 401 → user=null, setLoading(false) → mostrar botones de login
  //   3. Shipping zones en background
  useEffect(() => {
    const initializeSession = async () => {
      const rawCached = localStorage.getItem('florarte_user_session');

      if (rawCached) {
        // Restauración optimista: el usuario ve su info sin esperar la red
        try {
          const cachedUser = JSON.parse(rawCached) as User;
          setUser(cachedUser);
          setLoading(false);
        } catch {
          localStorage.removeItem('florarte_user_session');
        }
      }

      // Validar/refrescar contra el servidor
      // - Con caché: loading ya es false → la actualización es silenciosa
      // - Sin caché: determinamos si hay sesión activa
      if (!rawCached) setLoading(true);
      await fetchUserData();
      if (!rawCached) setLoading(false);

      // Shipping zones no bloquean el loading state
      fetchShippingZones();
    };

    initializeSession();
  }, [fetchUserData, fetchShippingZones]);

  // Limpiar cache de orders al cambiar de usuario
  useEffect(() => {
    ordersCacheRef.current = null;
    ordersInFlightRef.current = null;
  }, [user?.id]);

  // ─── login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result.error || 'Login inválido' };
      }

      const userData = result.data || result;
      localStorage.setItem('florarte_user_session', JSON.stringify(userData));
      setUser(userData);

      return { success: true, message: 'Login exitoso', data: userData };

    } catch (err) {
      console.error(err);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── register ────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result.error || 'Error al registrarse' };
      }

      const userData = result.data;
      localStorage.setItem('florarte_user_session', JSON.stringify(userData));
      setUser(userData);

      return { success: true, message: 'Registro exitoso', data: userData };

    } catch (error) {
      console.error(error);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('[AUTH_LOGOUT_WARNING] No se pudo notificar logout al servidor.', error);
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.warn('[AUTH_LOGOUT_WARNING] No se pudo limpiar localStorage.', error);
    }

    ordersCacheRef.current = null;
    ordersInFlightRef.current = null;
    setUser(null);
    setWishlist([]);
    router.push('/login');
    toast({ title: 'Has cerrado sesión' });
  }, [router, toast]);

  // ─── updateUser ───────────────────────────────────────────────────────────
  // Usa userRef.current en lugar de user para evitar que esta función
  // se recree en cada render del contexto.
  const updateUser = useCallback(async (data: Partial<User>): Promise<AuthResult> => {
    if (!userRef.current) {
      return { success: false, message: 'No hay sesión' };
    }

    try {
      const res = await apiFetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result.message || 'Error al actualizar perfil' };
      }

      const updatedUser = result.data;
      localStorage.setItem('florarte_user_session', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, message: 'Perfil actualizado', data: updatedUser };

    } catch (error) {
      console.error(error);
      return { success: false, message: 'Error de conexión' };
    }
  }, [apiFetch]);

  // ─── Address helpers ──────────────────────────────────────────────────────
  const addAddress = useCallback(async (address: Omit<Address, 'id'>) => {
    if (!userRef.current) return { success: false, message: 'No hay sesión' };
    return updateUser({
      addresses: [...(userRef.current.addresses || []), address],
    } as any);
  }, [updateUser]);

  const updateAddress = useCallback(async (address: Address) => {
    if (!userRef.current) return { success: false, message: 'No hay sesión' };
    const updated = userRef.current.addresses?.map(a => a.id === address.id ? address : a);
    return updateUser({ addresses: updated } as any);
  }, [updateUser]);

  const deleteAddress = useCallback(async (addressId: number) => {
    if (!userRef.current) return { success: false, message: 'No hay sesión' };
    const filtered = userRef.current.addresses?.filter(a => a.id !== addressId);
    return updateUser({ addresses: filtered } as any);
  }, [updateUser]);

  const setDefaultAddress = useCallback(async (addressId: number) => {
    if (!userRef.current) return { success: false, message: 'No hay sesión' };
    const updated = userRef.current.addresses?.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    return updateUser({ addresses: updated } as any);
  }, [updateUser]);

  // ─── deleteAccount ────────────────────────────────────────────────────────
  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    if (!userRef.current) return { success: false, message: 'No hay sesión' };

    try {
      const res = await apiFetch('/api/users/profile', { method: 'DELETE' });

      if (!res.ok) {
        const r = await res.json();
        return { success: false, message: r.message || 'Error al eliminar cuenta' };
      }

      await logout();
      return { success: true, message: 'Cuenta eliminada' };

    } catch (e) {
      console.error(e);
      return { success: false, message: 'Error de conexión' };
    }
  }, [apiFetch, logout]);

  // ─── changePassword ───────────────────────────────────────────────────────
  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> => {
    try {
      const res = await apiFetch('/api/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result.message };
      }

      return { success: true, message: 'Contraseña actualizada' };

    } catch {
      return { success: false, message: 'Error de conexión' };
    }
  }, [apiFetch]);

  // ─── getOrders ────────────────────────────────────────────────────────────
  // Cache de 10s + in-flight guard para evitar calls duplicados.
  const getOrders = useCallback(async (): Promise<Order[]> => {
    const currentUserId = Number(user?.id ?? 0);
    if (!currentUserId) return [];

    const cached = ordersCacheRef.current;
    const now = Date.now();
    if (cached && cached.userId === currentUserId && now - cached.fetchedAt < 10_000) {
      return cached.data;
    }

    if (ordersInFlightRef.current) return ordersInFlightRef.current;

    ordersInFlightRef.current = (async () => {
      try {
        const res = await apiFetch('/api/orders');
        if (!res.ok) return [];
        const result = await res.json();
        const data = (result.data ?? []) as Order[];
        ordersCacheRef.current = { userId: currentUserId, data, fetchedAt: Date.now() };
        return data;
      } catch {
        return [];
      } finally {
        ordersInFlightRef.current = null;
      }
    })();

    return ordersInFlightRef.current;
  }, [apiFetch, user?.id]);

  // ─── getCoupons ───────────────────────────────────────────────────────────
  const getCoupons = useCallback(async (): Promise<Coupon[]> => {
    try {
      const res = await apiFetch('/api/users/coupons');
      if (!res.ok) return [];
      const result = await res.json();
      return (result.data ?? []) as Coupon[];
    } catch {
      return [];
    }
  }, [apiFetch]);

  // ─── toggleWishlist ───────────────────────────────────────────────────────
  const toggleWishlist = useCallback(async (productId: number, product: Product): Promise<ToggleWishlistResult> => {
    if (!userRef.current?.id) {
      return { success: false, message: 'Debes iniciar sesión para guardar favoritos.' };
    }

    try {
      const res = await apiFetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        return { success: false };
      }

      const data = await res.json();
      const type = data.data?.type as 'added' | 'removed' | undefined;

      if (!type) {
        return { success: false };
      }

      setWishlist(prev => {
        if (type === 'removed') {
          return prev.filter(p => p.id !== productId);
        }

        const alreadyInWishlist = prev.some(p => p.id === productId);
        if (alreadyInWishlist) return prev;
        return [...prev, product];
      });

      return { success: true, type };

    } catch {
      return { success: false };
    }
  }, [apiFetch]);

  // ─── contextValue ────────────────────────────────────────────────────────
  // Todas las funciones son ahora useCallback, por lo que contextValue solo
  // cambia cuando cambia estado relevante (user, loading, wishlist, shippingZones)
  // o cuando cambia la identidad de alguna función. Esto elimina re-renders
  // innecesarios en los consumidores del contexto.
  const contextValue: AuthContextType = useMemo(() => ({
    user,
    loading,
    wishlist,
    shippingZones,
    allUsers: allUsers as any,
    fetchUserData,
    apiFetch,
    login,
    logout,
    register,
    changePassword,
    updateUser,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    deleteAccount,
    getOrders,
    getCoupons,
    toggleWishlist,
  }), [
    user,
    loading,
    wishlist,
    shippingZones,
    fetchUserData,
    apiFetch,
    login,
    logout,
    register,
    changePassword,
    updateUser,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    deleteAccount,
    getOrders,
    getCoupons,
    toggleWishlist,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
