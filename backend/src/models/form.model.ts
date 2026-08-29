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
  | 'numberRange'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multipleChoice'
  | 'country'
  | 'ranking'
  | 'date'
  | 'time'
  | 'datetime'
  | 'monthYear'
  | 'file'
  | 'imageUpload'
  | 'mediaUpload'
  | 'rating'
  | 'slider'
  | 'terms'
  | 'decisionBox'
  | 'yesNo'
  | 'signature'
  | 'payment'
  | 'matrix'
  | 'hidden'
  | 'uniqueId'
  | 'randomId'
  | 'heading'
  | 'description'
  | 'richText'
  | 'divider'
  | 'spacer'
  | 'pageBreak'
  | 'grid';

export type FieldSize = 'small' | 'medium' | 'large';

export type LabelPlacement = 'top' | 'left' | 'right';

export type SubmitButtonSize = 'small' | 'medium' | 'large';

export type SubmitButtonAlign = 'left' | 'center' | 'right';

export type SubmitButtonWidth = 25 | 50 | 75 | 100;

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
  /** A grid's columns, each holding its own fields. */
  columns?: FormField[][];
  /** A matrix's statements, one per row; the answer columns are `options`. */
  rows?: string[];
  /** The URL query parameter a hidden field takes its value from. */
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
 * Only ever read from the stored form — never from a submitted body. A
 * respondent who edits the request cannot change what they are billed, because
 * the amount is derived here and the client's copy is ignored outright.
 */
export type PaymentMode = 'fixed' | 'field' | 'modifiable';

export interface PaymentConfig {
  /**
   * - 'fixed': every respondent pays `amount`.
   * - 'field': the price is another field's answer — a number the respondent
   *   typed, or the value assigned to the choice they picked.
   * - 'modifiable': the respondent names their own price, within min/max.
   *   Donations and pay-what-you-want.
   */
  mode: PaymentMode;
  /** Minor units — paise, not rupees. Integers only, so nothing rounds twice. */
  amount?: number;
  currency: string;
  /** mode='field': the field whose answer is the price. */
  amountFieldId?: string;
  /**
   * mode='field' against a choice field: what each option is worth, in minor
   * units, keyed by the option's own text. An option missing from here is
   * worth nothing, which is a configuration mistake rather than a free item —
   * the builder flags it.
   */
  optionPrices?: Record<string, number>;
  /** mode='modifiable': the range the respondent may choose within. Minor units. */
  minAmount?: number;
  maxAmount?: number;
  /** mode='modifiable': what the box starts at. Minor units. */
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

export interface BackgroundLayer {
  image?: string;
  gradient?: string;
  size?: BackgroundSize;
  position?: BackgroundPosition;
  overlay?: string;
  overlayOpacity?: number;
  fixed?: boolean;
}

export type FontFamilyId = 'system' | 'inter' | 'serif' | 'mono' | 'rounded';

/** How a multi-step form shows the respondent where they are. */
export type StepIndicator = 'progress' | 'stepper' | 'dots' | 'counter' | 'none';

export interface FormStep {
  title?: string;
  description?: string;
}

export interface FormTheme {
  scope?: 'page' | 'card';
  pageBg?: string;
  pageBackground?: BackgroundLayer;
  cardBackground?: BackgroundLayer;
  cardRadius?: number;
  cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  cardOpacity?: number;
  cardBlur?: number;
  fontFamily?: FontFamilyId;
  cardBg?: string;
  cardBorder?: string;
  accentColor?: string;
  labelColor?: string;
  inputBg?: string;
  inputBorder?: string;
  inputTextColor?: string;
  textMode?: 'auto' | 'light' | 'dark';
}

export interface NotificationSettings {
  /** Confirmation email to whoever filled the form. */
  respondentEnabled?: boolean;
  /** Which field on the form holds the respondent's address — must be an 'email' field. */
  respondentEmailFieldId?: string;
  respondentSubject?: string;
  /**
   * Plain text. `{{Field Label}}` is replaced with that field's submitted
   * answer — matched by the field's current label, so it stays readable and
   * typeable by hand. Renaming the field afterward breaks the match silently.
   */
  respondentBody?: string;
  /** Which HTML layout the message is rendered into. See `EMAIL_LAYOUTS`. */
  respondentLayout?:
    | 'plain'
    | 'thankYou'
    | 'receipt'
    | 'nextSteps'
    | 'banner'
    | 'confirmation'
    | 'minimal'
    | 'hero';
  /** The button the 'nextSteps' layout renders. Ignored by every other layout. */
  respondentCtaLabel?: string;
  respondentCtaHref?: string;
  /** Alerts the form owner on every submission. */
  ownerEnabled?: boolean;
  ownerEmails?: string[];
  ownerSubject?: string;
}

export interface FormDocument {
  /** Set once at creation; shown in the forms list. Independent of the canvas header text below. */
  name: string;
  title: string;
  description?: string;
  workspaceId: string;
  fields: FormField[];
  status: 'draft' | 'published';
  redirectUrl?: string;
  thankYouMessage?: string;
  hideHeader?: boolean;
  labelPlacement?: LabelPlacement;
  submitLabel?: string;
  submitButtonSize?: SubmitButtonSize;
  submitButtonWidth?: SubmitButtonWidth;
  submitButtonAlign?: SubmitButtonAlign;
  /** Text alignment for the title/description block. */
  headerAlign?: SubmitButtonAlign;
  theme?: FormTheme;
  /** Per-page names for a multi-step form, indexed by page. */
  steps?: FormStep[];
  stepIndicator?: StepIndicator;
  showStepHeadings?: boolean;
  collectIp?: boolean;
  notifications?: NotificationSettings;
  /** Total public-page loads — the denominator for completion rate. */
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const fieldSchema = new Schema<FormField>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, default: '' },
    required: { type: Boolean, default: false },
    unique: { type: Boolean },
    hideLabel: { type: Boolean },
    instructions: { type: String },
    size: { type: String, enum: ['small', 'medium', 'large'] },
    placeholder: { type: String },
    hoverText: { type: String },
    initialValue: { type: String },
    helpText: { type: String },
    options: { type: [String], default: undefined },
    pattern: { type: String },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    maxLength: { type: Number },
    maxRating: { type: Number },
    content: { type: String },
    /*
     * Mixed because the shape is recursive: a column holds fields, and one of
     * those may itself be a grid. A subdocument schema cannot reference itself,
     * and the alternative — a flat list with parent pointers — moves the
     * nesting into every query that reads a form.
     */
    columns: { type: Schema.Types.Mixed },
    rows: { type: [String], default: undefined },
    paramName: { type: String },
    showIf: { type: Schema.Types.Mixed },
    pay: { type: Schema.Types.Mixed },
    customWidth: { type: Number },
    customHeight: { type: Number },
    cssClass: { type: String },
  },
  { _id: false }
);

const backgroundLayerSchema = new Schema<BackgroundLayer>(
  {
    image: { type: String },
    gradient: { type: String },
    size: { type: String, enum: ['cover', 'contain', 'repeat'] },
    position: { type: String },
    overlay: { type: String },
    overlayOpacity: { type: Number, min: 0, max: 100 },
    fixed: { type: Boolean },
  },
  { _id: false }
);

const stepSchema = new Schema<FormStep>(
  {
    title: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const formSchema = new Schema<FormDocument>(
  {
    name: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    workspaceId: { type: String, required: true, index: true },
    fields: { type: [fieldSchema], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    redirectUrl: { type: String },
    thankYouMessage: { type: String },
    hideHeader: { type: Boolean },
    headerAlign: { type: String, enum: ['left', 'center', 'right'] },
    labelPlacement: { type: String, enum: ['top', 'left', 'right'] },
    submitLabel: { type: String },
    submitButtonSize: { type: String, enum: ['small', 'medium', 'large'] },
    submitButtonWidth: { type: Number, enum: [25, 50, 75, 100] },
    submitButtonAlign: { type: String, enum: ['left', 'center', 'right'] },
    theme: {
      type: new Schema<FormTheme>(
        {
          scope: { type: String, enum: ['page', 'card'] },
          pageBg: { type: String },
          pageBackground: { type: backgroundLayerSchema },
          cardBackground: { type: backgroundLayerSchema },
          cardRadius: { type: Number, min: 0, max: 48 },
          cardShadow: { type: String, enum: ['none', 'sm', 'md', 'lg', 'xl'] },
          cardOpacity: { type: Number, min: 0, max: 100 },
          cardBlur: { type: Number, min: 0, max: 40 },
          fontFamily: { type: String, enum: ['system', 'inter', 'serif', 'mono', 'rounded'] },
          cardBg: { type: String },
          cardBorder: { type: String },
          accentColor: { type: String },
          labelColor: { type: String },
          inputBg: { type: String },
          inputBorder: { type: String },
          inputTextColor: { type: String },
          textMode: { type: String, enum: ['auto', 'light', 'dark'] },
        },
        { _id: false }
      ),
    },
    steps: { type: [stepSchema], default: undefined },
    stepIndicator: { type: String, enum: ['progress', 'stepper', 'dots', 'counter', 'none'] },
    showStepHeadings: { type: Boolean },
    collectIp: { type: Boolean },
    notifications: {
      type: new Schema<NotificationSettings>(
        {
          respondentEnabled: { type: Boolean },
          respondentEmailFieldId: { type: String },
          respondentSubject: { type: String },
          respondentBody: { type: String },
          respondentLayout: {
            type: String,
            enum: ['plain', 'thankYou', 'receipt', 'nextSteps', 'banner', 'confirmation', 'minimal', 'hero'],
          },
          respondentCtaLabel: { type: String },
          respondentCtaHref: { type: String },
          ownerEnabled: { type: Boolean },
          ownerEmails: { type: [String], default: undefined },
          ownerSubject: { type: String },
        },
        { _id: false }
      ),
    },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FormModel = model<FormDocument>('Form', formSchema);
