
// src/lib/definitions.ts

/**
 * Estructura de respuesta estándar del API para mantener consistencia.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  errorCode: string | null;
}

/**
 * Representa la estructura de un usuario tal como se almacena en la base de datos local.
 */
export type DbUser = {
  id: number;
  uid: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'customer' | 'admin' | 'delivery';
  profile_pic_url?: string | null;
  loyalty_points: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Representa la estructura de un usuario para el frontend.
 */
export type User = {
  id: number;
  uid: string;
  name: string;
  email: string;
  password?: string; // Solo para propósitos de demo/mock
  phone?: string | null;
  role: 'customer' | 'admin' | 'delivery';
  profilePic?: string | null;
  loyalty_points: number;
  addresses?: Address[];
  is_deleted?: boolean;
  created_at?: string;
  dbId?: number;
};

export type CreateUserDTO = {
  uid?: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'delivery';
  password?: string;
  phone?: string;
  profilePic?: string | null;
};

export type UpdateUserDTO = {
  name?: string;
  email?: string;
  phone?: string | null;
  profilePic?: string;
  role?: 'customer' | 'admin' | 'delivery';
  password?: string;
};

export type AddressType = 
  | 'casa' | 'hotel' | 'restaurante' | 'oficina' | 'hospital' 
  | 'capilla-funeral' | 'escuela-universidad' | 'banco' | 'departamento' | 'otro';

export interface Address {
  id: number;
  user_id?: number;
  alias: string;
  recipientName: string;
  phone: string;
  streetName: string;
  streetNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  addressType: AddressType;
  reference_notes?: string;
  isDefault?: boolean;
}

// --- Tipos de Producto ---
export type ProductStatus = 'publicado' | 'oculto' | 'borrador';

export interface ProductVariant {
  id: number;
  product_id?: number;
  name: string;
  price: number;
  sale_price?: number | null;
  stock: number;
  code?: string | null;
  short_description?: string | null;
  specifications?: { key: string; value: string }[] | null;
  description?: string | null;
  images?: { id?: number, src: string; alt: string, is_primary: boolean }[];
}

export interface Occasion {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  show_on_home: boolean;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PeakDate {
    id: number;
    name: string;
    peak_date: Date;
    is_coupon_restricted: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  short_description?: string | null;
  specifications?: { key: string; value: string }[] | null;
  price: number;
  sale_price?: number | null;
  stock: number;
  has_variants: boolean;
  status: ProductStatus;
  is_deleted?: boolean;
  category: ProductCategory;
  tags?: Tag[];
  care?: string | null;
  image: string;
  images?: {
    id?: number;
    src: string;
    alt: string;
    is_primary: boolean;
  }[];
  variants?: ProductVariant[];
  occasions?: Occasion[];
  allow_photo?: boolean;
  photo_price?: number;
  photo_image?: string | null;
  tag_visible?: string | null;
}

export type ProductRow = Product & {
    isVariant: boolean;
    variantName?: string;
    variantId?: number;
};

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  prefix: string;
  description: string;
  image_url: string;
  parent_id?: number | null;
  show_on_home: boolean;
}

// --- Tipos de Carrito ---
export interface CartItem extends Product {
  cartItemId: string; 
  quantity: number;
  deliveryDate?: string;
  deliveryTime?: string;
  photoOption?: 'Sin Foto' | 'Con Foto';
  customPhotoUrl?: string;
  isComplement?: boolean;
  parentCartItemId?: number | null;
}

// --- Tipos de Cupón ---
export type DiscountType = 'percentage' | 'fixed';

export enum CouponScope {
  GLOBAL = 'global',
  USER = 'user',
  CATEGORY = 'category',
  PRODUCT = 'product',
}

export type CouponStatus = 'vigente' | 'vencido' | 'utilizado' | 'programado' | 'todos';

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: DiscountType;
  value: number; 
  valid_from: string;
  valid_until: string | null;
  status: CouponStatus;
  scope?: CouponScope;
  max_uses: number | null;
  uses_count: number;
  min_purchase?: number;
  applicable_ids?: number[];
  details?: {
    users?: { id: number; name: string; }[];
    products?: { id: number; name: string; }[];
    categories?: { id: number; name: string; }[];
  }
};

// --- Tipos de Zona de Envío ---
export interface ShippingZone {
  id: number;
  postal_code: string;
  locality: string;
  shipping_cost: number;
}

export type DbShippingZone = {
  id: number;
  postal_code: string;
  locality: string;
  shipping_cost: number;
};

// --- Tipos de Lealtad ---
export interface LoyaltyHistory {
    id: number;
    userName: string;
    userEmail: string;
    orderId?: number;
    points: number;
    transactionType: string;
    createdAt: string;
}

// --- Tipos de Dashboard y Actividad ---
export interface Testimonial {
  id: number;
  userId: number;
  userName: string;
  userProfilePic?: string;
  orderId?: number;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Activity {
  type: 'new_order' | 'new_user' | 'low_stock';
  timestamp: string;
  entity_id: number;
  details: any;
}

export interface RecentOrder {
  id: number;
  customer_name: string;
  total: number;
  status: OrderStatus;
}

export interface DashboardStats {
  totalSales: { current: number; change: number };
  newCustomers: { current: number; change: number };
  orders: { current: number; change: number };
  usedCoupons: { current: number; change: number };
  salesData: { name: string; total: number }[];
  categoryProductCounts: { name: string; productCount: number, isSubcategory: boolean }[];
  recentOrders: RecentOrder[];
  recentActivity: Activity[];
}

export type OrderStatus = 'pendiente' | 'procesando' | 'en_reparto' | 'completado' | 'cancelado';

export type OrderItem = {
    id?: number;
    order_id?: number;
    product_id: number;
    variant_id?: number | null;
    product_name: string; 
    variant_name?: string | null;
    quantity: number;
    price: number; 
    image: string;
    customPhotoUrl?: string;
};

export type Order = {
    id: number;
    user_id: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    address_id: number;
    recipientName?: string;
    recipientPhone?: string;
    coupon_id?: number | null;
    status: OrderStatus;
    subtotal: number;
    coupon_discount?: number;
    shipping_cost?: number;
    total: number;
    delivery_date: string;
    delivery_time_slot: string;
    dedication?: string;
    is_anonymous?: boolean;
    signature?: string;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
    shippingAddress?: string;
    couponCode?: string;
    delivery_driver_id?: number;
    deliveryDriverName?: string;
    delivery_notes?: string;
    delivered_at?: string;
    hasReview?: boolean;
    testimonial?: Pick<Testimonial, 'id' | 'rating' | 'comment' | 'status'> | null;
};

export interface Announcement {
  id: number;
  title: string;
  description?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  image_url: string;
  image_mobile_url?: string | null;
  is_active: boolean;
  start_at?: string | null;
  end_at?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
}
