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

  // ============================================================
// USER
// ============================================================

export interface User {
  id: number;

  firebaseUid?: string | null;

  name: string;
  email: string;

  phone?: string | null;
  birthdate?: string | null;

  role: Role;

  profilePicUrl?: string | null;

  loyaltyPoints: number;

  acceptsMarketing: boolean;

  emailVerifiedAt?: string | null;

  isDeleted: boolean;
  deletedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  addresses?: Address[];
}

// ============================================================
// ADDRESS
// ============================================================

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

  latitude?: number | null;
  longitude?: number | null;

  googlePlaceId?: string | null;

  isDeleted: boolean;
  deletedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

// ============================================================
// AUTH / PROFILE DTOs
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
  birthdate?: string | null;
  profilePic?: string; // base64

  acceptsMarketing?: boolean;

  addresses?: Partial<Address>[];
}

// ============================================================
// API RESPONSE
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errorCode: string | null;
}