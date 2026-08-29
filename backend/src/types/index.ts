export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export type { FieldType, FormField, FormDocument, PaymentConfig } from '../models/form.model.js';
export type {
  SubmissionDocument,
  SubmissionPayment,
  PaymentStatus,
} from '../models/submission.model.js';
export type {
  WorkspaceSettingsDocument,
  RazorpaySettings,
} from '../models/workspaceSettings.model.js';
