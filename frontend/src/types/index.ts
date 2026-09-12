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
  | 'chips'
  | 'country'
  | 'ranking'
  // Date & Time
  | 'date'
  | 'time'
  | 'datetime'
  | 'monthYear'
  | 'dateRange'
  | 'timeRange'
  // Uploads
  | 'file'
  | 'imageUpload'
  | 'mediaUpload'
  | 'rating'
  | 'slider'
  | 'nps'
  | 'likert'
  | 'terms'
  | 'decisionBox'
  | 'yesNo'
  | 'signature'
  | 'payment'
  | 'matrix'
  | 'calculated'
  | 'hidden'
  | 'uniqueId'
  | 'randomId'
  | 'heading'
  | 'description'
  | 'richText'
  | 'divider'
  | 'spacer'
  | 'pageBreak'
  | 'grid'
  | 'repeater';

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
  /** Chip fields only: lets the respondent pick more than one option. Off means single-select. */
  allowMultiple?: boolean;
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
  subFields?: FormField[];
  minRows?: number;
  maxRows?: number;
  rows?: string[];
  paramName?: string;
  showIf?: ShowIfRule;
  pay?: PaymentConfig;
  formula?: string;
  formulaFormat?: 'number' | 'currency';
  formulaCurrency?: string;
  formulaPrecision?: number;
  /** What each option is worth, keyed by the option's own text. */
  optionValues?: Record<string, number>;
  /** Which options are correct, by their own text. Presence makes it a question. */
  correctOptions?: string[];
  customWidth?: number;
  /** Pixel height for this field's input, e.g. a taller text area. */
  customHeight?: number;
  cssClass?: string;
}

 
export type PaymentMode = 'fixed' | 'field' | 'modifiable';

export interface PaymentConfig {
  /**
   * - 'fixed': every respondent pays `amount`.
   * - 'field': the price is another field's answer — a number typed, or the
   *   value assigned to the choice picked.
   * - 'modifiable': the respondent names their own price, within min/max.
   */
  mode: PaymentMode;
  /** Which gateway charges this form. Unset means the workspace default. */
  provider?: PaymentProvider;
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
  webhook?: WebhookSettings;
  /** Puts a Turnstile challenge in front of submitting. Off by default. */
  requireCaptcha?: boolean;
  /**
   * Saves answers as they are typed, so an abandoned form still says where it
   * lost people. Off by default — it stores what someone chose not to send.
   */
  collectPartials?: boolean;
  /** Lets a respondent change their answers from a link in their email. */
  allowEdit?: boolean;
  /** When this form accepts responses. Absent means always, once published. */
  schedule?: FormSchedule;
  /**
   * Why the form is closed right now, computed server-side and sent with the
   * public form. Absent on the editor's own fetch.
   */
  availability?: Availability;
  /**
   * Set on the public form when its gateway needs a phone number and no field
   * on the form collects one — the renderer then asks for it beside the pay
   * button. Server-derived; never stored on the form itself.
   */
  needsPayerPhone?: boolean;
  /**
   * Who the respondent is dealing with. Only set on the public form — the
   * builder has no use for it, and it is resolved per request rather than
   * stored on the form.
   */
  branding?: FormBranding;
  createdAt: string;
  updatedAt: string;
}

export interface FormSchedule {
  /** ISO dates — the API's own format, parsed only where one is displayed. */
  opensAt?: string;
  closesAt?: string;
  maxSubmissions?: number;
  closedMessage?: string;
}

export type ClosedReason = 'notPublished' | 'notYetOpen' | 'closed' | 'full';

export interface Availability {
  open: boolean;
  reason?: ClosedReason;
  /** Already resolved server-side: the owner's wording, or a default. */
  message?: string;
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

/**
 * One POST per submission to a URL the owner supplies — the generic
 * integration surface. `secret` is write-only: sent when setting or changing
 * it, never read back. `hasSecret` is what the settings page checks instead.
 */
export interface WebhookSettings {
  enabled?: boolean;
  url?: string;
  /** Write-only; the server encrypts it and never returns it. */
  secret?: string;
  /** True once a secret has been saved — the UI's "leave blank to keep it" cue. */
  hasSecret?: boolean;
  lastStatus?: 'ok' | 'failed';
  lastAttemptAt?: string;
  lastError?: string;
}

export interface SubmissionPayment {
  provider: PaymentProvider;
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
 
  fileMeta?: Record<string, { bytes: number }>;
  sourceUrl?: string;
  status?: 'complete' | 'pending_payment';
  payment?: SubmissionPayment;
 
  quiz?: { score: number; total: number; correct: number; questions: number };
  read: boolean;
  starred: boolean;
  createdAt: string;
}

 
export interface PaymentRequired {
  paymentRequired: true;
  provider: PaymentProvider;
  mode: RazorpayMode;
  submissionId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  paymentSessionId?: string;
  /**
   * Set only by a gateway with no checkout window of its own. PayU is reached
   * by posting `redirectFields` to `redirectUrl`, which takes the respondent
   * off this page and brings them back when the payment is done.
   */
  redirectUrl?: string;
  redirectFields?: Record<string, string>;
  description: string;
  /**
   * Whose name and logo the payment window carries. Resolved by Quantalog
   * against the workspace's plan, so this is already what should be shown.
   * Razorpay renders them; Cashfree's hosted window takes its branding from
   * their own dashboard and ignores these.
   */
  brandName?: string;
  brandLogo?: string;
  brandAccent?: string;
}

/**
 * How a workspace presents itself on its public form.
 *
 * Sent with the form rather than fetched separately, so the caption and the
 * name render on first paint instead of appearing a moment later.
 */
export interface FormBranding {
  name: string;
  logoUrl?: string;
  accentColor?: string;
  showPoweredBy: boolean;
  poweredByLabel: string;
}

export type PaymentProvider = 'razorpay' | 'cashfree' | 'payu';

export type RazorpayMode = 'test' | 'live';

export type PaymentGatewayMode = RazorpayMode;

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

/** One gateway's connection. Test and live keys are kept separately. */
export interface ProviderSettings {
  provider: PaymentProvider;
  label: string;
  enabled: boolean;
  mode: RazorpayMode;
  test: KeyPairView;
  live: KeyPairView;
  lastChargeAt?: string;
  checklist: ChecklistItem[];
}

 
export interface PaymentSettings {
  defaultProvider: PaymentProvider;
  providers: Record<PaymentProvider, ProviderSettings>;
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

/* ---- App connections (third-party integrations) ---- */

export type AppFieldType = 'text' | 'number' | 'password' | 'boolean' | 'email';

export interface AppField {
  key: string;
  label: string;
  type: AppFieldType;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  help?: string;
  default?: string | number | boolean;
}

/** One card on the integrations page: the app's description plus this workspace's state. */
export interface AppCard {
  id: string;
  name: string;
  category: 'email' | 'notification' | 'crm' | 'automation';
  description: string;
  docsUrl?: string;
  testable: boolean;
  fields: AppField[];
  connected: boolean;
  enabled: boolean;
  verifiedAt?: string;
  lastUsedAt?: string;
  /** Plain config values as stored. */
  config: Record<string, unknown>;
  /** One `••••1234` per saved secret field; absent keys are unset. */
  secrets: Record<string, string>;
}

export interface AppTestResult {
  ok: boolean;
  message: string;
  app: AppCard;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
