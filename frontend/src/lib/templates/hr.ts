import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Internal people forms — the ones staff fill in, not customers. */
export const hrTemplates: FormTemplate[] = [
  {
    id: 'timeOffRequest',
    name: 'Time off request',
    description: 'Dates, type of leave, and cover arrangements, on one page.',
    category: 'HR',
    keywords: ['holiday', 'leave', 'vacation', 'pto', 'absence'],
    title: 'Request time off',
    formDescription: 'Your manager is notified as soon as you submit.',
    submitLabel: 'Send request',
    fields: [
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('text', { label: 'Team', required: true })]
      ),
      field('select', {
        label: 'Type of leave',
        required: true,
        options: ['Annual leave', 'Sick leave', 'Parental leave', 'Unpaid', 'Other'],
      }),
      row(
        [field('date', { label: 'First day away', required: true })],
        [field('date', { label: 'Last day away', required: true })]
      ),
      field('number', { label: 'Working days requested', min: 0, max: 60 }),
      field('textarea', { label: 'Who is covering for you?', placeholder: 'Name, and what they are covering.' }),
      field('text', { label: "Manager's email", required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f8fafc',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#2563eb',
      labelColor: '#0f172a',
      textMode: 'dark',
      cardRadius: 10,
      cardShadow: 'sm',
      fontFamily: 'inter',
    },
  },
  {
    id: 'employeeOnboarding',
    name: 'Employee onboarding',
    description: 'New starter details, equipment, and policy sign-off in three steps.',
    category: 'HR',
    keywords: ['new hire', 'starter', 'induction', 'first day'],
    title: 'Welcome aboard',
    formDescription: 'Fill this in before your first day so everything is ready.',
    submitLabel: 'Finish setup',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Details', description: 'For payroll and your record.' },
      { title: 'Setup', description: 'What you need to do the job.' },
      { title: 'Policies', description: 'The things you have to read once.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Full legal name', required: true })],
        [field('email', { label: 'Personal email', required: true })]
      ),
      row(
        [field('phone', { label: 'Phone', required: true })],
        [field('date', { label: 'Start date', required: true })]
      ),
      field('address', { label: 'Home address', required: true }),
      pageBreak(),
      field('radio', { label: 'Laptop', required: true, options: ['MacBook', 'Windows laptop', 'Linux laptop'] }),
      field('checkbox', {
        label: 'Extras you need',
        options: ['External monitor', 'Keyboard and mouse', 'Headset', 'Standing desk', 'Second screen'],
      }),
      field('text', { label: 'T-shirt size', placeholder: 'M' }),
      field('textarea', { label: 'Any accessibility needs we should plan for?' }),
      pageBreak(),
      field('terms', { label: 'I have read the employee handbook', required: true }),
      field('terms', { label: 'I have read the security and data policy', required: true }),
      field('decisionBox', { label: 'Add me to the internal social channel' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#111827',
      cardBg: '#ffffff',
      cardBorder: '#e5e7eb',
      accentColor: '#7c3aed',
      labelColor: '#111827',
      inputBg: '#ffffff',
      inputBorder: '#d1d5db',
      inputTextColor: '#111827',
      textMode: 'dark',
      cardRadius: 16,
      cardShadow: 'xl',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(140deg, #312e81 0%, #111827 100%)' },
    },
  },
  {
    id: 'expenseClaim',
    name: 'Expense claim',
    description: 'Amount, category, and a receipt upload for reimbursement.',
    category: 'HR',
    keywords: ['reimbursement', 'receipt', 'finance', 'claim'],
    title: 'Claim an expense',
    formDescription: 'Claims submitted before the 25th are paid with that month’s salary.',
    submitLabel: 'Submit claim',
    fields: [
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('date', { label: 'Date of expense', required: true })]
      ),
      field('select', {
        label: 'Category',
        required: true,
        options: ['Travel', 'Accommodation', 'Meals', 'Software', 'Equipment', 'Other'],
      }),
      row(
        [field('currency', { label: 'Amount', required: true, min: 0 })],
        [field('text', { label: 'Currency', initialValue: 'USD' })]
      ),
      field('textarea', { label: 'What was it for?', required: true }),
      field('file', { label: 'Receipt', required: true }),
      field('terms', { label: 'This claim is accurate and unreimbursed elsewhere', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#fafaf9',
      cardBg: '#ffffff',
      cardBorder: '#e7e5e4',
      accentColor: '#059669',
      labelColor: '#1c1917',
      textMode: 'dark',
      cardRadius: 10,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
  {
    id: 'exitInterview',
    name: 'Exit interview',
    description: 'Why someone is leaving, what would have kept them, and a rating.',
    category: 'HR',
    keywords: ['offboarding', 'resignation', 'leaver', 'retention'],
    title: 'Before you go',
    formDescription: 'Honest answers here change what we do next. Nothing is attributed.',
    submitLabel: 'Send',
    fields: [
      field('select', {
        label: 'Main reason for leaving',
        required: true,
        options: ['New opportunity', 'Compensation', 'Management', 'Growth', 'Relocation', 'Personal'],
      }),
      field('rating', { label: 'How would you rate your time here?', required: true, maxRating: 5 }),
      field('textarea', { label: 'What did we get right?' }),
      field('textarea', { label: 'What would have made you stay?' }),
      field('yesNo', { label: 'Would you consider working here again?' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#18181b',
      cardBg: '#27272a',
      cardBorder: '#3f3f46',
      accentColor: '#a1a1aa',
      labelColor: '#e4e4e7',
      inputBg: '#1f1f23',
      inputBorder: '#3f3f46',
      inputTextColor: '#fafafa',
      textMode: 'light',
      cardRadius: 12,
      cardShadow: 'lg',
      fontFamily: 'inter',
    },
  },
];
