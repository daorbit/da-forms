import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** The everyday forms — a contact box, a signup, an RSVP. */
export const basicTemplates: FormTemplate[] = [
  {
    id: 'blank',
    name: 'Blank form',
    description: 'Start from scratch with an empty canvas.',
    category: 'Basics',
    title: 'Untitled form',
    fields: [],
  },
  {
    id: 'contact',
    name: 'Contact form',
    description: 'Name, email, and a message — the standard "get in touch" form.',
    category: 'Basics',
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
    category: 'Basics',
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
    id: 'newsletter',
    name: 'Newsletter signup',
    description: 'One email field and a subscribe button — nothing to slow someone down.',
    category: 'Basics',
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
    id: 'rsvp',
    name: 'Event RSVP',
    description: 'Attendance, guest count, and dietary needs — ready for your next event.',
    category: 'Basics',
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
    category: 'Basics',
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
];
