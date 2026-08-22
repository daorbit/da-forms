import { Schema, model } from 'mongoose';

export type FieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
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
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: { type: [String], default: undefined },
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
