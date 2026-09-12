import { Schema, model } from 'mongoose';
import type { PaymentProvider } from './workspaceSettings.model.js';

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
  | 'dateRange'
  | 'timeRange'
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

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;

  unique?: boolean;
  hideLabel?: boolean;

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

  optionValues?: Record<string, number>;

  correctOptions?: string[];

  customWidth?: number;

  customHeight?: number;

  cssClass?: string;
}

export type PaymentMode = 'fixed' | 'field' | 'modifiable';

export interface PaymentConfig {

  mode: PaymentMode;
  provider?: PaymentProvider;

  amount?: number;
  currency: string;

  amountFieldId?: string;
  optionPrices?: Record<string, number>;

  minAmount?: number;
  maxAmount?: number;

  defaultAmount?: number;

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

  respondentEnabled?: boolean;

  respondentEmailFieldId?: string;
  respondentSubject?: string;

  respondentBody?: string;

  respondentLayout?:
    | 'plain'
    | 'thankYou'
    | 'receipt'
    | 'nextSteps'
    | 'banner'
    | 'confirmation'
    | 'minimal'
    | 'hero';

  respondentCtaLabel?: string;
  respondentCtaHref?: string;

  ownerEnabled?: boolean;
  ownerEmails?: string[];
  ownerSubject?: string;
}

export interface WebhookSettings {
  enabled?: boolean;
  url?: string;

  secretEnc?: string;

  lastStatus?: 'ok' | 'failed';
  lastAttemptAt?: Date;
  lastError?: string;
}

export interface FormSchedule {

  opensAt?: Date;

  closesAt?: Date;

  maxSubmissions?: number;

  closedMessage?: string;
}

export interface FormDocument {

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

  headerAlign?: SubmitButtonAlign;
  theme?: FormTheme;

  steps?: FormStep[];
  stepIndicator?: StepIndicator;
  showStepHeadings?: boolean;
  collectIp?: boolean;
  notifications?: NotificationSettings;
  webhook?: WebhookSettings;

  requireCaptcha?: boolean;

  collectPartials?: boolean;

  allowEdit?: boolean;

  schedule?: FormSchedule;

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

    columns: { type: Schema.Types.Mixed },
    subFields: { type: Schema.Types.Mixed },
    minRows: { type: Number, min: 0 },
    maxRows: { type: Number, min: 1 },
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
    webhook: {
      type: new Schema<WebhookSettings>(
        {
          enabled: { type: Boolean },
          url: { type: String },
          secretEnc: { type: String },
          lastStatus: { type: String, enum: ['ok', 'failed'] },
          lastAttemptAt: { type: Date },
          lastError: { type: String },
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
