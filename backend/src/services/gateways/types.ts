import type { PaymentProvider } from '../../models/workspaceSettings.model.js';

export type PaymentMode = 'test' | 'live';

export interface GatewayCredentials {
  provider: PaymentProvider;
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  mode: PaymentMode;
}

export interface CheckoutSession {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  paymentSessionId?: string;
}

export interface OrderInput {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
}

export interface ConnectionCheck {
  ok: boolean;
  merchantId?: string;
  businessName?: string;
  message?: string;
}

export interface WebhookEvent {
  kind: 'paid' | 'failed' | 'ignored';
  orderId?: string;
  paymentId?: string;
  payerEmail?: string;
  payerContact?: string;
  method?: string;
  reason?: string;
}

export interface WebhookRequest {
  rawBody: Buffer;
  headers: Record<string, string | undefined>;
  secret: string;
}

export interface PaymentGateway {
  readonly provider: PaymentProvider;

  createCheckout(creds: GatewayCredentials, input: OrderInput): Promise<CheckoutSession>;

  testConnection(creds: {
    keyId: string;
    keySecret: string;
    mode: PaymentMode;
  }): Promise<ConnectionCheck>;

  keyMatchesMode(keyId: string, mode: PaymentMode): boolean;

  parseWebhook(request: WebhookRequest): WebhookEvent | null;
}
