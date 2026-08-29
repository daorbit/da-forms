import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Longer, multi-step intake forms for hiring, sales, and onboarding. */
export const businessTemplates: FormTemplate[] = [
  {
    id: 'jobApplication',
    name: 'Job application',
    description: 'Three-step application — candidate details, experience, and CV upload. Stepper progress.',
    category: 'Business',
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
    id: 'leadQualification',
    name: 'Lead qualification',
    description: 'Budget, timeline, and use case — a sales-ready qualification form.',
    category: 'Business',
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
    id: 'clientOnboarding',
    name: 'Client onboarding',
    description: 'Four-step intake covering company, goals, brand assets, and access.',
    category: 'Business',
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
    category: 'Business',
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
