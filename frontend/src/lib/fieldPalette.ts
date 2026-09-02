import type { FieldType, FormField } from '@/types';
import {
  IconUser,
  IconAddressBook,
  IconPhone,
  IconMail,
  IconWorld,
  IconLetterCaseToggle,
  IconAlignLeft,
  IconRegex,
  IconNumber123,
  IconDecimal,
  IconCurrencyDollar,
  IconSelector,
  IconCircleDot,
  IconCheckbox,
  IconListCheck,
  IconCalendar,
  IconClock,
  IconCalendarTime,
  IconCalendarMonth,
  IconFileUpload,
  IconPhotoUp,
  IconVideo,
  IconStar,
  IconAdjustmentsHorizontal,
  IconFileCertificate,
  IconSquareCheck,
  IconCheckbox as IconYesNo,
  IconHash,
  IconDice,
  IconSignature,
  IconTable,
  IconMathFunction,
  IconEyeOff,
  IconFlag,
  IconSortAscending,
  IconArrowsHorizontal,
  IconFileText,
  IconHeading,
  IconTypography,
  IconMinus,
  IconArrowAutofitHeight,
  IconColumns1,
  IconColumns2,
  IconColumns3,
  IconBook2,
  IconCreditCard,
  type Icon,
} from '@tabler/icons-react';

export interface PaletteItem {
  type: FieldType;
  label: string;
  icon: Icon;
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
      { type: 'grid', label: '1-Column', icon: IconColumns1, color: 'orange', columns: 1 },
      { type: 'grid', label: '2-Column', icon: IconColumns2, color: 'orange', columns: 2 },
      { type: 'grid', label: '3-Column', icon: IconColumns3, color: 'orange', columns: 3 },
    ],
  },
  {
    group: 'Basic Info',
    items: [
      { type: 'name', label: 'Name', icon: IconUser, color: 'teal' },
      { type: 'address', label: 'Address', icon: IconAddressBook, color: 'teal' },
      { type: 'phone', label: 'Phone', icon: IconPhone, color: 'teal' },
      { type: 'email', label: 'Email', icon: IconMail, color: 'teal' },
      { type: 'website', label: 'Website', icon: IconWorld, color: 'teal' },
    ],
  },
  {
    group: 'Textbox',
    items: [
      { type: 'text', label: 'Single Line', icon: IconLetterCaseToggle, color: 'blue' },
      { type: 'textarea', label: 'Multi Line', icon: IconAlignLeft, color: 'blue' },
      { type: 'regex', label: 'Regex', icon: IconRegex, color: 'blue' },
    ],
  },
  {
    group: 'Number',
    items: [
      { type: 'number', label: 'Number', icon: IconNumber123, color: 'violet' },
      { type: 'decimal', label: 'Decimal', icon: IconDecimal, color: 'violet' },
      { type: 'currency', label: 'Currency', icon: IconCurrencyDollar, color: 'violet' },
      { type: 'numberRange', label: 'Range', icon: IconArrowsHorizontal, color: 'violet' },
    ],
  },
  {
    group: 'Choices',
    items: [
      { type: 'select', label: 'Dropdown', icon: IconSelector, color: 'cyan' },
      { type: 'radio', label: 'Radio', icon: IconCircleDot, color: 'cyan' },
      { type: 'checkbox', label: 'Checkbox', icon: IconCheckbox, color: 'cyan' },
      { type: 'multipleChoice', label: 'Multi Choice', icon: IconListCheck, color: 'cyan' },
      { type: 'country', label: 'Country', icon: IconFlag, color: 'cyan' },
      { type: 'ranking', label: 'Ranking', icon: IconSortAscending, color: 'cyan' },
    ],
  },
  {
    group: 'Date & Time',
    items: [
      { type: 'date', label: 'Date', icon: IconCalendar, color: 'orange' },
      { type: 'time', label: 'Time', icon: IconClock, color: 'orange' },
      { type: 'datetime', label: 'Date-Time', icon: IconCalendarTime, color: 'orange' },
      { type: 'monthYear', label: 'Month-Year', icon: IconCalendarMonth, color: 'orange' },
    ],
  },
  {
    group: 'Uploads',
    items: [
      { type: 'file', label: 'File', icon: IconFileUpload, color: 'green' },
      { type: 'imageUpload', label: 'Image', icon: IconPhotoUp, color: 'green' },
      { type: 'mediaUpload', label: 'Audio/Video', icon: IconVideo, color: 'green' },
    ],
  },
  {
    group: 'Rating Scales',
    items: [
      { type: 'rating', label: 'Rating', icon: IconStar, color: 'pink' },
      { type: 'slider', label: 'Slider', icon: IconAdjustmentsHorizontal, color: 'pink' },
    ],
  },
  {
    group: 'Legal & Consent',
    items: [
      { type: 'terms', label: 'Terms', icon: IconFileCertificate, color: 'grape' },
      { type: 'decisionBox', label: 'Decision', icon: IconSquareCheck, color: 'grape' },
      { type: 'yesNo', label: 'Yes/No', icon: IconYesNo, color: 'grape' },
      { type: 'signature', label: 'Signature', icon: IconSignature, color: 'grape' },
    ],
  },
  {
    group: 'Payment',
    items: [{ type: 'payment', label: 'Payment', icon: IconCreditCard, color: 'lime' }],
  },
  {
    group: 'Survey',
    items: [{ type: 'matrix', label: 'Matrix', icon: IconTable, color: 'cyan' }],
  },
  {
    group: 'Calculation',
    items: [
      { type: 'calculated', label: 'Calculated', icon: IconMathFunction, color: 'violet' },
    ],
  },
  {
    group: 'Identifier',
    items: [
      { type: 'uniqueId', label: 'Unique ID', icon: IconHash, color: 'red' },
      { type: 'randomId', label: 'Random ID', icon: IconDice, color: 'red' },
      { type: 'hidden', label: 'Hidden', icon: IconEyeOff, color: 'red' },
    ],
  },
  {
    group: 'Page Elements',
    items: [
      { type: 'heading', label: 'Heading', icon: IconHeading, color: 'indigo' },
      { type: 'description', label: 'Description', icon: IconTypography, color: 'indigo' },
      { type: 'richText', label: 'Rich Text', icon: IconFileText, color: 'indigo' },
      { type: 'divider', label: 'Divider', icon: IconMinus, color: 'indigo' },
      { type: 'spacer', label: 'Spacer', icon: IconArrowAutofitHeight, color: 'indigo' },
      { type: 'pageBreak', label: 'Page Break', icon: IconBook2, color: 'indigo' },
    ],
  },
];

/**
 * Every tile keyed for drag payloads.
 *
 * Keyed by type *and* column count because the three grid tiles share one
 * type and would otherwise collide with each other.
 */
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
  'select', 'radio', 'checkbox', 'multipleChoice', 'matrix', 'ranking',
];

export const numericTypes: FieldType[] = ['number', 'decimal', 'currency', 'slider', 'numberRange'];

export const fileTypes: FieldType[] = ['file', 'imageUpload', 'mediaUpload'];
 
export const uploadedTypes: FieldType[] = [...fileTypes, 'signature'];

// The generic "file" field is for documents — pdf/doc/xls/etc — not images or
// video, which have their own dedicated field types. Kept as actual MIME types
// (not extensions) so the same list also drives server-side validation.
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
  // Before the matrix defaults below, which replace these with answer columns.
  if (optionTypes.includes(type)) field.options = ['Option 1', 'Option 2'];
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
