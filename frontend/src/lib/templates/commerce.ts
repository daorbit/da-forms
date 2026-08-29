import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Forms that end in a transaction: an order, a seat, a slot, a gift. */
export const commerceTemplates: FormTemplate[] = [
  {
    id: 'orderForm',
    name: 'Product order',
    description: 'Order details, quantity, and shipping address, in a clean light theme.',
    category: 'Commerce',
    title: 'Place your order',
    formDescription: 'We confirm every order by email within one business day.',
    submitLabel: 'Place order',
    stepIndicator: 'dots',
    steps: [{ title: 'Order' }, { title: 'Shipping' }],
    fields: [
      field('select', {
        label: 'Product',
        required: true,
        options: ['Starter kit', 'Pro bundle', 'Enterprise pack', 'Replacement parts'],
      }),
      row(
        [field('number', { label: 'Quantity', required: true, min: 1, max: 999, initialValue: '1' })],
        [
          field('select', {
            label: 'Delivery speed',
            required: true,
            options: ['Standard (5–7 days)', 'Express (2 days)', 'Next day'],
          }),
        ]
      ),
      field('textarea', { label: 'Order notes', placeholder: 'Anything we should know before we ship?' }),
      pageBreak(),
      row(
        [field('name', { label: 'Recipient name', required: true })],
        [field('phone', { label: 'Contact phone', required: true })]
      ),
      field('address', { label: 'Shipping address', required: true }),
      field('terms', { label: 'I accept the terms of sale', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f8fafc',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#0f172a',
      labelColor: '#0f172a',
      inputBg: '#ffffff',
      inputBorder: '#cbd5e1',
      inputTextColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 12,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
  {
    id: 'eventRegistration',
    name: 'Event registration',
    description: 'Two-step registration with ticket type, session picks, and dietary needs.',
    category: 'Commerce',
    title: 'Register for the summit',
    formDescription: 'Seats are limited — registration closes a week before the event.',
    submitLabel: 'Reserve my seat',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'Your details', description: 'Who is attending.' },
      { title: 'Your ticket', description: 'What you need on the day.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Full name', required: true })],
        [field('email', { label: 'Email', required: true, placeholder: 'you@company.com' })]
      ),
      row(
        [field('text', { label: 'Company', placeholder: 'Acme Inc.' })],
        [field('text', { label: 'Job title', placeholder: 'Head of Engineering' })]
      ),
      pageBreak(),
      field('radio', {
        label: 'Ticket type',
        required: true,
        options: ['General admission', 'Workshop pass', 'Full conference', 'Student'],
      }),
      field('checkbox', {
        label: 'Sessions you plan to attend',
        options: ['Opening keynote', 'Product deep dive', 'Panel discussion', 'Evening reception'],
      }),
      field('textarea', { label: 'Dietary requirements', placeholder: 'e.g. vegetarian, nut allergy' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#1e1b4b',
      cardBg: '#ffffff',
      cardBorder: '#e9d5ff',
      accentColor: '#7c3aed',
      labelColor: '#1e1b4b',
      inputBg: '#faf8ff',
      inputBorder: '#ddd6fe',
      inputTextColor: '#1e1b4b',
      textMode: 'dark',
      cardRadius: 18,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: {
        gradient: 'linear-gradient(135deg, #1e3a8a 0%, #7e22ce 100%)',
      },
    },
  },
  {
    id: 'appointmentBooking',
    name: 'Appointment booking',
    description: 'Service, date and time, then contact details — for bookings and consultations.',
    category: 'Commerce',
    title: 'Book an appointment',
    formDescription: 'Pick a slot and we will confirm it by email.',
    submitLabel: 'Request booking',
    stepIndicator: 'progress',
    steps: [{ title: 'Service' }, { title: 'When' }, { title: 'Your details' }],
    fields: [
      field('select', {
        label: 'Service',
        required: true,
        options: ['Initial consultation', 'Follow-up', 'Full assessment', 'Remote session'],
      }),
      field('select', {
        label: 'Preferred practitioner',
        options: ['No preference', 'Dr. Chen', 'Dr. Okafor', 'Dr. Silva'],
      }),
      pageBreak(),
      row(
        [field('date', { label: 'Preferred date', required: true })],
        [field('time', { label: 'Preferred time', required: true })]
      ),
      field('radio', {
        label: 'If that slot is taken',
        options: ['Offer me the closest alternative', 'Contact me to rearrange', 'Cancel the request'],
      }),
      pageBreak(),
      row(
        [field('name', { label: 'Full name', required: true })],
        [field('phone', { label: 'Phone', required: true })]
      ),
      field('email', { label: 'Email', required: true }),
      field('textarea', { label: 'Reason for the visit', placeholder: 'Optional' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#ecfdf5',
      cardBg: '#ffffff',
      cardBorder: '#bbf7d0',
      accentColor: '#0d9488',
      labelColor: '#134e4a',
      inputBg: '#f7fefb',
      inputBorder: '#a7f3d0',
      inputTextColor: '#134e4a',
      textMode: 'dark',
      cardRadius: 16,
      cardShadow: 'md',
      fontFamily: 'rounded',
      pageBackground: {
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        overlay: '#ffffff',
        overlayOpacity: 55,
      },
    },
  },
  {
    id: 'donation',
    name: 'Donation',
    description: 'Amount, frequency, and donor details for a fundraising campaign.',
    category: 'Commerce',
    title: 'Support our work',
    formDescription: 'Every contribution goes directly into the programme.',
    submitLabel: 'Donate',
    stepIndicator: 'dots',
    steps: [{ title: 'Amount' }, { title: 'Your details' }],
    fields: [
      field('radio', {
        label: 'How often?',
        required: true,
        options: ['One-off', 'Monthly', 'Yearly'],
      }),
      field('currency', { label: 'Amount', required: true, min: 1, placeholder: '50' }),
      field('textarea', { label: 'Dedicate this gift to someone', placeholder: 'Optional' }),
      pageBreak(),
      row(
        [field('name', { label: 'Full name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('address', { label: 'Address', helpText: 'Needed for gift aid or tax receipts.' }),
      field('decisionBox', { label: 'Keep me updated about the campaign' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#7f1d1d',
      cardBg: '#ffffff',
      cardBorder: '#fecaca',
      accentColor: '#dc2626',
      labelColor: '#450a0a',
      inputBg: '#fffafa',
      inputBorder: '#fecaca',
      inputTextColor: '#450a0a',
      textMode: 'dark',
      cardRadius: 16,
      cardShadow: 'xl',
      fontFamily: 'serif',
      pageBackground: {
        gradient: 'linear-gradient(135deg, #7f1d1d 0%, #b45309 100%)',
        overlay: '#000000',
        overlayOpacity: 20,
      },
    },
  },
];
