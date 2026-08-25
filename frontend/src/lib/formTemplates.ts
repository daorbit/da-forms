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
  {
    id: 'jobApplication',
    name: 'Job application',
    description: 'Three-step application — candidate details, experience, and CV upload. Stepper progress.',
    title: 'Apply for this role',
    formDescription: 'It takes about five minutes. You can see how far along you are at the top.',
    submitLabel: 'Submit application',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'About you', description: 'How we reach you if we move forward.' },
      { title: 'Experience', description: 'The work that is most relevant to this role.' },
      { title: 'Documents', description: 'Your CV, and anything else worth reading.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Full name', required: true, placeholder: 'Ada Lovelace' })],
        [field('email', { label: 'Email', required: true, placeholder: 'ada@example.com' })]
      ),
      row(
        [field('phone', { label: 'Phone', placeholder: '+1 555 0100' })],
        [field('website', { label: 'Portfolio or LinkedIn', placeholder: 'https://' })]
      ),
      pageBreak(),
      field('select', {
        label: 'Years of relevant experience',
        required: true,
        options: ['Less than 1', '1–3', '3–5', '5–10', 'More than 10'],
      }),
      field('textarea', {
        label: 'Tell us about a project you are proud of',
        required: true,
        placeholder: 'What it was, what you did, and how it turned out.',
      }),
      field('select', {
        label: 'Earliest start date',
        options: ['Immediately', 'Within 2 weeks', 'Within a month', 'More than a month'],
      }),
      pageBreak(),
      field('file', { label: 'CV / resume', required: true }),
      field('textarea', { label: 'Anything else we should know?', placeholder: 'Optional' }),
      field('terms', { label: 'I agree to the processing of my application data', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0f172a',
      cardBg: '#111827',
      cardBorder: '#1f2937',
      accentColor: '#38bdf8',
      labelColor: '#e2e8f0',
      inputBg: '#1a2333',
      inputBorder: '#2b3648',
      inputTextColor: '#f8fafc',
      textMode: 'light',
      cardRadius: 16,
      cardShadow: 'lg',
      fontFamily: 'inter',
      pageBackground: {
        gradient: 'linear-gradient(160deg, #0f172a 0%, #0e7490 100%)',
        overlay: '#000000',
        overlayOpacity: 25,
      },
    },
  },
  {
    id: 'eventRegistration',
    name: 'Event registration',
    description: 'Two-step registration with ticket type, session picks, and dietary needs.',
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
    id: 'orderForm',
    name: 'Product order',
    description: 'Order details, quantity, and shipping address, in a clean light theme.',
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
    id: 'leadQualification',
    name: 'Lead qualification',
    description: 'Budget, timeline, and use case — a sales-ready qualification form.',
    title: 'Tell us about your project',
    formDescription: 'The more you share, the more useful our first call will be.',
    submitLabel: 'Request a call',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Contact', description: 'Who we should be talking to.' },
      { title: 'Project', description: 'What you are trying to build.' },
      { title: 'Budget', description: 'So we can propose something realistic.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('email', { label: 'Work email', required: true, placeholder: 'you@company.com' })]
      ),
      row(
        [field('text', { label: 'Company', required: true })],
        [field('website', { label: 'Company website', placeholder: 'https://' })]
      ),
      pageBreak(),
      field('select', {
        label: 'What do you need help with?',
        required: true,
        options: ['A new product', 'Improving an existing one', 'Integration work', 'Consulting', 'Something else'],
      }),
      field('textarea', {
        label: 'Describe the project',
        required: true,
        placeholder: 'What problem are you solving, and for whom?',
      }),
      field('select', {
        label: 'Timeline',
        required: true,
        options: ['Starting now', 'Within a month', 'This quarter', 'Just researching'],
      }),
      pageBreak(),
      field('select', {
        label: 'Approximate budget',
        required: true,
        options: ['Under $5k', '$5k – $25k', '$25k – $100k', 'Over $100k', 'Not decided yet'],
      }),
      field('radio', {
        label: 'Who signs off on this?',
        options: ['I do', 'I recommend, someone else signs', 'Still figuring that out'],
      }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0b0f14',
      cardBg: '#12171f',
      cardBorder: '#1e2733',
      accentColor: '#22d3ee',
      labelColor: '#e2e8f0',
      inputBg: '#182029',
      inputBorder: '#26313d',
      inputTextColor: '#f1f5f9',
      textMode: 'light',
      cardRadius: 14,
      cardShadow: 'lg',
      fontFamily: 'inter',
      pageBackground: {
        gradient: 'radial-gradient(circle at 30% 20%, #38bdf8 0%, #0f172a 70%)',
        overlay: '#000000',
        overlayOpacity: 40,
      },
    },
  },
  {
    id: 'appointmentBooking',
    name: 'Appointment booking',
    description: 'Service, date and time, then contact details — for bookings and consultations.',
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
    id: 'bugReport',
    name: 'Bug report',
    description: 'Severity, reproduction steps, and a screenshot upload, in a monospace dark theme.',
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
  {
    id: 'donation',
    name: 'Donation',
    description: 'Amount, frequency, and donor details for a fundraising campaign.',
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
  {
    id: 'clientOnboarding',
    name: 'Client onboarding',
    description: 'Four-step intake covering company, goals, brand assets, and access.',
    title: 'Client onboarding',
    formDescription: 'One pass through this and we have everything we need to start.',
    submitLabel: 'Finish onboarding',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Company', description: 'The basics about your business.' },
      { title: 'Goals', description: 'What success looks like for you.' },
      { title: 'Brand', description: 'Logos, guidelines, anything visual.' },
      { title: 'Access', description: 'Where we will need to log in.' },
    ],
    fields: [
      row(
        [field('text', { label: 'Company name', required: true })],
        [field('website', { label: 'Website', placeholder: 'https://' })]
      ),
      row(
        [field('name', { label: 'Main contact', required: true })],
        [field('email', { label: 'Contact email', required: true })]
      ),
      field('select', {
        label: 'Company size',
        options: ['Just me', '2–10', '11–50', '51–200', '200+'],
      }),
      pageBreak(),
      field('textarea', {
        label: 'What are you hoping to achieve?',
        required: true,
        placeholder: 'The outcome, not the deliverable.',
      }),
      field('textarea', { label: 'How will you measure success?', placeholder: 'Metrics, milestones, or a gut feel.' }),
      field('date', { label: 'Target launch date' }),
      pageBreak(),
      field('imageUpload', { label: 'Logo' }),
      field('file', { label: 'Brand guidelines' }),
      field('textarea', { label: 'Brands or sites you admire', placeholder: 'Links are fine.' }),
      pageBreak(),
      field('textarea', {
        label: 'Systems we will need access to',
        placeholder: 'e.g. CMS, analytics, ad accounts — do not paste passwords here.',
      }),
      field('name', { label: 'Who grants that access?' }),
      field('terms', { label: 'I confirm the details above are accurate', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#111827',
      cardBg: '#f9fafb',
      cardBorder: '#e5e7eb',
      accentColor: '#111827',
      labelColor: '#111827',
      inputBg: '#ffffff',
      inputBorder: '#d1d5db',
      inputTextColor: '#111827',
      textMode: 'dark',
      cardRadius: 10,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)' },
    },
  },
  {
    id: 'quoteRequest',
    name: 'Quote request',
    description: 'Service scope and requirements, on a frosted glass card over a gradient.',
    title: 'Request a quote',
    formDescription: 'We will come back with a fixed price, not a range.',
    submitLabel: 'Get my quote',
    stepIndicator: 'counter',
    steps: [{ title: 'What you need' }, { title: 'Where to send it' }],
    fields: [
      field('select', {
        label: 'Service',
        required: true,
        options: ['Design', 'Development', 'Both', 'Ongoing support'],
      }),
      field('checkbox', {
        label: 'Included in scope',
        options: ['Discovery workshop', 'Branding', 'Website', 'Mobile app', 'Integrations', 'Maintenance'],
      }),
      field('textarea', {
        label: 'Anything unusual about this project?',
        placeholder: 'Constraints, deadlines, existing systems.',
      }),
      pageBreak(),
      row(
        [field('name', { label: 'Name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('text', { label: 'Company' }),
      field('select', {
        label: 'How soon do you need the quote?',
        options: ['Today', 'This week', 'No rush'],
      }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0f172a',
      cardBg: '#ffffff',
      cardBorder: '#ffffff',
      accentColor: '#6366f1',
      labelColor: '#0f172a',
      inputBg: '#ffffff',
      inputBorder: '#c7d2fe',
      inputTextColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 20,
      cardShadow: 'xl',
      cardOpacity: 85,
      cardBlur: 14,
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(120deg, #a7f3d0 0%, #93c5fd 50%, #c4b5fd 100%)' },
    },
  },
];
