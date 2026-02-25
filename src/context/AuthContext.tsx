
// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Order, Product, Address, ShippingZone, Coupon, User } from '@/lib/definitions';
import type { LoginCredentials, RegisterData } from '@/lib/definitions';
import { apiFetch as baseApiFetch } from '@/lib/apiFetch';
// Importación de datos mock
import { allShippingZones } from '@/lib/data/shipping-zones';
import { allUsers } from '@/lib/data/user-data';

interface AuthResult {
  success: boolean;
  message: string;
  errorCode?: string;
  data?: any;
}

interface ToggleWishlistResult {
  success: boolean;
  type?: 'added' | 'removed';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  wishlist: Product[];
  shippingZones: ShippingZone[];
  allUsers: User[]; // Agregado para el modo admin/prototipo
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

  const apiFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      return baseApiFetch(url, options);
    },
    []
  );

  const fetchUserData = useCallback(async (): Promise<void> => {
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

      // Cargar wishlist del usuario desde la BD
      try {
        const wRes = await apiFetch('/api/wishlist');
        if (wRes.ok) {
          const wResult = await wRes.json();
          setWishlist(wResult.data?.wishlistItems ?? []);
        }
      } catch {
        // Wishlist no crítica — no bloquear el login
      }

    } catch (error) {
      console.error(error);
      setUser(null);
      setWishlist([]);
      localStorage.removeItem('florarte_user_session');
    }
  }, [apiFetch]);

  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      await fetchUserData();
      setLoading(false);
    };
    initializeSession();
  }, [fetchUserData]);

  // Login User DB
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result.error || 'Login inválido',
        };
      }

      // Guardar sesión temporal
      const userData = result.data || result;
      localStorage.setItem(
        'florarte_user_session',
        JSON.stringify(userData)
      );

      setUser(userData);

      return {
        success: true,
        message: 'Login exitoso',
        data: userData,
      };

    } catch (err) {
      console.error(err);

      return {
        success: false,
        message: 'Error de conexión',
      };

    } finally {
      setLoading(false);
    }
  };

  // Register User DB
  const register = async (data: RegisterData): Promise<AuthResult> => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result.error || 'Error al registrarse',
        };
      }

      // La cookie ya fue seteada por el servidor — populamos el estado del usuario
      const userData = result.data;
      localStorage.setItem('florarte_user_session', JSON.stringify(userData));
      setUser(userData);

      return {
        success: true,
        message: 'Registro exitoso',
        data: userData,
      };

    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: 'Error de conexión',
      };

    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('florarte_user_session');
    setUser(null);
    setWishlist([]);
    router.push('/login');
    toast({ title: 'Has cerrado sesión' });
  };

  // Actualizar datos del usuario autenticado
  const updateUser = async (data: Partial<User>): Promise<AuthResult> => {
    if (!user) {
      return { success: false, message: 'No hay sesión' };
    }

    try {
      const res = await apiFetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result.message || 'Error al actualizar perfil',
        };
      }

      /* Guardar usuario actualizado */
      const updatedUser = result.data;

      localStorage.setItem(
        'florarte_user_session',
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);

      return {
        success: true,
        message: 'Perfil actualizado',
        data: updatedUser,
      };

    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  };

  // Agregar direccion del usuario autenticado
  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!user) return { success: false, message: 'No hay sesión' };

    return updateUser({
      addresses: [...(user.addresses || []), address],
    } as any);
  };

  // Actualizar direccion del usuario autenticado
  const updateAddress = async (address: Address) => {
    if (!user) return { success: false, message: 'No hay sesión' };

    const updated = user.addresses?.map(a =>
      a.id === address.id ? address : a
    );

    return updateUser({
      addresses: updated,
    } as any);
  };

  // Eliminar direccion del usuario autenticado
  const deleteAddress = async (addressId: number) => {
    if (!user) return { success: false, message: 'No hay sesión' };

    const filtered = user.addresses?.filter(a => a.id !== addressId);

    return updateUser({
      addresses: filtered,
    } as any);
  };

  // Establecer direccion por defecto del usuario autenticado
  const setDefaultAddress = async (addressId: number) => {
    if (!user) return { success: false, message: 'No hay sesión' };

    const updated = user.addresses?.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));

    return updateUser({
      addresses: updated,
    } as any);
  };

  // Eliminar cuenta del usuario autenticado
  const deleteAccount = async (): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'No hay sesión' };

    try {
      const res = await apiFetch('/api/users/profile', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const r = await res.json();
        return {
          success: false,
          message: r.message || 'Error al eliminar cuenta',
        };
      }

      logout();

      return {
        success: true,
        message: 'Cuenta eliminada',
      };

    } catch (e) {
      console.error(e);

      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  };

  // Cambiar contraseña del usuario autenticado
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> => {

    try {
      const res = await apiFetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result.message,
        };
      }

      return {
        success: true,
        message: 'Contraseña actualizada',
      };

    } catch {
      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  };
  
  const getOrders = async () => {
      // Retornamos pedidos reales para el usuario logueado en modo mock
      const { allOrders } = await import('@/lib/data/order-data');
      return allOrders.filter(o => o.user_id === user?.id);
  };

  const getCoupons = async () => {
      const { userCoupons } = await import('@/lib/data/user-coupon-data');
      return userCoupons.filter(c => c.scope === 'global' || c.user_id === user?.id);
  };

  const toggleWishlist = async (productId: number, product: Product): Promise<ToggleWishlistResult> => {
    // Actualización optimista
    const exists = wishlist.some(p => p.id === productId);
    if (exists) {
      setWishlist(prev => prev.filter(p => p.id !== productId));
    } else {
      setWishlist(prev => [...prev, product]);
    }

    try {
      const res = await apiFetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        // Revertir si falla
        if (exists) {
          setWishlist(prev => [...prev, product]);
        } else {
          setWishlist(prev => prev.filter(p => p.id !== productId));
        }
        return { success: false };
      }

      const data = await res.json();
      return { success: true, type: data.data?.type as 'added' | 'removed' };

    } catch {
      // Revertir si falla
      if (exists) {
        setWishlist(prev => [...prev, product]);
      } else {
        setWishlist(prev => prev.filter(p => p.id !== productId));
      }
      return { success: false };
    }
  };

  const contextValue: AuthContextType = {
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
  };

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
