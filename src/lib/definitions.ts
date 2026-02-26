// ============================================================
// ENUMS (alineados con Prisma)
// ============================================================

export type Role = "CUSTOMER" | "ADMIN" | "DELIVERY";

export type AddressType =
  | "HOME"
  | "HOTEL"
  | "RESTAURANT"
  | "OFFICE"
  | "HOSPITAL"
  | "FUNERAL_CHAPEL"
  | "SCHOOL"
  | "BANK"
  | "APARTMENT"
  | "OTHER";

export type ProductStatus = "PUBLISHED" | "HIDDEN" | "DRAFT";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type DiscountType = "PERCENTAGE" | "FIXED";

export type CouponScope =
  | "GLOBAL"
  | "USERS"
  | "CATEGORIES"
  | "PRODUCTS"
  | "SPECIFIC";

export type CouponStatus = "ACTIVE" | "EXPIRED" | "USED" | "PAUSED";

export type LoyaltyTransactionType =
  | "EARNED"
  | "REDEEMED"
  | "ADJUSTED"
  | "EXPIRED";

export type TestimonialStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type CartStatus = "ACTIVE" | "CHECKED_OUT" | "ABANDONED";

// ============================================================
// USER & AUTH
// ============================================================

export interface User {
  id: number;
  firebaseUid?: string | null;
  name: string;
  email: string;
  passwordHash?: string | null;
  phone?: string | null;
  birthdate?: Date | null;
  role: Role;
  profilePicUrl?: string | null;
  loyaltyPoints: number;
  acceptsMarketing: boolean;
  emailVerifiedAt?: Date | null;
  
  // Tokens
  passwordResetToken?: string | null;
  passwordResetExpiry?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpiry?: Date | null;

  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones opcionales (para cuando se incluyen con include)
  addresses?: Address[];
  orders?: Order[];
  deliveries?: Order[];
  loyaltyHistory?: LoyaltyHistory[];
  testimonials?: Testimonial[];
  couponUsers?: CouponUser[];
  wishlistItems?: WishlistItem[];
  carts?: Cart[];
}

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;

  // Relaciones
  user?: User;
  product?: Product; // Asumiendo que quisieras incluir el producto
}

export interface Address {
  id: number;
  userId: number;
  alias: string;
  recipientName: string;
  recipientPhone?: string | null;
  streetName: string;
  streetNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: AddressType;
  referenceNotes?: string | null;
  isDefault: boolean;
  latitude?: number | null; // Decimal en prisma se suele mapear a number o string en JS
  longitude?: number | null;
  googlePlaceId?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  user?: User;
  orders?: Order[];
}

// ============================================================
// CATALOG
// ============================================================

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  prefix: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  showOnHome: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  parent?: ProductCategory | null;
  children?: ProductCategory[];
  products?: Product[];
  couponCategories?: CouponCategory[];
}

export interface Tag {
  id: number;
  name: string;
  
  // Relaciones
  products?: ProductTag[];
}

export interface Occasion {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  showOnHome: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  products?: ProductOccasion[];
}

// ============================================================
// PRODUCTS
// ============================================================

export interface Product {
  id: number;
  name: string;
  slug: string;
  code: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number; // Decimal
  salePrice?: number | null; // Decimal
  stock: number;
  hasVariants: boolean;
  status: ProductStatus;
  care?: string | null;
  mainImage?: string | null;
  badgeText?: string | null;
  allowPhoto: boolean;
  photoPrice?: number | null; // Decimal
  categoryId: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  category?: ProductCategory;
  variants?: ProductVariant[];
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  tags?: ProductTag[];
  occasions?: ProductOccasion[];
  orderItems?: OrderItem[];
  couponProducts?: CouponProduct[];
  cartItems?: CartItem[];
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  code?: string | null;
  price: number; // Decimal
  salePrice?: number | null; // Decimal
  stock: number;
  shortDescription?: string | null;
  description?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  product?: Product;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  orderItems?: OrderItem[];
  cartItems?: CartItem[];
}

export interface ProductImage {
  id: number;
  productId?: number | null;
  variantId?: number | null;
  src: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;

  // Relaciones
  product?: Product | null;
  variant?: ProductVariant | null;
}

export interface ProductSpecification {
  id: number;
  productId?: number | null;
  variantId?: number | null;
  key: string;
  value: string;
  sortOrder: number;

  // Relaciones
  product?: Product | null;
  variant?: ProductVariant | null;
}

export interface ProductTag {
  productId: number;
  tagId: number;

  // Relaciones
  product?: Product;
  tag?: Tag;
}

export interface ProductOccasion {
  productId: number;
  occasionId: number;

  // Relaciones
  product?: Product;
  occasion?: Occasion;
}

// ============================================================
// ORDERS
// ============================================================

export interface Order {
  id: number;
  userId: number | null;
  isGuest?: boolean;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  sessionId?: string | null;
  addressId?: number | null;
  shippingAddressSnapshot?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryDriverId?: number | null;
  couponId?: number | null;
  couponCodeSnap?: string | null;
  status: OrderStatus;
  subtotal: number; // Decimal
  couponDiscount: number; // Decimal
  shippingCost: number; // Decimal
  total: number; // Decimal
  deliveryDate: Date;
  deliveryTimeSlot: string;
  dedication?: string | null;
  deliveryNotes?: string | null;
  isAnonymous: boolean;
  signature?: string | null;
  deliveredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  user?: User;
  address?: Address | null;
  deliveryDriver?: User | null;
  coupon?: Coupon | null;
  items?: OrderItem[];
  loyaltyHistory?: LoyaltyHistory[];
  testimonial?: Testimonial | null;
  payment_status?: string;
  has_payment_transaction?: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number | null;
  productNameSnap: string;
  variantNameSnap?: string | null;
  imageSnap?: string | null;
  quantity: number;
  unitPrice: number; // Decimal
  customPhotoUrl?: string | null;
  createdAt: Date;

  // Relaciones
  order?: Order;
  product?: Product;
  variant?: ProductVariant | null;
}

// ============================================================
// COUPONS
// ============================================================

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // Decimal
  validFrom: Date;
  validUntil?: Date | null;
  status: CouponStatus;
  scope: CouponScope;
  maxUses?: number | null;
  usesCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Detalles de alcance (populados en vistas de admin)
  details?: {
    users?: { id: number; name: string }[];
    products?: { id: number; name: string }[];
    categories?: { id: number; name: string }[];
  };

  // Relaciones
  orders?: Order[];
  carts?: Cart[];
  couponUsers?: CouponUser[];
  couponCategories?: CouponCategory[];
  couponProducts?: CouponProduct[];
}

// ============================================================
// CART
// ============================================================

export interface Cart {
  id: number;
  userId?: number | null;
  sessionId?: string | null;
  status: CartStatus;
  couponId?: number | null;
  couponCode?: string | null;
  createdAt: Date;
  updatedAt: Date;

  user?: User | null;
  coupon?: Coupon | null;
  items?: CartItem[];
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  unitPrice: number; // Decimal
  isComplement: boolean;
  parentCartItemId?: number | null;
  customPhotoUrl?: string | null;
  deliveryDate?: Date | null;
  deliveryTimeSlot?: string | null;
  createdAt: Date;
  updatedAt: Date;

  cart?: Cart;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface DbCartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string;
  product_sku_short: string;
  category_name: string;
  category_slug: string;
  variant_id: number | null;
  variant_name: string | null;
  variant_code: string | null;
  variant_image: string | null;
  quantity: number;
  unit_price: number;
  is_complement: number;
  parent_cart_item_id: number | null;
  custom_photo_url: string | null;
  delivery_date: string | null;
  delivery_time_slot: string | null;
}

export interface CouponUser {
  couponId: number;
  userId: number;

  // Relaciones
  coupon?: Coupon;
  user?: User;
}

export interface CouponCategory {
  couponId: number;
  categoryId: number;

  // Relaciones
  coupon?: Coupon;
  category?: ProductCategory;
}

export interface CouponProduct {
  couponId: number;
  productId: number;

  // Relaciones
  coupon?: Coupon;
  product?: Product;
}

// ============================================================
// LOYALTY & TESTIMONIALS
// ============================================================

export interface LoyaltyHistory {
  id: number;
  userId: number;
  orderId?: number | null;
  points: number;
  transactionType: LoyaltyTransactionType;
  notes?: string | null;
  createdAt: Date;

  // Campos desnormalizados (populados en vistas de admin)
  userName?: string;
  userEmail?: string;

  // Relaciones
  user?: User;
  order?: Order | null;
}

export interface Testimonial {
  id: number;
  userId: number;
  orderId: number;
  rating: number; // 1-5
  comment: string;
  userName: string;
  userProfilePic?: string | null;
  status: TestimonialStatus;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  user?: User;
  order?: Order;
}

// ============================================================
// SHIPPING & MARKETING
// ============================================================

export interface ShippingZone {
  id: number;
  postalCode: string;
  locality: string;
  shippingCost: number; // Decimal
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: number;
  title: string;
  description?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  imageUrl: string;
  imageMobileUrl?: string | null;
  isActive: boolean;
  startAt?: Date | null;
  endAt?: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PeakDate {
  id: number;
  name: string;
  peakDate: Date;
  isCouponRestricted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// API DTOs (Data Transfer Objects) & UTILS
// ============================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string | null;
  birthdate?: Date | string | null;
  profilePic?: string; // base64
  acceptsMarketing?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errorCode: string | null;
}