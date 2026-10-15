import { Schema, model } from 'mongoose';

export interface SheetsConnectionDocument {
  workspaceId: string;
  connectedBy?: string;
  googleEmail: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  expiresAt: Date;
  scope: string;
  status: 'active' | 'revoked';
  lastUsedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sheetsConnectionSchema = new Schema<SheetsConnectionDocument>(
  {
    workspaceId: { type: String, required: true },
    connectedBy: { type: String },
    googleEmail: { type: String, default: '' },
    accessTokenEnc: { type: String, required: true, select: false },
    refreshTokenEnc: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    scope: { type: String, default: '' },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    lastUsedAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true }
);

sheetsConnectionSchema.index({ workspaceId: 1 }, { unique: true });

export const SheetsConnectionModel = model<SheetsConnectionDocument>('SheetsConnection', sheetsConnectionSchema);
