import type { FormField, FormStep, FormTheme, StepIndicator } from '@/types';
import { makeField } from './fieldPalette';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  formDescription?: string;
  fields: FormField[];
  theme?: FormTheme;
  submitLabel?: string;
  hideHeader?: boolean;
  /** Names for each page, when the template ships with page breaks. */
  steps?: FormStep[];
  stepIndicator?: StepIndicator;
  showStepHeadings?: boolean;
}

function field(type: Parameters<typeof makeField>[0], overrides: Partial<FormField> = {}): FormField {
  return { ...makeField(type), ...overrides };
}

/** A two-column row — the layout most professional templates are built from. */
function row(...columns: FormField[][]): FormField {
  return {
    id: crypto.randomUUID(),
    type: 'grid',
    label: '',
    required: false,
    columns,
  };
}

/** Splits the fields before it from the fields after it into separate steps. */
function pageBreak(): FormField {
  return field('pageBreak');
}

export const formTemplates: FormTemplate[] = [
  {
    id: 'blank',
    name: 'Blank form',
    description: 'Start from scratch with an empty canvas.',
    title: 'Untitled form',
    fields: [],
  },
  {
    id: 'contact',
    name: 'Contact form',
    description: 'Name, email, and a message — the standard "get in touch" form.',
    title: 'Contact us',
    formDescription: "Tell us what you need and we'll get back to you.",
    fields: [
      field('text', { label: 'Full name', required: true, placeholder: 'Ada Lovelace' }),
      field('email', { label: 'Email', required: true, placeholder: 'ada@example.com' }),
      field('textarea', { label: 'Message', required: true, placeholder: 'How can we help?' }),
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback survey',
    description: 'A rating scale plus open comments, for gathering product or service feedback.',
    title: 'We would love your feedback',
    formDescription: 'Takes less than a minute.',
    fields: [
      field('rating', { label: 'How would you rate your experience?', required: true, maxRating: 5 }),
      field('radio', {
        label: 'Would you recommend us to a friend?',
        required: true,
        options: ['Yes', 'No', 'Not sure'],
      }),
      field('textarea', { label: 'Anything else you want to share?', placeholder: 'Optional comments' }),
    ],
  },
  {
    id: 'support',
    name: 'Support request',
    description: 'Dark themed contact form with a topic dropdown, side-by-side fields, and a message box.',
    title: 'Contact us',
    fields: [
      {
        id: crypto.randomUUID(),
        type: 'grid',
        label: '',
        required: false,
        columns: [
          [field('text', { label: 'Your name', required: true, placeholder: 'Ada Lovelace' })],
          [field('email', { label: 'Email', required: true, placeholder: 'ada@example.com' })],
        ],
      },
      {
        id: crypto.randomUUID(),
        type: 'grid',
        label: '',
        required: false,
        columns: [
          [field('text', { label: 'Company', required: false, placeholder: 'Acme Inc.' })],
          [
            field('select', {
              label: 'What is this about?',
              required: true,
              options: [
                'General enquiry',
                'Pricing and plans',
                'Help with my account',
                'Platform API / white label',
                'Privacy and compliance',
                'Something else',
              ],
            }),
          ],
        ],
      },
      field('textarea', {
        label: 'Message',
        required: true,
        placeholder: 'Tell us what you are trying to do, and we will tell you whether it fits.',
      }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0f1115',
      cardBg: '#1a1c20',
      cardBorder: '#2b2e34',
      accentColor: '#12b5a6',
      textMode: 'light',
    },
  },
  {
    id: 'rsvp',
    name: 'Event RSVP',
    description: 'Attendance, guest count, and dietary needs — ready for your next event.',
    title: 'RSVP',
    formDescription: 'Let us know if you can make it.',
    fields: [
      field('text', { label: 'Full name', required: true, placeholder: 'Ada Lovelace' }),
      field('email', { label: 'Email', required: true, placeholder: 'ada@example.com' }),
      field('yesNo', { label: 'Will you attend?', required: true }),
      field('number', { label: 'Number of guests', min: 0, max: 10 }),
      field('textarea', { label: 'Dietary restrictions', placeholder: 'e.g. vegetarian, nut allergy' }),
    ],
  },
  {
    id: 'waitlist',
    name: 'Waitlist signup',
    description: 'Dark, minimal signup for an early-access or coming-soon page.',
    title: 'Join the waitlist',
    formDescription: "We'll email you the moment a spot opens up.",
    fields: [
      field('email', { label: 'Email', required: true, placeholder: 'you@example.com' }),
      field('select', {
        label: 'How did you hear about us?',
        required: false,
        options: ['Twitter / X', 'A friend', 'Search', 'Newsletter', 'Something else'],
      }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0a0a0f',
      cardBg: '#16161d',
      cardBorder: '#26262f',
      accentColor: '#7c5cff',
      textMode: 'light',
    },
  },
  {
    id: 'newsletter',
    name: 'Newsletter signup',
    description: 'One email field and a subscribe button — nothing to slow someone down.',
    title: 'Subscribe',
    formDescription: 'We use your address for the newsletter and nothing else.',
    submitLabel: 'Subscribe',
    hideHeader: true,
    fields: [field('email', { label: 'Email', required: true, hideLabel: true, placeholder: 'you@company.com' })],
    theme: {
      scope: 'card',
      cardBg: '#111318',
      cardBorder: '#2d313a',
      accentColor: '#12b5a6',
      textMode: 'light',
    },
  },
  {
    id: 'productFeedback',
    name: 'Product feedback',
    description: 'Dark themed survey with a satisfaction scale and feature request box.',
    title: 'Help us improve',
    formDescription: 'Two minutes, and it goes straight to the team building this.',
    fields: [
      field('rating', { label: 'How satisfied are you with the product?', required: true, maxRating: 5 }),
      field('radio', {
        label: 'How often do you use it?',
        required: true,
        options: ['Daily', 'A few times a week', 'Occasionally', 'This is my first time'],
      }),
      field('textarea', {
        label: 'What should we build next?',
        placeholder: 'One feature, described in a sentence or two.',
      }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#111318',
      cardBg: '#1c1f26',
      cardBorder: '#2d313a',
      accentColor: '#f5a623',
      textMode: 'light',
    },
  },
];
