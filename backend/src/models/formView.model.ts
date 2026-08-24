import { Schema, model } from 'mongoose';

/**
 * One doc per (form, visitor) view within the dedup window. TTL-expires on
 * its own — a repeat view from the same fingerprint after expiry is a fresh
 * view again, which is the intended behavior, not a cleanup afterthought.
 */
export interface FormViewDocument {
  formId: string;
  fingerprint: string;
  createdAt: Date;
}

const VIEW_DEDUP_SECONDS = 30 * 60;

const formViewSchema = new Schema<FormViewDocument>({
  formId: { type: String, required: true },
  fingerprint: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: VIEW_DEDUP_SECONDS },
});

formViewSchema.index({ formId: 1, fingerprint: 1 }, { unique: true });

export const FormViewModel = model<FormViewDocument>('FormView', formViewSchema);
