import type { PaymentProvider } from '../../models/workspaceSettings.model.js';
import type { PaymentGateway } from './types.js';
import { razorpayGateway } from './razorpay.gateway.js';
import { cashfreeGateway } from './cashfree.gateway.js';

const GATEWAYS: Record<PaymentProvider, PaymentGateway> = {
  razorpay: razorpayGateway,
  cashfree: cashfreeGateway,
};

export const PROVIDERS: PaymentProvider[] = ['razorpay', 'cashfree'];

export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  razorpay: 'Razorpay',
  cashfree: 'Cashfree',
};

export function isPaymentProvider(value: unknown): value is PaymentProvider {
  return typeof value === 'string' && value in GATEWAYS;
}

export function gatewayFor(provider: PaymentProvider): PaymentGateway {
  return GATEWAYS[provider];
}

export * from './types.js';
