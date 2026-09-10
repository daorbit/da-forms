import { Schema, model } from 'mongoose';

 
export type AppId = 'smtp' | 'brevo';

export type AppCategory = 'email' | 'notification' | 'crm' | 'automation';

export interface AppConnectionDocument {
  workspaceId: string;
  /** One of `AppId` at rest; typed as string so Mongoose query typings stay loose. */
  appId: string;
  /** Whether this connection is live. One email app is enabled at a time. */
  enabled: boolean;
  /**
   * Non-secret settings, stored and handed back as-is — host, port, from
   * address. What the connect form's plain fields collect.
   */
  config: Record<string, unknown>;
  /**
   * Encrypted values, one per secret field, keyed by the descriptor's field
   * key. Never returned; the API sends a masked tail instead.
   */
  secrets: Record<string, string>;
  /** Set on a successful test, cleared whenever a secret changes. */
  verifiedAt?: Date;
  /** Bumped fire-and-forget after a real send through this connection. */
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const appConnectionSchema = new Schema<AppConnectionDocument>(
  {
    workspaceId: { type: String, required: true, index: true },
    appId: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    // Mixed rather than a nested schema: the keys differ per app and are
    // policed by the catalog, not by Mongoose.
    config: { type: Schema.Types.Mixed, default: {} },
    secrets: { type: Schema.Types.Mixed, default: {} },
    verifiedAt: { type: Date },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

appConnectionSchema.index({ workspaceId: 1, appId: 1 }, { unique: true });

export const AppConnectionModel = model<AppConnectionDocument>(
  'AppConnection',
  appConnectionSchema
);
