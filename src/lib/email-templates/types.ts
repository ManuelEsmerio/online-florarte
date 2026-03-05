export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderEmailAddressInfo {
  recipientName: string | null;
  recipientPhone: string | null;
  line1: string | null;
  referenceNotes: string | null;
}

export interface OrderEmailPayload {
  id: number;
  code: string;
  status: string;
  subtotal: number;
  couponDiscount: number;
  shippingCost: number;
  total: number;
  deliveryDate: Date | null;
  deliveryTimeSlot: string | null;
  dedication: string | null;
  deliveryNotes: string | null;
  isAnonymous: boolean;
  signature: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  paymentGateway: string | null;
  address: OrderEmailAddressInfo;
  items: OrderEmailItem[];
}

export interface PaymentSummary {
  method: string;
  status: string;
  reference: string | null;
  processedAt: Date | null;
  amount: number | null;
}
