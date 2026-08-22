export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

export interface ApiError {
  error: string;
  message: string;
}

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

export interface Form {
  _id: string;
  title: string;
  description?: string;
  projectKey: string;
  fields: FormField[];
  status: 'draft' | 'published';
  redirectUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  formId: string;
  data: Record<string, string>;
  sourceUrl?: string;
  createdAt: string;
}
