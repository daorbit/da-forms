export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export type FieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
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
