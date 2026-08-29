import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/**
 * Full-page forms with a considered look — the ones sent as a standalone link
 * to a client, a candidate, or a partner, where the page itself is the pitch.
 */
export const professionalTemplates: FormTemplate[] = [
  {
    id: 'projectBrief',
    name: 'Project brief',
    description: 'Scope, audience, deliverables, and budget across four steps.',
    category: 'Business',
    keywords: ['agency', 'brief', 'scope', 'creative', 'proposal'],
    title: 'Project brief',
    formDescription: 'Everything we need to price the work and start without a second call.',
    submitLabel: 'Send brief',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Context', description: 'Who you are and what you do.' },
      { title: 'The work', description: 'What needs to exist at the end.' },
      { title: 'Audience', description: 'Who it has to land with.' },
      { title: 'Practicals', description: 'Money and dates.' },
    ],
    fields: [
      row(
        [field('text', { label: 'Company', required: true })],
        [field('website', { label: 'Website', placeholder: 'https://' })]
      ),
      row(
        [field('name', { label: 'Main contact', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('textarea', { label: 'What does your company do?', required: true, maxLength: 600 }),
      pageBreak(),
      field('checkbox', {
        label: 'Deliverables',
        required: true,
        options: ['Brand identity', 'Website', 'Mobile app', 'Campaign', 'Content', 'Research'],
      }),
      field('textarea', {
        label: 'What problem should this solve?',
        required: true,
        placeholder: 'The outcome, not the artefact.',
      }),
      field('textarea', { label: 'What already exists?', placeholder: 'Current site, brand assets, research.' }),
      pageBreak(),
      field('textarea', { label: 'Who is this for?', required: true, placeholder: 'Be specific — not "everyone".' }),
      field('textarea', { label: 'Who are your competitors?' }),
      field('textarea', { label: 'Work you admire', placeholder: 'Links, and a line on why.' }),
      pageBreak(),
      row(
        [field('select', { label: 'Budget', required: true, options: ['Under $10k', '$10k – $50k', '$50k – $150k', 'Over $150k'] })],
        [field('date', { label: 'Needed by' })]
      ),
      field('radio', {
        label: 'How firm is that date?',
        options: ['Fixed — tied to a launch', 'Preferred', 'Flexible'],
      }),
      field('textarea', { label: 'Anything else?' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0a0a0a',
      cardBg: '#ffffff',
      cardBorder: '#e5e5e5',
      accentColor: '#171717',
      labelColor: '#171717',
      inputBg: '#fafafa',
      inputBorder: '#d4d4d4',
      inputTextColor: '#171717',
      textMode: 'dark',
      cardRadius: 2,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(180deg, #171717 0%, #0a0a0a 100%)' },
    },
  },
  {
    id: 'consultationRequest',
    name: 'Consultation request',
    description: 'A professional services intake — matter type, urgency, and conflict check.',
    category: 'Business',
    keywords: ['legal', 'accountant', 'advisor', 'consultation', 'firm'],
    title: 'Request a consultation',
    formDescription: 'Submitting this does not create a client relationship.',
    submitLabel: 'Request consultation',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'About you', description: 'Contact details for our records.' },
      { title: 'Your matter', description: 'Enough for us to check we can act.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Full name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      row(
        [field('phone', { label: 'Phone', required: true })],
        [field('text', { label: 'Company', placeholder: 'If applicable' })]
      ),
      field('radio', {
        label: 'How would you like to meet?',
        required: true,
        options: ['In person', 'Video call', 'Phone'],
      }),
      pageBreak(),
      field('select', {
        label: 'Area',
        required: true,
        options: ['Commercial', 'Employment', 'Property', 'Tax', 'Disputes', 'Something else'],
      }),
      field('textarea', {
        label: 'Summarise the matter',
        required: true,
        placeholder: 'A short factual outline. Do not send confidential documents yet.',
        maxLength: 1500,
      }),
      field('select', {
        label: 'Urgency',
        required: true,
        options: ['There is a deadline this week', 'Within a month', 'Planning ahead'],
      }),
      field('text', { label: 'Other parties involved', helpText: 'So we can run a conflict check.' }),
      field('terms', { label: 'I understand this enquiry is not legal advice', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0f172a',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#1e3a8a',
      labelColor: '#0f172a',
      inputBg: '#f8fafc',
      inputBorder: '#cbd5e1',
      inputTextColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 6,
      cardShadow: 'xl',
      fontFamily: 'serif',
      pageBackground: { gradient: 'linear-gradient(170deg, #1e293b 0%, #0f172a 100%)' },
    },
  },
  {
    id: 'partnershipEnquiry',
    name: 'Partnership enquiry',
    description: 'Company, partnership type, and reach — for BD and reseller enquiries.',
    category: 'Business',
    keywords: ['partner', 'reseller', 'affiliate', 'business development', 'integration'],
    title: 'Partner with us',
    formDescription: 'We review every enquiry and reply within a week.',
    submitLabel: 'Send enquiry',
    fields: [
      row(
        [field('text', { label: 'Company', required: true })],
        [field('website', { label: 'Website', required: true, placeholder: 'https://' })]
      ),
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('email', { label: 'Work email', required: true })]
      ),
      field('select', {
        label: 'Type of partnership',
        required: true,
        options: ['Reseller', 'Technology integration', 'Referral', 'Co-marketing', 'Something else'],
      }),
      field('select', {
        label: 'Company size',
        required: true,
        options: ['1–10', '11–50', '51–200', '201–1000', '1000+'],
      }),
      field('textarea', {
        label: 'What do you have in mind?',
        required: true,
        placeholder: 'The shape of the partnership, and what each side brings.',
      }),
      field('textarea', { label: 'Who is your audience?', placeholder: 'Segments, regions, rough numbers.' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#020617',
      cardBg: '#0b1220',
      cardBorder: '#1e293b',
      accentColor: '#6366f1',
      labelColor: '#e2e8f0',
      inputBg: '#0f172a',
      inputBorder: '#1e293b',
      inputTextColor: '#f8fafc',
      textMode: 'light',
      cardRadius: 14,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: {
        gradient: 'radial-gradient(circle at 20% 0%, #312e81 0%, #020617 65%)',
      },
    },
  },
  {
    id: 'vendorOnboarding',
    name: 'Vendor onboarding',
    description: 'Supplier details, compliance documents, and banking, in three steps.',
    category: 'Business',
    keywords: ['supplier', 'procurement', 'compliance', 'vendor', 'accounts'],
    title: 'Vendor registration',
    formDescription: 'Complete this before your first invoice so payment is not held up.',
    submitLabel: 'Register',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Company', description: 'Legal entity and contact.' },
      { title: 'Compliance', description: 'The documents procurement needs.' },
      { title: 'Payment', description: 'Where invoices are paid.' },
    ],
    fields: [
      row(
        [field('text', { label: 'Registered company name', required: true })],
        [field('text', { label: 'Company number', required: true })]
      ),
      field('address', { label: 'Registered address', required: true }),
      row(
        [field('name', { label: 'Primary contact', required: true })],
        [field('email', { label: 'Contact email', required: true })]
      ),
      pageBreak(),
      field('select', {
        label: 'What do you supply?',
        required: true,
        options: ['Goods', 'Services', 'Software', 'Consulting', 'Mixed'],
      }),
      field('file', { label: 'Insurance certificate', required: true }),
      field('file', { label: 'Tax registration' }),
      field('yesNo', { label: 'Do you subcontract any of this work?' }),
      pageBreak(),
      row(
        [field('text', { label: 'Bank account name', required: true })],
        [field('text', { label: 'Payment terms', placeholder: 'e.g. Net 30' })]
      ),
      field('textarea', {
        label: 'Invoicing notes',
        placeholder: 'Purchase order requirements, billing contact, anything unusual.',
        helpText: 'Do not enter full account numbers here — we collect those over a secure channel.',
      }),
      field('terms', { label: 'I confirm the information above is accurate', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f1f5f9',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#0f766e',
      labelColor: '#0f172a',
      inputBg: '#f8fafc',
      inputBorder: '#cbd5e1',
      inputTextColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 10,
      cardShadow: 'lg',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 60%)' },
    },
  },
  {
    id: 'speakerProposal',
    name: 'Speaker proposal',
    description: 'Talk abstract, format, and speaker bio for a conference call for papers.',
    category: 'Business',
    keywords: ['conference', 'cfp', 'talk', 'speaker', 'submission'],
    title: 'Submit a talk',
    formDescription: 'Proposals are reviewed anonymously — keep your name out of the abstract.',
    submitLabel: 'Submit proposal',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'The talk', description: 'What you want to present.' },
      { title: 'About you', description: 'Reviewed after the abstract is scored.' },
    ],
    fields: [
      field('text', { label: 'Talk title', required: true, maxLength: 90 }),
      field('select', {
        label: 'Format',
        required: true,
        options: ['Lightning talk (10 min)', 'Standard (30 min)', 'Deep dive (45 min)', 'Workshop (2 hr)'],
      }),
      field('select', {
        label: 'Track',
        required: true,
        options: ['Engineering', 'Design', 'Product', 'Leadership', 'Research'],
      }),
      field('textarea', { label: 'Abstract', required: true, maxLength: 1200 }),
      field('textarea', { label: 'What will the audience take away?', required: true, maxLength: 400 }),
      pageBreak(),
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('textarea', { label: 'Short bio', required: true, maxLength: 400 }),
      field('website', { label: 'A previous talk or writing', placeholder: 'https://' }),
      field('yesNo', { label: 'Do you need a travel bursary?' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#18181b',
      cardBg: '#fafafa',
      cardBorder: '#e4e4e7',
      accentColor: '#c026d3',
      labelColor: '#18181b',
      inputBg: '#ffffff',
      inputBorder: '#d4d4d8',
      inputTextColor: '#18181b',
      textMode: 'dark',
      cardRadius: 18,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: {
        gradient: 'linear-gradient(135deg, #701a75 0%, #18181b 70%)',
      },
    },
  },
  {
    id: 'accountOpening',
    name: 'Account opening',
    description: 'Identity, address history, and declarations for a regulated signup.',
    category: 'Business',
    keywords: ['kyc', 'onboarding', 'identity', 'bank', 'finance'],
    title: 'Open an account',
    formDescription: 'We verify every application. Have a photo ID to hand.',
    submitLabel: 'Submit application',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Identity', description: 'As shown on your ID.' },
      { title: 'Address', description: 'Where you currently live.' },
      { title: 'Declarations', description: 'Required by our regulator.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Full legal name', required: true })],
        [field('date', { label: 'Date of birth', required: true })]
      ),
      row(
        [field('email', { label: 'Email', required: true, unique: true })],
        [field('phone', { label: 'Mobile', required: true })]
      ),
      field('imageUpload', { label: 'Photo ID', required: true }),
      pageBreak(),
      field('address', { label: 'Current address', required: true }),
      field('select', {
        label: 'How long at this address?',
        required: true,
        options: ['Less than a year', '1–3 years', 'More than 3 years'],
      }),
      field('file', { label: 'Proof of address', helpText: 'A utility bill or bank statement from the last 3 months.' }),
      pageBreak(),
      field('select', {
        label: 'Employment status',
        required: true,
        options: ['Employed', 'Self-employed', 'Student', 'Retired', 'Not working'],
      }),
      field('select', {
        label: 'Source of funds',
        required: true,
        options: ['Salary', 'Business income', 'Savings', 'Investments', 'Inheritance', 'Other'],
      }),
      field('yesNo', { label: 'Are you a politically exposed person?', required: true }),
      field('terms', { label: 'I confirm the information is true and complete', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#052e16',
      cardBg: '#ffffff',
      cardBorder: '#dcfce7',
      accentColor: '#15803d',
      labelColor: '#052e16',
      inputBg: '#f7fdf9',
      inputBorder: '#bbf7d0',
      inputTextColor: '#052e16',
      textMode: 'dark',
      cardRadius: 8,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(170deg, #14532d 0%, #052e16 100%)' },
    },
  },
];
