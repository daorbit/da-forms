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
  | 'chips'
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
  /** Chip fields only: lets the respondent pick more than one option. */
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
  /** A grid's columns, each holding its own fields. */
  columns?: FormField[][];
  /** A matrix's statements, one per row; the answer columns are `options`. */
  rows?: string[];
  /** The URL query parameter a hidden field takes its value from. */
  paramName?: string;
  showIf?: ShowIfRule;
  /** Payment fields only: what this field charges. */
  pay?: PaymentConfig;
  /**
   * Calculated fields only: the arithmetic, written over other fields by their
   * labels — `{{Quantity}} * {{Unit price}}`.
   *
   * Recomputed server-side on submit rather than stored from what the browser
   * sent. The displayed value is a convenience; the stored one has to be
   * derived, for the same reason a payment amount is — a respondent who edits
   * the request must not be able to name their own total.
   */
  formula?: string;
  /** How the result is shown: a bare number, or money with the currency below. */
  formulaFormat?: 'number' | 'currency';
  formulaCurrency?: string;
  /** Decimal places in the displayed result. Defaults to 2 for currency, 0 otherwise. */
  formulaPrecision?: number;
  /**
   * What each option of a choice field is worth, keyed by the option's own
   * text.
   *
   * Shared by two features that turned out to want the same thing: a price
   * formula that treats "Large" as 500, and a quiz that treats it as 1 mark.
   * An option missing from here is worth nothing.
   */
  optionValues?: Record<string, number>;
  /**
   * Quiz fields only: which options are correct, by their own text.
   *
   * Separate from `optionValues` because "worth 5 marks" and "is the right
   * answer" are different claims — a partial-credit question has several
   * options worth something and only one that is right.
   */
  correctOptions?: string[];
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

/**
 * When a published form actually accepts responses.
 *
 * Separate from `status` because the two answer different questions: `status`
 * is whether the owner has finished building it, this is whether the window is
 * open. A registration that closes on Friday is published the whole time — it
 * just stops taking answers — and collapsing that into `status: 'draft'` would
 * mean the owner's own list showed it as unfinished work.
 *
 * Every bound is optional and absent means "no bound", so a form with no
 * schedule behaves exactly as it did before this existed.
 */
export interface FormSchedule {
  /** Nothing is accepted before this instant. */
  opensAt?: Date;
  /** Nothing is accepted from this instant on. */
  closesAt?: Date;
  /**
   * Stops accepting once this many complete responses exist.
   *
   * Counted server-side at submit time rather than tracked as a running total:
   * a counter and the rows it claims to count drift apart the first time a
   * response is deleted, and the owner deleting spam should get their slots
   * back.
   */
  maxSubmissions?: number;
  /** Shown in place of the form once any bound above has closed it. */
  closedMessage?: string;
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
  /**
   * Puts a Turnstile challenge in front of this form's submit.
   *
   * Per-form rather than global because the challenge costs a real respondent
   * something — a widget to wait on, and a hard failure for anyone whose
   * browser Cloudflare dislikes. A low-traffic contact form does not need that;
   * a public form that charges money does.
   */
  requireCaptcha?: boolean;
  /**
   * Saves answers as they are typed, so a form abandoned halfway still says
   * where it lost people.
   *
   * Off unless the owner turns it on, and deliberately not defaulted on for
   * existing forms: this stores what someone typed and then chose not to send,
   * which is a different promise from the one their respondents were made when
   * the form was published. Whether that is acceptable depends on what the form
   * asks for and what the owner told people — so it is their decision, not a
   * default.
   */
  collectPartials?: boolean;
  /**
   * Lets a respondent reopen and change what they sent, via a signed link in
   * their confirmation email.
   *
   * Off by default, because for a good number of forms an answer that can
   * change afterwards is worse than one that cannot — an application, a vote, a
   * signed agreement. The forms that want it (a booking, a profile, a long
   * survey someone got halfway through) want it badly, so it is a switch rather
   * than a policy.
   */
  allowEdit?: boolean;
  /** When this form accepts responses. Absent means always, once published. */
  schedule?: FormSchedule;
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
    allowMultiple: { type: Boolean },
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
    formula: { type: String },
    formulaFormat: { type: String, enum: ['number', 'currency'] },
    formulaCurrency: { type: String },
    formulaPrecision: { type: Number, min: 0, max: 6 },
    optionValues: { type: Schema.Types.Mixed },
    correctOptions: { type: [String], default: undefined },
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
    requireCaptcha: { type: Boolean },
    collectPartials: { type: Boolean },
    allowEdit: { type: Boolean },
    schedule: {
      type: new Schema<FormSchedule>(
        {
          opensAt: { type: Date },
          closesAt: { type: Date },
          maxSubmissions: { type: Number, min: 1 },
          closedMessage: { type: String },
        },
        { _id: false }
      ),
    },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FormModel = model<FormDocument>('Form', formSchema);
