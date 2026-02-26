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
