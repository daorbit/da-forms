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
  | 'numberRange'
  // Choices
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multipleChoice'
  | 'country'
  | 'ranking'
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
  | 'signature'
  // Payment — collects money rather than an answer
  | 'payment'
  // Survey
  | 'matrix'
  // Collected without being shown — a UTM tag, a passed-in id
  | 'hidden'
  // Identifier
  | 'uniqueId'
  | 'randomId'
  // Page elements
  | 'heading'
  | 'description'
  | 'richText'
  | 'divider'
  | 'spacer'
  | 'pageBreak'
  // Layout — these hold other fields rather than collecting a value
  | 'grid';

export type FieldSize = 'small' | 'medium' | 'large';

export type LabelPlacement = 'top' | 'left' | 'right';

export type SubmitButtonSize = 'small' | 'medium' | 'large';

export type SubmitButtonAlign = 'left' | 'center' | 'right';

export type SubmitButtonWidth = 25 | 50 | 75 | 100;

export type BackgroundSize = 'cover' | 'contain' | 'repeat';

export type BackgroundPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top left'
  | 'top right'
  | 'bottom left'
  | 'bottom right';

/** A form's background layer — used for both the page behind the card and the card itself. */
export interface BackgroundLayer {
  /** Image URL. Takes precedence over `gradient`, which takes precedence over the plain color. */
  image?: string;
  /** Full CSS gradient value, e.g. "linear-gradient(135deg, #4c6ef5, #15aabf)". */
  gradient?: string;
  size?: BackgroundSize;
  position?: BackgroundPosition;
  /** Color laid over the image at `overlayOpacity` — what keeps text readable on a busy photo. */
  overlay?: string;
  /** Strength of `overlay`, 0–100. */
  overlayOpacity?: number;
  /** Keeps the image fixed while the page scrolls. Page layer only. */
  fixed?: boolean;
}

export type FontFamilyId = 'system' | 'inter' | 'serif' | 'mono' | 'rounded';

export interface FormTheme {
  /** 'page' themes the full share-link page (Google Forms style); 'card' themes only the card, for embeds where the host page's own background should show through. */
  scope?: 'page' | 'card';
  /** Page background, behind the card. Only used when scope is 'page'. Hex, e.g. "#0f1115". */
  pageBg?: string;
  /** Image/gradient layer painted over `pageBg`. Only used when scope is 'page'. */
  pageBackground?: BackgroundLayer;
  /** Image/gradient layer painted over `cardBg`. */
  cardBackground?: BackgroundLayer;
  /** Card corner radius in px. */
  cardRadius?: number;
  /** Card drop shadow depth. */
  cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Card translucency, 0–100. Below 100 the page background shows through the card. */
  cardOpacity?: number;
  /** Backdrop blur behind a translucent card, in px — the frosted-glass look. */
  cardBlur?: number;
  /** Font used across the whole form. */
  fontFamily?: FontFamilyId;
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

/** How a multi-step form shows the respondent where they are. */
export type StepIndicator = 'progress' | 'stepper' | 'dots' | 'counter' | 'none';

export interface FormStep {
  /** Shown as the step's name in the stepper, and above the step's fields. */
  title?: string;
  /** Sub-line under the title. */
  description?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  /** Rejects a submission whose answer for this field matches an existing one for the same form. */
  unique?: boolean;
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
  /**
   * A matrix's statements, one per row. The shared answer choices live in
   * `options`, so a matrix is rows × options.
   */
  rows?: string[];
  /**
   * Where a hidden field takes its value from: a URL query parameter of this
   * name. Falls back to `initialValue` when the parameter is absent.
   */
  paramName?: string;
  showIf?: ShowIfRule;
  /** Payment fields only: what this field charges. */
  pay?: PaymentConfig;
  /** Pixel width, overriding the size preset outright. */
  customWidth?: number;
  /** Pixel height for this field's input, e.g. a taller text area. */
  customHeight?: number;
  /** Extra class name applied to the field's own input, for power-user styling. */
  cssClass?: string;
}

/**
 * What a payment field charges.
 *
 * The amount here is what the builder shows and what the server re-derives at
 * submit time. The browser's copy is display only — the charge is computed
 * again from the stored form, so editing this client-side changes nothing.
 */
export type PaymentMode = 'fixed' | 'field' | 'modifiable';

export interface PaymentConfig {
  /**
   * - 'fixed': every respondent pays `amount`.
   * - 'field': the price is another field's answer — a number typed, or the
   *   value assigned to the choice picked.
   * - 'modifiable': the respondent names their own price, within min/max.
   */
  mode: PaymentMode;
  /** Minor units — paise, not rupees. */
  amount?: number;
  currency: string;
  /** mode='field': the field whose answer is the price. */
  amountFieldId?: string;
  /** mode='field' against a choice field: what each option is worth, keyed by option text. */
  optionPrices?: Record<string, number>;
  /** mode='modifiable': the range the respondent may choose within. Minor units. */
  minAmount?: number;
  maxAmount?: number;
  defaultAmount?: number;
  /** Shown on the Razorpay checkout. Falls back to the form's title. */
  description?: string;
  buttonLabel?: string;
}

export type ShowIfOperator = 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty';

export interface ShowIfRule {
  fieldId: string;
  operator: ShowIfOperator;
  value?: string;
}

export interface Form {
  _id: string;
  /** Set once at creation; shown in the forms list. Independent of the canvas header text below. */
  name: string;
  title: string;
  description?: string;
  workspaceId: string;
  fields: FormField[];
  status: 'draft' | 'published';
  redirectUrl?: string;
  thankYouMessage?: string;
  /** Hides the title/description block on the rendered form. */
  hideHeader?: boolean;
  /** Text alignment for the title/description block. */
  headerAlign?: SubmitButtonAlign;
  /** Where each field's label sits relative to its input. */
  labelPlacement?: LabelPlacement;
  submitLabel?: string;
  submitButtonSize?: SubmitButtonSize;
  submitButtonWidth?: SubmitButtonWidth;
  submitButtonAlign?: SubmitButtonAlign;
  theme?: FormTheme;
  /**
   * Per-page names for a multi-step form, indexed by page — `steps[0]` names
   * the first page, which has no `pageBreak` of its own to hang a name on.
   * Longer or shorter than the actual page count is fine; extras are ignored
   * and missing entries fall back to "Step N".
   */
  steps?: FormStep[];
  /** Which progress indicator a multi-step form shows. Defaults to 'progress'. */
  stepIndicator?: StepIndicator;
  /** Shows the step title/description block above each page's fields. */
  showStepHeadings?: boolean;
  /** Records the respondent's IP with each submission. Off by default. */
  collectIp?: boolean;
  notifications?: NotificationSettings;
  createdAt: string;
  updatedAt: string;
}

/** Defined with the renderer that implements each one, so the two cannot drift. */
import type { EmailLayout } from '@/lib/emailTemplates';
export type { EmailLayout };

export interface NotificationSettings {
  /** Confirmation email to whoever filled the form. */
  respondentEnabled?: boolean;
  /** Which field holds the respondent's address — must be an 'email' field. */
  respondentEmailFieldId?: string;
  respondentSubject?: string;
  /** Plain text; `{{Field Label}}` is replaced with that field's submitted answer. */
  respondentBody?: string;
  /** Which HTML layout the message is rendered into. */
  respondentLayout?: EmailLayout;
  /** The button the 'nextSteps' layout renders. Ignored by every other layout. */
  respondentCtaLabel?: string;
  respondentCtaHref?: string;
  /** Alerts these addresses on every submission. */
  ownerEnabled?: boolean;
  ownerEmails?: string[];
  ownerSubject?: string;
}

export interface SubmissionPayment {
  provider: 'razorpay';
  orderId: string;
  paymentId?: string;
  /** Minor units. */
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  paidAt?: string;
  /**
   * Who Razorpay says paid. Captured because a form that collects no contact
   * details would otherwise leave a payment that cannot be matched to a person.
   */
  payerEmail?: string;
  payerContact?: string;
  /** card, upi, netbanking — whatever they used. */
  method?: string;
}

export interface Submission {
  _id: string;
  formId: string;
  data: Record<string, string>;
  /** Byte size of each uploaded file/image/media answer, keyed by field id.
   *  Read off Cloudinary's own upload response, not always present (older
   *  submissions predate this, or a value came from a link rather than
   *  a real upload). */
  fileMeta?: Record<string, { bytes: number }>;
  sourceUrl?: string;
  /** Anything the Entries page can see is 'complete' — pending rows are filtered server-side. */
  status?: 'complete' | 'pending_payment';
  payment?: SubmissionPayment;
  read: boolean;
  starred: boolean;
  createdAt: string;
}

/**
 * What a paid form answers with instead of a submission: everything the
 * browser needs to open Razorpay checkout. The amount is the server's figure,
 * not the one the page calculated.
 */
export interface PaymentRequired {
  paymentRequired: true;
  submissionId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
}

export type RazorpayMode = 'test' | 'live';

/** One mode's credentials, with secrets reduced to masks. */
export interface KeyPairView {
  /** Masked — a prefix and a tail, enough to recognise which key is saved. */
  keyId?: string;
  /** Whether a key is saved at all, since `keyId` above is only a fragment. */
  hasKeyId?: boolean;
  keySecretMask?: string;
  webhookSecretMask?: string;
  merchantId?: string;
  businessName?: string;
  verifiedAt?: string;
}

export interface ChecklistItem {
  id: 'keys' | 'verified' | 'webhook' | 'enabled' | 'charged';
  label: string;
  done: boolean;
  hint?: string;
}

/** The workspace's Razorpay connection. Test and live keys are kept separately. */
export interface PaymentSettings {
  enabled: boolean;
  mode: RazorpayMode;
  test: KeyPairView;
  live: KeyPairView;
  lastChargeAt?: string;
  /** False when the server has no ENCRYPTION_KEY — nothing can be saved. */
  configurable: boolean;
  /** What is still outstanding before this workspace can take a payment. */
  checklist: ChecklistItem[];
}

export interface ConnectionTestResult {
  ok: boolean;
  merchantId?: string;
  businessName?: string;
  message?: string;
  settings: PaymentSettings;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
