import type { FormTemplate } from './types';
import { field, row } from './types';

/**
 * Card-scope templates: designed to be dropped into an existing page, so they
 * theme the card only and leave the page background to the host site.
 */
export const embedTemplates: FormTemplate[] = [
  {
    id: 'embedContact',
    name: 'Inline contact card',
    description: 'A compact contact block sized to sit in a sidebar or footer.',
    category: 'Basics',
    keywords: ['embed', 'widget', 'inline', 'sidebar', 'contact'],
    title: 'Get in touch',
    formDescription: 'We reply to everything within one business day.',
    submitLabel: 'Send',
    fields: [
      row(
        [field('name', { label: 'Name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('textarea', { label: 'Message', required: true, placeholder: 'How can we help?' }),
    ],
    theme: {
      scope: 'card',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#2563eb',
      labelColor: '#0f172a',
      inputBg: '#f8fafc',
      inputBorder: '#cbd5e1',
      inputTextColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 12,
      cardShadow: 'sm',
      fontFamily: 'inter',
    },
  },
  {
    id: 'embedLeadCapture',
    name: 'Lead capture block',
    description: 'Email and company on one line — a landing page conversion block.',
    category: 'Business',
    keywords: ['embed', 'landing page', 'lead', 'demo', 'cta'],
    title: 'Book a demo',
    formDescription: 'Fifteen minutes, no slides.',
    submitLabel: 'Request a demo',
    fields: [
      row(
        [field('email', { label: 'Work email', required: true, placeholder: 'you@company.com' })],
        [field('text', { label: 'Company', required: true })]
      ),
      field('select', {
        label: 'Team size',
        required: true,
        options: ['1–10', '11–50', '51–200', '200+'],
      }),
    ],
    theme: {
      scope: 'card',
      cardBg: '#0b1120',
      cardBorder: '#1e293b',
      accentColor: '#38bdf8',
      labelColor: '#e2e8f0',
      inputBg: '#111a2c',
      inputBorder: '#243147',
      inputTextColor: '#f8fafc',
      textMode: 'light',
      cardRadius: 14,
      cardShadow: 'lg',
      fontFamily: 'inter',
    },
  },
  {
    id: 'embedRating',
    name: 'Inline rating widget',
    description: 'A single star rating and comment box for the end of an article.',
    category: 'Support',
    keywords: ['embed', 'widget', 'rating', 'was this helpful', 'docs'],
    title: 'Was this page helpful?',
    submitLabel: 'Send',
    hideHeader: false,
    fields: [
      field('rating', { label: 'Rate this page', required: true, maxRating: 5, hideLabel: true }),
      field('textarea', { label: 'What was missing?', placeholder: 'Optional' }),
    ],
    theme: {
      scope: 'card',
      cardBg: '#fafafa',
      cardBorder: '#e5e5e5',
      accentColor: '#16a34a',
      labelColor: '#171717',
      inputBg: '#ffffff',
      inputBorder: '#d4d4d4',
      inputTextColor: '#171717',
      textMode: 'dark',
      cardRadius: 10,
      cardShadow: 'none',
      fontFamily: 'inter',
    },
  },
  {
    id: 'embedBooking',
    name: 'Inline booking strip',
    description: 'Date, time, and party size — a booking widget for a venue page.',
    category: 'Hospitality',
    keywords: ['embed', 'widget', 'booking', 'reserve', 'venue'],
    title: 'Book a table',
    submitLabel: 'Check availability',
    fields: [
      row(
        [field('date', { label: 'Date', required: true })],
        [field('time', { label: 'Time', required: true })],
        [field('number', { label: 'Guests', required: true, min: 1, max: 20, initialValue: '2' })]
      ),
      field('email', { label: 'Email', required: true }),
    ],
    theme: {
      scope: 'card',
      cardBg: '#1c1917',
      cardBorder: '#3f3a36',
      accentColor: '#f59e0b',
      labelColor: '#e7e5e4',
      inputBg: '#262220',
      inputBorder: '#44403c',
      inputTextColor: '#fafaf9',
      textMode: 'light',
      cardRadius: 8,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
];
