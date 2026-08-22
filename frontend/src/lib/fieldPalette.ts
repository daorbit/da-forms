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
  IconChevronDown,
  IconCircleDot,
  IconCheckbox,
  IconCalendar,
  IconClock,
  IconStar,
  IconPaperclip,
  type Icon,
} from '@tabler/icons-react';

export interface PaletteItem {
  type: FieldType;
  label: string;
  icon: Icon;
  color: string;
}

export interface PaletteGroup {
  group: string;
  items: PaletteItem[];
}

export const fieldPalette: PaletteGroup[] = [
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
    ],
  },
  {
    group: 'Choices',
    items: [
      { type: 'select', label: 'Dropdown', icon: IconChevronDown, color: 'indigo' },
      { type: 'radio', label: 'Radio', icon: IconCircleDot, color: 'indigo' },
      { type: 'checkbox', label: 'Checkbox', icon: IconCheckbox, color: 'indigo' },
    ],
  },
  {
    group: 'Date & Time',
    items: [
      { type: 'date', label: 'Date', icon: IconCalendar, color: 'orange' },
      { type: 'time', label: 'Time', icon: IconClock, color: 'orange' },
    ],
  },
  {
    group: 'Other',
    items: [
      { type: 'rating', label: 'Rating', icon: IconStar, color: 'yellow' },
      { type: 'file', label: 'File Upload', icon: IconPaperclip, color: 'gray' },
    ],
  },
];

export const paletteByType = Object.fromEntries(
  fieldPalette.flatMap((g) => g.items).map((item) => [item.type, item])
) as Record<FieldType, PaletteItem>;

const withOptions: FieldType[] = ['select', 'radio', 'checkbox'];

export function makeField(type: FieldType): FormField {
  const field: FormField = {
    id: crypto.randomUUID(),
    type,
    label: paletteByType[type].label,
    required: false,
  };
  if (withOptions.includes(type)) field.options = ['Option 1', 'Option 2'];
  if (type === 'rating') field.maxRating = 5;
  return field;
}
