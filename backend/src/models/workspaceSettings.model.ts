import { Schema, model } from 'mongoose';

export type PaymentProvider = 'razorpay' | 'cashfree' | 'payu';

export type RazorpayMode = 'test' | 'live';
export type PaymentMode = RazorpayMode;

export interface RazorpayKeyPair {
  keyId?: string;
  keySecretEnc?: string;
  webhookSecretEnc?: string;
}

export type PaymentKeyPair = RazorpayKeyPair;

export interface RazorpayAccountInfo {
  merchantId?: string;
  businessName?: string;
  verifiedAt?: Date;
}

export type PaymentAccountInfo = RazorpayAccountInfo;

export interface ProviderSettings {
  enabled?: boolean;
  mode?: PaymentMode;
  test?: PaymentKeyPair;
  live?: PaymentKeyPair;
  testAccount?: PaymentAccountInfo;
  liveAccount?: PaymentAccountInfo;
  lastChargeAt?: Date;
}

export type RazorpaySettings = ProviderSettings;

export interface WorkspaceSettingsDocument {
  workspaceId: string;
  razorpay?: ProviderSettings;
  cashfree?: ProviderSettings;
  payu?: ProviderSettings;
  defaultProvider?: PaymentProvider;

  webhookEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const keyPairSchema = new Schema<PaymentKeyPair>(
  {
    keyId: { type: String },
    keySecretEnc: { type: String },
    webhookSecretEnc: { type: String },
  },
  { _id: false }
);

const accountInfoSchema = new Schema<PaymentAccountInfo>(
  {
    merchantId: { type: String },
    businessName: { type: String },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const providerSchema = () =>
  new Schema<ProviderSettings>(
    {
      enabled: { type: Boolean },
      mode: { type: String, enum: ['test', 'live'], default: 'test' },
      test: { type: keyPairSchema },
      live: { type: keyPairSchema },
      testAccount: { type: accountInfoSchema },
      liveAccount: { type: accountInfoSchema },
      lastChargeAt: { type: Date },
    },
    { _id: false }
  );

const workspaceSettingsSchema = new Schema<WorkspaceSettingsDocument>(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    razorpay: { type: providerSchema() },
    cashfree: { type: providerSchema() },
    payu: { type: providerSchema() },
    defaultProvider: {
      type: String,
      enum: ['razorpay', 'cashfree', 'payu'],
      default: 'razorpay',
    },
    webhookEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const WorkspaceSettingsModel = model<WorkspaceSettingsDocument>(
  'WorkspaceSettings',
  workspaceSettingsSchema
);
