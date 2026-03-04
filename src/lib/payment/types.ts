export interface CreateCheckoutParams {
  orderId: number;
  /** Amount in MXN major units (e.g. 150.00) */
  amount: number;
  userId?: number;
  successUrl: string;
  cancelUrl: string;
  pendingUrl?: string;
  notificationUrl?: string;
}

export interface CheckoutResult {
  /** URL to redirect the user to complete payment */
  checkoutUrl: string;
  /** Provider-specific session/preference ID */
  externalSessionId: string;
}

export interface PaymentProvider {
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult>;
}

export interface RefundParams {
  /** Provider-specific payment ID (Stripe payment_intent or MP payment_id) */
  externalPaymentId: string;
  /** Amount to refund in MXN major units. Omit for full refund. */
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  /** Provider-specific refund ID */
  externalRefundId: string;
  /** Provider-reported status (e.g. 'pending', 'succeeded', 'approved') */
  status: string;
  /** Actual amount refunded in MXN major units */
  amount: number;
}

export interface RefundProvider {
  createRefund(params: RefundParams): Promise<RefundResult>;
}
