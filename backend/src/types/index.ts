export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export type { FieldType, FormField, FormDocument } from '../models/form.model.js';
export type { SubmissionDocument } from '../models/submission.model.js';
