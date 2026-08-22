import { Schema, model } from 'mongoose';

export type FieldType =
  | 'name'
  | 'address'
  | 'phone'
  | 'email'
  | 'website'
  | 'text'
  | 'textarea'
  | 'regex'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'rating'
  | 'file';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  pattern?: string;
  min?: number;
  max?: number;
  maxRating?: number;
}

export interface FormDocument {
  title: string;
  description?: string;
  projectKey: string;
  fields: FormField[];
  status: 'draft' | 'published';
  redirectUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fieldSchema = new Schema<FormField>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, default: '' },
    required: { type: Boolean, default: false },
    placeholder: { type: String },
    helpText: { type: String },
    options: { type: [String], default: undefined },
    pattern: { type: String },
    min: { type: Number },
    max: { type: Number },
    maxRating: { type: Number },
  },
  { _id: false }
);

const formSchema = new Schema<FormDocument>(
  {
    title: { type: String, required: true },
    description: { type: String },
    projectKey: { type: String, required: true, index: true },
    fields: { type: [fieldSchema], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    redirectUrl: { type: String },
  },
  { timestamps: true }
);

export const FormModel = model<FormDocument>('Form', formSchema);
