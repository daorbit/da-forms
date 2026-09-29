import type { FieldType, FormField } from '@/types';
import {
  ArrowDownWideNarrowIcon,
  BinaryIcon,
  BookOpenIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CalendarIcon,
  CalendarRangeIcon,
  CaseSensitiveIcon,
  ChevronsUpDownIcon,
  CircleDotIcon,
  Clock4Icon,
  ClockIcon,
  Columns2Icon,
  Columns3Icon,
  ContactIcon,
  CreditCardIcon,
  DecimalsArrowRightIcon,
  DicesIcon,
  DollarSignIcon,
  EyeOffIcon,
  FileBadgeIcon,
  FileTextIcon,
  FileUpIcon,
  FlagIcon,
  GaugeIcon,
  GlobeIcon,
  HashIcon,
  HeadingIcon,
  ImageUpIcon,
  ListChecksIcon,
  MailIcon,
  MinusIcon,
  MoveHorizontalIcon,
  MoveVerticalIcon,
  PhoneIcon,
  RegexIcon,
  Rows3Icon,
  SignatureIcon,
  SlidersHorizontalIcon,
  SmileIcon,
  SquareCheckBigIcon,
  SquareCheckIcon,
  SquareFunctionIcon,
  SquareIcon,
  StarIcon,
  TableIcon,
  TagsIcon,
  TextAlignStartIcon,
  TypeIcon,
  UserIcon,
  VideoIcon,
  type LucideIcon,
} from 'lucide-react';

export interface PaletteItem {
  type: FieldType;
  label: string;
  icon: LucideIcon;
  color: string;
  /** Grid tiles only: how many columns the dropped grid starts with. */
  columns?: number;
}

export interface PaletteGroup {
  group: string;
  items: PaletteItem[];
}

export const fieldPalette: PaletteGroup[] = [
  {
    group: 'Grid',
    items: [
      { type: 'grid', label: '1-Column', icon: SquareIcon, color: 'orange', columns: 1 },
      { type: 'grid', label: '2-Column', icon: Columns2Icon, color: 'orange', columns: 2 },
      { type: 'grid', label: '3-Column', icon: Columns3Icon, color: 'orange', columns: 3 },
    ],
  },
  {
    group: 'Basic Info',
    items: [
      { type: 'name', label: 'Name', icon: UserIcon, color: 'teal' },
      { type: 'address', label: 'Address', icon: ContactIcon, color: 'teal' },
      { type: 'phone', label: 'Phone', icon: PhoneIcon, color: 'teal' },
      { type: 'email', label: 'Email', icon: MailIcon, color: 'teal' },
      { type: 'website', label: 'Website', icon: GlobeIcon, color: 'teal' },
    ],
  },
  {
    group: 'Textbox',
    items: [
      { type: 'text', label: 'Single Line', icon: CaseSensitiveIcon, color: 'blue' },
      { type: 'textarea', label: 'Multi Line', icon: TextAlignStartIcon, color: 'blue' },
      { type: 'regex', label: 'Regex', icon: RegexIcon, color: 'blue' },
    ],
  },
  {
    group: 'Number',
    items: [
      { type: 'number', label: 'Number', icon: BinaryIcon, color: 'violet' },
      { type: 'decimal', label: 'Decimal', icon: DecimalsArrowRightIcon, color: 'violet' },
      { type: 'currency', label: 'Currency', icon: DollarSignIcon, color: 'violet' },
      { type: 'numberRange', label: 'Range', icon: MoveHorizontalIcon, color: 'violet' },
    ],
  },
  {
    group: 'Choices',
    items: [
      { type: 'select', label: 'Dropdown', icon: ChevronsUpDownIcon, color: 'cyan' },
      { type: 'radio', label: 'Radio', icon: CircleDotIcon, color: 'cyan' },
      { type: 'checkbox', label: 'Checkbox', icon: SquareCheckIcon, color: 'cyan' },
      { type: 'multipleChoice', label: 'Multi Choice', icon: ListChecksIcon, color: 'cyan' },
      { type: 'chips', label: 'Chips', icon: TagsIcon, color: 'cyan' },
      { type: 'country', label: 'Country', icon: FlagIcon, color: 'cyan' },
      { type: 'ranking', label: 'Ranking', icon: ArrowDownWideNarrowIcon, color: 'cyan' },
    ],
  },
  {
    group: 'Date & Time',
    items: [
      { type: 'date', label: 'Date', icon: CalendarIcon, color: 'orange' },
      { type: 'time', label: 'Time', icon: ClockIcon, color: 'orange' },
      { type: 'datetime', label: 'Date-Time', icon: CalendarClockIcon, color: 'orange' },
      { type: 'monthYear', label: 'Month-Year', icon: CalendarDaysIcon, color: 'orange' },
      { type: 'dateRange', label: 'Date Range', icon: CalendarRangeIcon, color: 'orange' },
      { type: 'timeRange', label: 'Time Range', icon: Clock4Icon, color: 'orange' },
    ],
  },
  {
    group: 'Uploads',
    items: [
      { type: 'file', label: 'File', icon: FileUpIcon, color: 'green' },
      { type: 'imageUpload', label: 'Image', icon: ImageUpIcon, color: 'green' },
      { type: 'mediaUpload', label: 'Audio/Video', icon: VideoIcon, color: 'green' },
    ],
  },
  {
    group: 'Rating Scales',
    items: [
      { type: 'rating', label: 'Rating', icon: StarIcon, color: 'pink' },
      { type: 'slider', label: 'Slider', icon: SlidersHorizontalIcon, color: 'pink' },
      { type: 'nps', label: 'NPS', icon: GaugeIcon, color: 'pink' },
      { type: 'likert', label: 'Likert', icon: SmileIcon, color: 'pink' },
    ],
  },
  {
    group: 'Legal & Consent',
    items: [
      { type: 'terms', label: 'Terms', icon: FileBadgeIcon, color: 'grape' },
      { type: 'decisionBox', label: 'Decision', icon: SquareCheckBigIcon, color: 'grape' },
      { type: 'yesNo', label: 'Yes/No', icon: SquareCheckIcon, color: 'grape' },
      { type: 'signature', label: 'Signature', icon: SignatureIcon, color: 'grape' },
    ],
  },
  {
    group: 'Payment',
    items: [{ type: 'payment', label: 'Payment', icon: CreditCardIcon, color: 'lime' }],
  },
  {
    group: 'Survey',
    items: [{ type: 'matrix', label: 'Matrix', icon: TableIcon, color: 'cyan' }],
  },
  {
    group: 'Repeating',
    items: [{ type: 'repeater', label: 'Repeating Group', icon: Rows3Icon, color: 'orange' }],
  },
  {
    group: 'Calculation',
    items: [
      { type: 'calculated', label: 'Calculated', icon: SquareFunctionIcon, color: 'violet' },
    ],
  },
  {
    group: 'Identifier',
    items: [
      { type: 'uniqueId', label: 'Unique ID', icon: HashIcon, color: 'red' },
      { type: 'randomId', label: 'Random ID', icon: DicesIcon, color: 'red' },
      { type: 'hidden', label: 'Hidden', icon: EyeOffIcon, color: 'red' },
    ],
  },
  {
    group: 'Page Elements',
    items: [
      { type: 'heading', label: 'Heading', icon: HeadingIcon, color: 'indigo' },
      { type: 'description', label: 'Description', icon: TypeIcon, color: 'indigo' },
      { type: 'richText', label: 'Rich Text', icon: FileTextIcon, color: 'indigo' },
      { type: 'divider', label: 'Divider', icon: MinusIcon, color: 'indigo' },
      { type: 'spacer', label: 'Spacer', icon: MoveVerticalIcon, color: 'indigo' },
      { type: 'pageBreak', label: 'Page Break', icon: BookOpenIcon, color: 'indigo' },
    ],
  },
];

 
export function paletteKey(item: PaletteItem): string {
  return item.columns ? `${item.type}-${item.columns}` : item.type;
}

export const paletteByKey = Object.fromEntries(
  fieldPalette.flatMap((g) => g.items).map((item) => [paletteKey(item), item])
) as Record<string, PaletteItem>;

/** The first tile for a type, for reading a field's icon and label back. */
export const paletteByType = Object.fromEntries(
  fieldPalette
    .flatMap((g) => g.items)
    .map((item) => [item.type, item])
    .reverse()
) as Record<FieldType, PaletteItem>;

/** Layout-only elements: no label column, no value collected. */
export const staticTypes: FieldType[] = [
  'heading', 'description', 'richText', 'divider', 'spacer', 'pageBreak',
];

export const optionTypes: FieldType[] = [
  'select', 'radio', 'checkbox', 'multipleChoice', 'chips', 'matrix', 'ranking', 'likert',
];
 
export const repeaterSubTypes: FieldType[] = [
  'text', 'textarea', 'number', 'decimal', 'currency',
  'email', 'phone', 'website', 'date', 'dateRange', 'select', 'radio', 'checkbox', 'yesNo',
];

export const numericTypes: FieldType[] = ['number', 'decimal', 'currency', 'slider', 'numberRange'];

export const fileTypes: FieldType[] = ['file', 'imageUpload', 'mediaUpload'];
 
export const uploadedTypes: FieldType[] = [...fileTypes, 'signature'];

 
const fileMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];
export const fileAccept = fileMimeTypes.join(',');

export function acceptFor(type: FieldType): string | undefined {
  if (type === 'imageUpload') return 'image/*';
  if (type === 'mediaUpload') return 'audio/*,video/*';
  if (type === 'file') return fileAccept;
  return undefined;
}

export const textTypes: FieldType[] = [
  'name',
  'address',
  'phone',
  'email',
  'website',
  'text',
  'textarea',
  'regex',
];

export function makeField(type: FieldType, columns?: number): FormField {
  const field: FormField = {
    id: crypto.randomUUID(),
    type,
    label: paletteByType[type].label,
    required: false,
    size: 'large',
  };
  if (type === 'grid') {
    field.columns = Array.from({ length: columns ?? 2 }, () => []);
    field.label = '';
    return field;
  }
  if (type === 'repeater') {
    field.label = 'Items';
    field.subFields = [makeField('text')];
    field.subFields[0].label = 'Item';
    field.minRows = 1;
    return field;
  }
  // Before the matrix defaults below, which replace these with answer columns.
  if (optionTypes.includes(type)) field.options = ['Option 1', 'Option 2'];
  if (type === 'chips') field.allowMultiple = false;
  if (type === 'rating') field.maxRating = 5;
  if (type === 'slider') {
    field.min = 0;
    field.max = 100;
    field.step = 1;
  }
  if (type === 'ranking') field.options = ['First option', 'Second option', 'Third option'];
  // Shows the formatting it offers rather than describing it, so the block
  // reads as content on the canvas instead of as instructions to the author.
  if (type === 'richText') {
    field.content =
      '<p>Replace this with your own text. It can carry <strong>bold</strong>, ' +
      '<em>italics</em>, and <a href="https://example.com">links</a>.</p>' +
      '<ul><li>Bulleted points</li><li>Or a numbered list</li></ul>';
  }
  if (type === 'matrix') {
    field.rows = ['First statement', 'Second statement'];
    field.options = ['Disagree', 'Neutral', 'Agree'];
  }
  if (type === 'likert') {
    field.label = 'How much do you agree?';
    field.options = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
  }
  if (type === 'nps') {
    field.label = 'How likely are you to recommend us?';
    field.min = 0;
    field.max = 10;
  }
  if (type === 'payment') {
    // Zero until the author sets a price — a payment field that silently
    // defaulted to some amount would be worse than one that is obviously
    // unconfigured.
    field.pay = { mode: 'fixed', amount: 0, currency: 'INR' };
    field.label = 'Payment';
    field.required = true;
  }
  if (type === 'hidden') field.label = 'Hidden value';
  if (type === 'heading') field.content = 'Heading';
  if (type === 'description') field.content = 'Description text';
  if (textTypes.includes(type)) field.maxLength = 255;
  if (placeholderTypes.includes(type)) field.placeholder = `Enter ${field.label}`;
  return field;
}

/** Field types that render a text-style input a placeholder can sit in. */
export const placeholderTypes: FieldType[] = [
  ...textTypes,
  'number',
  'decimal',
  'currency',
  'date',
  'time',
  'datetime',
  'monthYear',
];
