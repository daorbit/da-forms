import { Schema, model } from 'mongoose';

export interface CalendarConnectionDocument {
  workspaceId: string;
  connectedBy?: string;
  googleEmail: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  expiresAt: Date;
  scope: string;
  status: 'active' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

const calendarConnectionSchema = new Schema<CalendarConnectionDocument>(
  {
    workspaceId: { type: String, required: true },
    connectedBy: { type: String },
    googleEmail: { type: String, default: '' },
    accessTokenEnc: { type: String, required: true, select: false },
    refreshTokenEnc: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    scope: { type: String, default: '' },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  },
  { timestamps: true }
);

calendarConnectionSchema.index({ workspaceId: 1 }, { unique: true });

export const CalendarConnectionModel = model<CalendarConnectionDocument>(
  'CalendarConnection',
  calendarConnectionSchema
);
