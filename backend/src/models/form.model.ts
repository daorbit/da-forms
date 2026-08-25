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
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multipleChoice'
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
  | 'uniqueId'
  | 'randomId'
  | 'heading'
  | 'description'
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
  showIf?: ShowIfRule;
  /** Pixel width, overriding the size preset outright. */
  customWidth?: number;
  /** Pixel height for this field's input, e.g. a taller text area. */
  customHeight?: number;
  /** Extra class name applied to the field's own input, for power-user styling. */
  cssClass?: string;
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
    showIf: { type: Schema.Types.Mixed },
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
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FormModel = model<FormDocument>('Form', formSchema);
