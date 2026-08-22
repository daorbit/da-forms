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
  | 'spacer'
  // Layout — these hold other fields rather than collecting a value
  | 'grid';

export type FieldSize = 'small' | 'medium' | 'large';

export type LabelPlacement = 'top' | 'left' | 'right';

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
  /**
   * A grid's columns, each holding its own fields.
   *
   * Only `grid` fields carry this. Nesting a grid inside a grid is refused at
   * the drop site rather than by the type, which keeps the shape simple.
   */
  columns?: FormField[][];
}

export interface Form {
  _id: string;
  title: string;
  description?: string;
  workspaceId: string;
  fields: FormField[];
  status: 'draft' | 'published';
  redirectUrl?: string;
  thankYouMessage?: string;
  /** Hides the title/description block on the rendered form. */
  hideHeader?: boolean;
  /** Where each field's label sits relative to its input. */
  labelPlacement?: LabelPlacement;
  submitLabel?: string;
  /** Records the respondent's IP with each submission. Off by default. */
  collectIp?: boolean;
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
