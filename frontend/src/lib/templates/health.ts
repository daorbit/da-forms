import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Clinic and wellbeing intake — calm themes, careful wording. */
export const healthTemplates: FormTemplate[] = [
  {
    id: 'patientIntake',
    name: 'Patient intake',
    description: 'Contact details, history, and current medication across three steps.',
    category: 'Health',
    keywords: ['clinic', 'medical', 'doctor', 'history', 'new patient'],
    title: 'New patient form',
    formDescription: 'Filled in before your first visit so the appointment is all consultation.',
    submitLabel: 'Submit',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'Your details', description: 'How we reach you.' },
      { title: 'History', description: 'What we should know in advance.' },
      { title: 'Consent', description: 'Confirm and send.' },
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
      field('address', { label: 'Home address' }),
      pageBreak(),
      field('textarea', { label: 'Reason for the visit', required: true }),
      field('checkbox', {
        label: 'Do any of these apply?',
        options: ['Diabetes', 'High blood pressure', 'Asthma', 'Heart condition', 'None of these'],
      }),
      field('textarea', { label: 'Current medication', placeholder: 'Name and dose, one per line.' }),
      field('textarea', { label: 'Allergies' }),
      pageBreak(),
      row(
        [field('name', { label: 'Emergency contact', required: true })],
        [field('phone', { label: 'Their phone', required: true })]
      ),
      field('terms', { label: 'I consent to the clinic storing this information', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f0f9ff',
      cardBg: '#ffffff',
      cardBorder: '#bae6fd',
      accentColor: '#0284c7',
      labelColor: '#0c4a6e',
      inputBg: '#f8fdff',
      inputBorder: '#bae6fd',
      inputTextColor: '#0c4a6e',
      textMode: 'dark',
      cardRadius: 14,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
  {
    id: 'symptomCheck',
    name: 'Symptom check',
    description: 'A short triage form — symptoms, duration, and severity.',
    category: 'Health',
    keywords: ['triage', 'screening', 'symptoms', 'telehealth'],
    title: 'Tell us how you are feeling',
    formDescription: 'This is not a diagnosis — it helps us decide how quickly to see you.',
    submitLabel: 'Send',
    fields: [
      field('checkbox', {
        label: 'Which symptoms do you have?',
        required: true,
        options: ['Fever', 'Cough', 'Headache', 'Fatigue', 'Shortness of breath', 'Pain'],
      }),
      field('select', {
        label: 'How long have you had them?',
        required: true,
        options: ['Less than a day', '1–3 days', 'About a week', 'More than a week'],
      }),
      field('slider', { label: 'How severe, from 0 to 10?', required: true, min: 0, max: 10, step: 1 }),
      field('yesNo', { label: 'Have you taken anything for it?' }),
      field('textarea', { label: 'Anything else to add?' }),
      field('email', { label: 'Email', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#ecfeff',
      cardBg: '#ffffff',
      cardBorder: '#a5f3fc',
      accentColor: '#0891b2',
      labelColor: '#164e63',
      textMode: 'dark',
      cardRadius: 18,
      cardShadow: 'md',
      fontFamily: 'rounded',
    },
  },
  {
    id: 'gymMembership',
    name: 'Gym membership',
    description: 'Plan choice, health declaration, and emergency contact.',
    category: 'Health',
    keywords: ['fitness', 'membership', 'signup', 'par-q', 'studio'],
    title: 'Join the gym',
    formDescription: 'Sign up in a minute — your first session can be today.',
    submitLabel: 'Join now',
    stepIndicator: 'dots',
    steps: [{ title: 'Plan' }, { title: 'You' }],
    fields: [
      field('radio', {
        label: 'Membership',
        required: true,
        options: ['Off-peak', 'Full access', 'Full access + classes', 'Day pass'],
      }),
      field('select', {
        label: 'Billing',
        required: true,
        options: ['Monthly rolling', '12 months upfront', 'Pay as you go'],
      }),
      field('date', { label: 'Preferred start date' }),
      pageBreak(),
      row(
        [field('name', { label: 'Full name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('phone', { label: 'Phone', required: true }),
      field('yesNo', {
        label: 'Has a doctor ever advised you against exercise?',
        required: true,
        helpText: 'If yes, bring written clearance to your first session.',
      }),
      field('terms', { label: 'I accept the membership terms', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#0a0a0a',
      cardBg: '#141414',
      cardBorder: '#2a2a2a',
      accentColor: '#84cc16',
      labelColor: '#e5e5e5',
      inputBg: '#0f0f0f',
      inputBorder: '#2a2a2a',
      inputTextColor: '#fafafa',
      textMode: 'light',
      cardRadius: 10,
      cardShadow: 'lg',
      fontFamily: 'inter',
    },
  },
];
