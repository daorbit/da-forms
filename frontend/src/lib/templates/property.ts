import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Property forms — viewings, applications, and maintenance. */
export const propertyTemplates: FormTemplate[] = [
  {
    id: 'viewingRequest',
    name: 'Viewing request',
    description: 'Property, preferred slots, and buyer position — for agents and listings.',
    category: 'Real estate',
    keywords: ['property', 'viewing', 'agent', 'house', 'listing'],
    title: 'Book a viewing',
    formDescription: 'We confirm viewings the same day where we can.',
    submitLabel: 'Request viewing',
    fields: [
      field('text', { label: 'Property address or reference', required: true }),
      row(
        [field('date', { label: 'Preferred date', required: true })],
        [field('time', { label: 'Preferred time', required: true })]
      ),
      field('radio', {
        label: 'Your position',
        required: true,
        options: ['First-time buyer', 'Sold, ready to move', 'On the market', 'Not yet on the market', 'Investor'],
      }),
      field('yesNo', { label: 'Do you have a mortgage agreed in principle?' }),
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('phone', { label: 'Phone', required: true })]
      ),
      field('email', { label: 'Email', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f5f5f4',
      cardBg: '#ffffff',
      cardBorder: '#e7e5e4',
      accentColor: '#0f766e',
      labelColor: '#1c1917',
      textMode: 'dark',
      cardRadius: 12,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
  {
    id: 'rentalApplication',
    name: 'Rental application',
    description: 'Applicant, employment, and references across three steps.',
    category: 'Real estate',
    keywords: ['tenant', 'lease', 'letting', 'apply', 'rent'],
    title: 'Apply to rent',
    formDescription: 'Applications are assessed in the order they are completed.',
    submitLabel: 'Submit application',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Applicant', description: 'Who is applying.' },
      { title: 'Employment', description: 'How the rent is covered.' },
      { title: 'References', description: 'Who can vouch for you.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Full name', required: true })],
        [field('date', { label: 'Date of birth', required: true })]
      ),
      row(
        [field('email', { label: 'Email', required: true })],
        [field('phone', { label: 'Phone', required: true })]
      ),
      field('address', { label: 'Current address', required: true }),
      field('number', { label: 'Number of occupants', min: 1, max: 12 }),
      pageBreak(),
      row(
        [field('text', { label: 'Employer', required: true })],
        [field('text', { label: 'Job title', required: true })]
      ),
      row(
        [field('currency', { label: 'Annual income', required: true, min: 0 })],
        [field('select', { label: 'Employment type', required: true, options: ['Permanent', 'Fixed term', 'Self-employed', 'Student', 'Retired'] })]
      ),
      field('file', { label: 'Proof of income' }),
      pageBreak(),
      row(
        [field('name', { label: 'Previous landlord', required: true })],
        [field('phone', { label: 'Their phone', required: true })]
      ),
      field('yesNo', { label: 'Any pets?' }),
      field('textarea', { label: 'Anything else we should know?' }),
      field('terms', { label: 'I consent to a credit and reference check', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0c0a09',
      cardBg: '#fafaf9',
      cardBorder: '#e7e5e4',
      accentColor: '#b45309',
      labelColor: '#1c1917',
      inputBg: '#ffffff',
      inputBorder: '#d6d3d1',
      inputTextColor: '#1c1917',
      textMode: 'dark',
      cardRadius: 12,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(180deg, #292524 0%, #0c0a09 100%)' },
    },
  },
  {
    id: 'maintenanceRequest',
    name: 'Maintenance request',
    description: 'Issue, urgency, access details, and a photo of the problem.',
    category: 'Real estate',
    keywords: ['repair', 'tenant', 'landlord', 'facilities', 'fix'],
    title: 'Report a maintenance issue',
    formDescription: 'Emergencies (flood, gas, no heat in winter) are handled within 24 hours.',
    submitLabel: 'Report issue',
    fields: [
      field('text', { label: 'Property address', required: true }),
      field('select', {
        label: 'What is the problem?',
        required: true,
        options: ['Plumbing', 'Heating', 'Electrical', 'Appliance', 'Damp or mould', 'Structural', 'Other'],
      }),
      field('radio', {
        label: 'Urgency',
        required: true,
        options: ['Emergency', 'Urgent', 'Routine'],
      }),
      field('textarea', { label: 'Describe the issue', required: true }),
      field('imageUpload', { label: 'Photo' }),
      field('checkbox', {
        label: 'When can a contractor come in?',
        options: ['Weekday mornings', 'Weekday afternoons', 'Evenings', 'Weekends', 'Any time — we hold a key'],
      }),
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('phone', { label: 'Phone', required: true })]
      ),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f8fafc',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#ea580c',
      labelColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 10,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
];
