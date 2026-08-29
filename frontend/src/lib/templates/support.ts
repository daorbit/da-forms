import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Forms that collect a report or a rating rather than a lead. */
export const supportTemplates: FormTemplate[] = [
  {
    id: 'support',
    name: 'Support request',
    description: 'Dark themed contact form with a topic dropdown, side-by-side fields, and a message box.',
    category: 'Support',
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
    id: 'productFeedback',
    name: 'Product feedback',
    description: 'Dark themed survey with a satisfaction scale and feature request box.',
    category: 'Support',
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
  {
    id: 'bugReport',
    name: 'Bug report',
    description: 'Severity, reproduction steps, and a screenshot upload, in a monospace dark theme.',
    category: 'Support',
    title: 'Report a bug',
    formDescription: 'The more precisely you can describe it, the faster it gets fixed.',
    submitLabel: 'File report',
    fields: [
      field('text', { label: 'Summary', required: true, placeholder: 'One line: what went wrong' }),
      row(
        [
          field('select', {
            label: 'Severity',
            required: true,
            options: ['Blocker', 'Major', 'Minor', 'Cosmetic'],
          }),
        ],
        [
          field('select', {
            label: 'Area',
            required: true,
            options: ['Dashboard', 'Forms', 'Submissions', 'Billing', 'API', 'Something else'],
          }),
        ]
      ),
      field('textarea', {
        label: 'Steps to reproduce',
        required: true,
        placeholder: '1. Go to…  2. Click…  3. Observe…',
      }),
      row(
        [field('textarea', { label: 'Expected result', required: true })],
        [field('textarea', { label: 'Actual result', required: true })]
      ),
      field('imageUpload', { label: 'Screenshot' }),
      field('text', { label: 'Browser / device', placeholder: 'Chrome 128 on Windows 11' }),
      field('email', { label: 'Your email', helpText: 'So we can tell you when it is fixed.' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0d1117',
      cardBg: '#161b22',
      cardBorder: '#30363d',
      accentColor: '#f78166',
      labelColor: '#c9d1d9',
      inputBg: '#0d1117',
      inputBorder: '#30363d',
      inputTextColor: '#e6edf3',
      textMode: 'light',
      cardRadius: 8,
      cardShadow: 'sm',
      fontFamily: 'mono',
    },
  },
  {
    id: 'nps',
    name: 'NPS survey',
    description: 'A single 0–10 score plus a follow-up — the classic net promoter question.',
    category: 'Support',
    title: 'How likely are you to recommend us?',
    formDescription: '0 means not at all likely, 10 means extremely likely.',
    submitLabel: 'Send feedback',
    fields: [
      field('slider', { label: 'Your score', required: true, min: 0, max: 10, step: 1 }),
      field('textarea', {
        label: 'What is the main reason for your score?',
        required: true,
        placeholder: 'One or two sentences is plenty.',
      }),
      field('radio', {
        label: 'May we follow up about this?',
        options: ['Yes, by email', 'Yes, by phone', 'No thanks'],
      }),
      field('email', { label: 'Email', placeholder: 'you@example.com' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#fef3c7',
      cardBg: '#ffffff',
      cardBorder: '#fde68a',
      accentColor: '#d97706',
      labelColor: '#451a03',
      inputBg: '#fffbeb',
      inputBorder: '#fcd34d',
      inputTextColor: '#451a03',
      textMode: 'dark',
      cardRadius: 20,
      cardShadow: 'lg',
      fontFamily: 'rounded',
      pageBackground: { gradient: 'linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)' },
    },
  },
];
