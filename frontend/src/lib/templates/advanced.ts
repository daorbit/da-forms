import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/**
 * Templates built around the newer blocks — signature, matrix, ranking,
 * country, number range, rich text, and hidden tracking fields.
 *
 * These are the forms that were awkward to build before: a contract that ends
 * in a real signature rather than a tick, a survey that needs a rating grid,
 * a shortlist someone has to put in order.
 */
export const advancedTemplates: FormTemplate[] = [
  {
    id: 'engagementLetter',
    name: 'Engagement letter',
    description: 'Terms to read, a fee range, and a drawn signature to accept them.',
    category: 'Business',
    keywords: ['contract', 'signature', 'sign', 'agreement', 'terms', 'client'],
    title: 'Engagement letter',
    formDescription: 'Read the terms, add your details, and sign at the bottom.',
    submitLabel: 'Sign and return',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'The terms', description: 'What we are agreeing to.' },
      { title: 'Your details', description: 'Who is signing.' },
    ],
    fields: [
      field('richText', {
        label: 'Terms',
        content:
          '<h3>Scope of work</h3>' +
          '<p>We will carry out the work described in the attached proposal. Anything outside that ' +
          'scope is quoted separately before it begins — you will never receive an invoice for work ' +
          'you did not approve.</p>' +
          '<h3>Fees and payment</h3>' +
          '<ul>' +
          '<li>Invoices are issued monthly, payable within 30 days.</li>' +
          '<li>Expenses over $200 are agreed in advance.</li>' +
          '<li>Either side may end this engagement with 30 days written notice.</li>' +
          '</ul>' +
          '<p>Questions about any of this? Ask before you sign — a term you are unsure about is ' +
          'a term worth changing.</p>',
      }),
      field('numberRange', {
        label: 'Agreed fee range',
        required: true,
        min: 0,
        helpText: 'The band quoted in your proposal.',
      }),
      field('select', {
        label: 'Billing frequency',
        required: true,
        options: ['Monthly', 'On completion', 'In two instalments', 'Retainer'],
      }),
      pageBreak(),
      row(
        [field('name', { label: 'Signatory name', required: true })],
        [field('text', { label: 'Position', required: true, placeholder: 'Director' })]
      ),
      row(
        [field('text', { label: 'Company', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('country', { label: 'Country of registration', required: true }),
      field('date', { label: 'Date', required: true, initialValue: '__today__' }),
      field('signature', {
        label: 'Signature',
        required: true,
        helpText: 'Sign with a mouse, finger, or stylus.',
      }),
      field('terms', {
        label: 'I have authority to sign on behalf of the company named above',
        required: true,
        content: 'A signature here has the same effect as a signature on paper.',
      }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#1c1917',
      cardBg: '#ffffff',
      cardBorder: '#e7e5e4',
      accentColor: '#1c1917',
      labelColor: '#1c1917',
      inputBg: '#fafaf9',
      inputBorder: '#d6d3d1',
      inputTextColor: '#1c1917',
      textMode: 'dark',
      cardRadius: 2,
      cardShadow: 'xl',
      fontFamily: 'serif',
      pageBackground: { gradient: 'linear-gradient(180deg, #292524 0%, #1c1917 100%)' },
    },
  },
  {
    id: 'employeeEngagement',
    name: 'Employee engagement survey',
    description: 'Agreement grids across three themes, plus a ranked list of priorities.',
    category: 'HR',
    keywords: ['survey', 'engagement', 'matrix', 'pulse', 'staff', 'ranking'],
    title: 'How is work going?',
    formDescription: 'Anonymous. Results are shared with everyone, not just management.',
    submitLabel: 'Send my answers',
    stepIndicator: 'dots',
    showStepHeadings: true,
    steps: [
      { title: 'Your work', description: 'The day to day.' },
      { title: 'Your team', description: 'The people around you.' },
      { title: 'Priorities', description: 'What we should fix first.' },
    ],
    fields: [
      field('matrix', {
        label: 'How much do you agree?',
        required: true,
        rows: [
          'I know what is expected of me',
          'I have the tools to do my job well',
          'My workload is manageable',
          'I can switch off outside working hours',
        ],
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      }),
      field('slider', { label: 'How would you rate the last three months?', required: true, min: 0, max: 10, step: 1 }),
      pageBreak(),
      field('matrix', {
        label: 'Thinking about your team',
        required: true,
        rows: [
          'My manager gives me useful feedback',
          'Decisions are explained clearly',
          'I feel comfortable disagreeing',
          'Good work gets recognised',
        ],
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      }),
      field('textarea', { label: 'Anything you would change about how the team works?' }),
      pageBreak(),
      field('ranking', {
        label: 'Put these in the order we should tackle them',
        required: true,
        options: [
          'Pay and benefits',
          'Career progression',
          'Tools and equipment',
          'Workload and hours',
          'Communication from leadership',
        ],
      }),
      field('textarea', { label: 'Anything else?', placeholder: 'Optional' }),
      field('hidden', { label: 'Department', paramName: 'dept', initialValue: 'unspecified' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0f172a',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#4f46e5',
      labelColor: '#0f172a',
      inputBg: '#f8fafc',
      inputBorder: '#cbd5e1',
      inputTextColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 14,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(160deg, #312e81 0%, #0f172a 100%)' },
    },
  },
  {
    id: 'customerSatisfaction',
    name: 'Customer satisfaction survey',
    description: 'A satisfaction grid, a ranked wishlist, and hidden campaign tracking.',
    category: 'Support',
    keywords: ['csat', 'survey', 'matrix', 'feedback', 'customer', 'utm'],
    title: 'Tell us how we are doing',
    formDescription: 'Three minutes, and it shapes what we build next quarter.',
    submitLabel: 'Send feedback',
    fields: [
      field('matrix', {
        label: 'How satisfied are you with each of these?',
        required: true,
        rows: ['Ease of use', 'Reliability', 'Value for money', 'Support', 'Documentation'],
        options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'],
      }),
      field('ranking', {
        label: 'Which should we improve first?',
        options: ['Speed', 'New features', 'Pricing', 'Integrations', 'Mobile app'],
      }),
      field('textarea', { label: 'What is the one thing we should fix?', required: true }),
      field('country', { label: 'Where are you based?' }),
      field('yesNo', { label: 'May we contact you about your answers?' }),
      field('email', { label: 'Email', placeholder: 'Only if you said yes above' }),
      // Carried on the link, so a campaign's responses can be told apart
      // without asking the respondent where they came from.
      field('hidden', { label: 'Campaign', paramName: 'utm_campaign' }),
      field('hidden', { label: 'Source', paramName: 'utm_source' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#ecfeff',
      cardBg: '#ffffff',
      cardBorder: '#a5f3fc',
      accentColor: '#0891b2',
      labelColor: '#164e63',
      inputBg: '#f7feff',
      inputBorder: '#a5f3fc',
      inputTextColor: '#164e63',
      textMode: 'dark',
      cardRadius: 16,
      cardShadow: 'lg',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(150deg, #cffafe 0%, #ecfeff 60%)' },
    },
  },
  {
    id: 'deliveryHandover',
    name: 'Delivery handover',
    description: 'Condition checks, a recipient signature, and a delivery window.',
    category: 'Commerce',
    keywords: ['delivery', 'handover', 'proof', 'signature', 'courier', 'received'],
    title: 'Proof of delivery',
    formDescription: 'Completed by the driver with the recipient present.',
    submitLabel: 'Confirm handover',
    fields: [
      field('randomId', { label: 'Delivery reference' }),
      row(
        [field('text', { label: 'Order number', required: true, unique: true })],
        [field('datetime', { label: 'Delivered at', required: true, initialValue: '__now__' })]
      ),
      field('address', { label: 'Delivery address', required: true }),
      field('country', { label: 'Country', required: true }),
      field('divider', { label: '' }),
      field('matrix', {
        label: 'Condition on arrival',
        required: true,
        rows: ['Outer packaging', 'Contents', 'Seals intact', 'Item count correct'],
        options: ['Good', 'Minor issue', 'Damaged'],
      }),
      field('textarea', { label: 'Notes on any issue', placeholder: 'Only if something above is not "Good".' }),
      field('imageUpload', { label: 'Photo at handover' }),
      field('divider', { label: '' }),
      row(
        [field('name', { label: 'Received by', required: true })],
        [field('phone', { label: 'Contact number' })]
      ),
      field('signature', { label: 'Recipient signature', required: true }),
      field('decisionBox', { label: 'Email me a copy of this receipt' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f8fafc',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#0f766e',
      labelColor: '#0f172a',
      inputBg: '#f8fafc',
      inputBorder: '#cbd5e1',
      inputTextColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 8,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
  {
    id: 'grantApplication',
    name: 'Grant application',
    description: 'Eligibility terms, a funding range, ranked outcomes, and a declaration.',
    category: 'Community',
    keywords: ['grant', 'funding', 'application', 'charity', 'award', 'bid'],
    title: 'Apply for a grant',
    formDescription: 'Applications are assessed monthly. Incomplete forms are not carried over.',
    submitLabel: 'Submit application',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Eligibility', description: 'Check you can apply.' },
      { title: 'Your project', description: 'What the money is for.' },
      { title: 'Declaration', description: 'Confirm and sign.' },
    ],
    fields: [
      field('richText', {
        label: 'Who can apply',
        content:
          '<p>This fund is open to <strong>registered charities and community groups</strong> ' +
          'operating for at least twelve months.</p>' +
          '<ul>' +
          '<li>Grants range from $2,000 to $25,000.</li>' +
          '<li>We do not fund retrospective costs or general reserves.</li>' +
          '<li>One application per organisation per year.</li>' +
          '</ul>',
      }),
      row(
        [field('text', { label: 'Organisation name', required: true })],
        [field('text', { label: 'Registration number', required: true })]
      ),
      field('country', { label: 'Country of operation', required: true }),
      field('monthYear', { label: 'Operating since', required: true }),
      field('yesNo', { label: 'Have you received a grant from us before?', required: true }),
      pageBreak(),
      field('text', { label: 'Project title', required: true, maxLength: 100 }),
      field('textarea', { label: 'What will the money do?', required: true, maxLength: 1500 }),
      field('numberRange', {
        label: 'Amount requested',
        required: true,
        min: 2000,
        max: 25000,
        helpText: 'A range is fine at this stage.',
      }),
      field('ranking', {
        label: 'Rank the outcomes this project delivers',
        required: true,
        options: [
          'Reducing isolation',
          'Skills and training',
          'Health and wellbeing',
          'Environmental impact',
          'Access to services',
        ],
      }),
      field('number', { label: 'People directly reached', required: true, min: 1 }),
      field('file', { label: 'Latest annual accounts', required: true }),
      pageBreak(),
      row(
        [field('name', { label: 'Authorised signatory', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('signature', { label: 'Signature', required: true }),
      field('date', { label: 'Date', required: true, initialValue: '__today__' }),
      field('terms', {
        label: 'I confirm this application is accurate and complete',
        required: true,
        content:
          'Funds must be spent on the project described. We ask for a short report six months after any award.',
      }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#fffbeb',
      cardBg: '#ffffff',
      cardBorder: '#fde68a',
      accentColor: '#b45309',
      labelColor: '#451a03',
      inputBg: '#fffdf5',
      inputBorder: '#fde68a',
      inputTextColor: '#451a03',
      textMode: 'dark',
      cardRadius: 12,
      cardShadow: 'lg',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(160deg, #fef3c7 0%, #fffbeb 60%)' },
    },
  },
  {
    id: 'conferenceFeedback',
    name: 'Conference feedback',
    description: 'Session ratings in a grid, ranked highlights, and travel origin.',
    category: 'Hospitality',
    keywords: ['event', 'conference', 'feedback', 'sessions', 'matrix', 'attendee'],
    title: 'How was the conference?',
    formDescription: 'Your answers decide the programme for next year.',
    submitLabel: 'Send feedback',
    fields: [
      field('matrix', {
        label: 'Rate each part of the day',
        required: true,
        rows: ['Opening keynote', 'Breakout sessions', 'Panel discussion', 'Catering', 'Venue'],
        options: ['Poor', 'Fair', 'Good', 'Excellent'],
      }),
      field('ranking', {
        label: 'What brought you here? Most important first.',
        options: ['The speakers', 'Networking', 'A specific session', 'The venue', 'My employer sent me'],
      }),
      field('rating', { label: 'Overall', required: true, maxRating: 5 }),
      field('country', { label: 'Where did you travel from?' }),
      field('numberRange', { label: 'What would you pay for a ticket next year?', min: 0, max: 2000 }),
      field('textarea', { label: 'What should we do differently?' }),
      field('decisionBox', { label: 'Tell me when next year’s tickets open' }),
      field('email', { label: 'Email', placeholder: 'Only if you ticked the box above' }),
      field('hidden', { label: 'Ticket type', paramName: 'ticket' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#1e1b4b',
      cardBg: '#ffffff',
      cardBorder: '#ddd6fe',
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
        gradient: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
      },
    },
  },
];
