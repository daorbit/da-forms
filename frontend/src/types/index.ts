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
  | 'pageBreak'
  // Layout — these hold other fields rather than collecting a value
  | 'grid';

export type FieldSize = 'small' | 'medium' | 'large';

export type LabelPlacement = 'top' | 'left' | 'right';

export type SubmitButtonSize = 'small' | 'medium' | 'large';

export type SubmitButtonWidth = 25 | 50 | 75 | 100;

export interface FormTheme {
  /** 'page' themes the full share-link page (Google Forms style); 'card' themes only the card, for embeds where the host page's own background should show through. */
  scope?: 'page' | 'card';
  /** Page background, behind the card. Only used when scope is 'page'. Hex, e.g. "#0f1115". */
  pageBg?: string;
  /** The form card's own background. */
  cardBg?: string;
  /** The form card's border. */
  cardBorder?: string;
  /** The submit button's color, and other interactive highlights across the form. */
  accentColor?: string;
  /** Field label text color. Falls back to the resolved body text color when unset. */
  labelColor?: string;
  /** Input/textarea/select field background. */
  inputBg?: string;
  /** Input/textarea/select field border. */
  inputBorder?: string;
  /** Text typed into input fields. Falls back to the resolved body text color when unset. */
  inputTextColor?: string;
  /** 'auto' picks light or dark text based on cardBg's luminance; 'light'/'dark' pin it manually. */
  textMode?: 'auto' | 'light' | 'dark';
}

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
  showIf?: ShowIfRule;
}

export type ShowIfOperator = 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty';

export interface ShowIfRule {
  fieldId: string;
  operator: ShowIfOperator;
  value?: string;
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
  submitButtonSize?: SubmitButtonSize;
  submitButtonWidth?: SubmitButtonWidth;
  theme?: FormTheme;
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
  read: boolean;
  starred: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
