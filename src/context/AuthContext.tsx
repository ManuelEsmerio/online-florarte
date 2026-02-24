
// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Order, Product, Address, ShippingZone, Coupon, User } from '@/lib/definitions';
import type { LoginCredentials, RegisterData } from '@/lib/definitions';
import { apiFetch as baseApiFetch } from '@/lib/apiFetch';
import { mapDbShippingZoneToShippingZone } from '@/mappers/shippingZoneMapper';

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
  changePassword: (newPassword: string) => Promise<AuthResult>;
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
    async (url: string, options: RequestInit = {}) => {
      const headers = { ...options.headers };

      const stored = localStorage.getItem('florarte_user_session');

      if (stored) {
        const currentUser = JSON.parse(stored);

        // Temporalmente seguimos enviando el ID
        (headers as Record<string, string>)['X-User-Id'] =
          String(currentUser.id);
      }

      return baseApiFetch(url, { ...options, headers });
    },
    []
  );

  const fetchUserData = useCallback(async (): Promise<void> => {
    const stored = localStorage.getItem('florarte_user_session');

    const loggedInUser = stored
      ? JSON.parse(stored)
      : null;
    
    // Sincronizar con allUsers para tener los datos más recientes si hay cambios en memoria
    const freshUser = loggedInUser ? allUsers.find(u => u.id === loggedInUser.id) || loggedInUser : null;
    setUser(freshUser as any);
    
    // Mapear shipping zones para asegurar camelCase
    setShippingZones(allShippingZones.map(mapDbShippingZoneToShippingZone));

    if (freshUser) {
        // En una app real, aquí cargaríamos la wishlist del usuario
        // Por ahora, simulamos una vacía o la mantenemos en el estado
    }
  }, []);

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
      localStorage.setItem(
        'florarte_user_session',
        JSON.stringify(result)
      );

      setUser(result);

      return {
        success: true,
        message: 'Login exitoso',
        data: result,
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
      const res = await fetch('/api/users/register', {
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

      return {
        success: true,
        message: 'Registro exitoso',
        data: result,
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

  const logout = () => {
    localStorage.removeItem('florarte_user_session');
    setUser(null);
    setWishlist([]);
    router.push('/login');
    toast({ title: 'Has cerrado sesión' });
  };

  const updateUser = async (data: Partial<User>): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'No hay sesión' };
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
        allUsers[index] = { ...allUsers[index], ...data as any, updated_at: new Date().toISOString() };
        localStorage.setItem('florarte_user_session', JSON.stringify(allUsers[index]));
        await fetchUserData();
        return { success: true, message: 'Perfil actualizado' };
    }
    return { success: false, message: 'Usuario no encontrado' };
  };

  const addAddress = async (address: Omit<Address, 'id'>): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'No hay sesión' };
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
        const currentUser = allUsers[index];
        const newAddress = { 
            ...address, 
            id: Date.now(), 
            user_id: user.id,
            isDefault: (currentUser.addresses?.length || 0) === 0 
        } as Address;
        
        if (!currentUser.addresses) currentUser.addresses = [];
        currentUser.addresses.push(newAddress);
        
        localStorage.setItem('florarte_user_session', JSON.stringify(currentUser));
        await fetchUserData();
        return { success: true, message: 'Dirección agregada', data: currentUser };
    }
    return { success: false, message: 'Error al agregar dirección' };
  };

  const updateAddress = async (address: Address): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'No hay sesión' };
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
        const currentUser = allUsers[index];
        if (currentUser.addresses) {
            currentUser.addresses = currentUser.addresses.map(a => a.id === address.id ? { ...a, ...address } : a);
            localStorage.setItem('florarte_user_session', JSON.stringify(currentUser));
            await fetchUserData();
            return { success: true, message: 'Dirección actualizada', data: currentUser };
        }
    }
    return { success: false, message: 'Error al actualizar dirección' };
  };

  const deleteAddress = async (addressId: number): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'No hay sesión' };
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
        const currentUser = allUsers[index];
        if (currentUser.addresses) {
            currentUser.addresses = currentUser.addresses.filter(a => a.id !== addressId);
            localStorage.setItem('florarte_user_session', JSON.stringify(currentUser));
            await fetchUserData();
            return { success: true, message: 'Dirección eliminada' };
        }
    }
    return { success: false, message: 'Error al eliminar dirección' };
  };

  const setDefaultAddress = async (addressId: number): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'No hay sesión' };
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
        const currentUser = allUsers[index];
        if (currentUser.addresses) {
            currentUser.addresses = currentUser.addresses.map(a => ({
                ...a,
                isDefault: a.id === addressId
            }));
            localStorage.setItem('florarte_user_session', JSON.stringify(currentUser));
            await fetchUserData();
            return { success: true, message: 'Dirección principal actualizada' };
        }
    }
    return { success: false, message: 'Error' };
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

  const toggleWishlist = async (productId: number, product: Product) => {
      const exists = wishlist.some(p => p.id === productId);
      if (exists) {
          setWishlist(prev => prev.filter(p => p.id !== productId));
          return { success: true, type: 'removed' as const };
      } else {
          setWishlist(prev => [...prev, product]);
          return { success: true, type: 'added' as const };
      }
  };

  const changePassword = async (newPassword: string) => {
      if (!user) return { success: false, message: 'No hay sesión' };
      const index = allUsers.findIndex(u => u.id === user.id);
      if (index > -1) {
          (allUsers[index] as any).password = newPassword;
          return { success: true, message: 'Contraseña actualizada' };
      }
      return { success: false, message: 'Error' };
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
    deleteAccount: async () => {
        if (!user) return { success: false, message: 'No hay sesión' };
        const index = allUsers.findIndex(u => u.id === user.id);
        if (index > -1) {
            (allUsers[index] as any).is_deleted = true;
            return { success: true, message: 'Cuenta eliminada' };
        }
        return { success: false, message: 'Error' };
    },
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
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
