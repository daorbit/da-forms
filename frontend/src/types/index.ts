export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export type FieldType =
  // Basic Info
  | 'name'
  | 'address'
  | 'phone'
  | 'email'
  | 'website'
  // Textbox
  | 'text'
  | 'textarea'
  | 'regex'
  // Number
  | 'number'
  | 'decimal'
  | 'currency'
  // Choices
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multipleChoice'
  // Date & Time
  | 'date'
  | 'time'
  | 'datetime'
  | 'monthYear'
  // Uploads
  | 'file'
  | 'imageUpload'
  | 'mediaUpload'
  // Rating scales
  | 'rating'
  | 'slider'
  // Legal & consent
  | 'terms'
  | 'decisionBox'
  | 'yesNo'
  // Identifier
  | 'uniqueId'
  | 'randomId'
  // Page elements
  | 'heading'
  | 'description'
  | 'divider'
  | 'spacer';

export type FieldSize = 'small' | 'medium' | 'large';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  hideLabel?: boolean;
  instructions?: string;
  size?: FieldSize;
  placeholder?: string;
  hoverText?: string;
  initialValue?: string;
  helpText?: string;
  options?: string[];
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  maxRating?: number;
  content?: string;
}

export interface Form {
  _id: string;
  title: string;
  description?: string;
  projectKey: string;
  fields: FormField[];
  status: 'draft' | 'published';
  redirectUrl?: string;
  thankYouMessage?: string;
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
