import type { FormField } from '@/types';
import type { FormTemplate } from './types';
import { field, row } from './types';

const ART = '/templates/calm-kids';

const AGREEMENT = ['Strongly disagree', 'Somewhat disagree', 'Somewhat agree', 'Strongly agree'];

function agree(label: string): FormField {
  return field('radio', { label, required: true, options: AGREEMENT, choiceLayout: 'cards', cardColumns: 1 });
}

function section(content: string): FormField {
  return field('description', { content });
}

const planField = field('radio', {
  label: 'Choose your plan',
  required: true,
  options: ['1-week trial', '1-month plan', '3-month plan'],
  choiceLayout: 'cards',
  cardColumns: 1,
  optionBadges: { '1-month plan': 'Most popular' },
  optionHints: {
    '1-week trial': '₹199 · try every activity',
    '1-month plan': '₹499 · ₹16 a day',
    '3-month plan': '₹999 · best value, ₹11 a day',
  },
});

const calmKidsQuiz: FormTemplate = {
  id: 'calmKidsQuiz',
  name: 'Calm kids plan quiz',
  description:
    'A tap-through parenting quiz with picture cards, an analyzing screen, email capture and a plan picker with a countdown.',
  category: 'Quiz Funnels',
  keywords: ['quiz', 'funnel', 'parenting', 'kids', 'children', 'personal plan', 'paywall', 'subscription', 'lead magnet'],
  title: 'Calm Kids Plan',
  formDescription: 'Answer a few quick questions and get a playful daily plan for a calmer, more focused child.',
  submitLabel: 'Get my plan',
  oneQuestionAtATime: true,
  stepIndicator: 'progress',
  thankYouMessage: "Your child's calm plan is on its way. Check your inbox for the first activity.",
  fields: [
    section('About your child'),
    field('radio', {
      label: 'Who are you raising?',
      required: true,
      options: ['Boy', 'Girl'],
      choiceLayout: 'cards',
      cardColumns: 2,
      optionImages: { Boy: `${ART}/boy.svg`, Girl: `${ART}/girl.svg` },
    }),
    field('radio', {
      label: 'How old is your child?',
      required: true,
      options: ['3–4', '5–6', '7–9', '10+'],
      choiceLayout: 'cards',
      cardColumns: 2,
    }),
    section('Behaviour patterns · Do you agree?'),
    agree('My child struggles with waiting their turn'),
    agree('Big feelings quickly turn into meltdowns'),
    agree('Bedtime is a daily battle in our home'),
    agree('My child finds it hard to focus on one thing'),
    section('Hidden signals'),
    field('image', {
      imageUrl: `${ART}/habits.svg`,
      imageAlt: 'A child biting their nails',
      imageWidth: 'full',
    }),
    field('radio', {
      label: 'Does your child have nervous habits, like nail-biting or lip-chewing?',
      required: true,
      options: ['No, not really', 'Yes, sometimes', 'Yes, often'],
      choiceLayout: 'cards',
      cardColumns: 1,
    }),
    section('Your goals'),
    field('checkbox', {
      label: 'What would you most like to improve?',
      required: true,
      options: ['Focus and attention', 'Calmer bedtimes', 'Fewer meltdowns', 'Healthier screen time', 'Confidence'],
      choiceLayout: 'cards',
      cardColumns: 1,
      instructions: 'Pick all that apply.',
    }),
    field('radio', {
      label: 'How much time can you spend together each day?',
      required: true,
      options: ['5–10 minutes', '10–20 minutes', 'More than 20 minutes'],
      choiceLayout: 'cards',
      cardColumns: 1,
    }),
    field('loader', {
      label: 'Building your calm plan…',
      content:
        'Reviewing your answers\nMatching activities to your child’s age\nBalancing focus and calm-down games\nPutting your daily plan together',
      duration: 6,
    }),
    field('image', {
      imageUrl: `${ART}/family.svg`,
      imageAlt: 'A parent and child smiling together',
      imageWidth: 'full',
    }),
    field('email', {
      label: 'Where should we send your child’s plan?',
      required: true,
      placeholder: 'you@example.com',
      helpText: 'We’ll email the plan and the first activity. No spam.',
    }),
    field('heading', { content: 'Your personal plan is ready' }),
    field('countdown', {
      label: 'Your launch discount is reserved for',
      content: 'The launch discount has ended',
      duration: 15,
    }),
    row([
      planField,
      field('payment', {
        label: 'Payment',
        required: true,
        pay: {
          mode: 'field',
          amountFieldId: planField.id,
          optionPrices: { '1-week trial': 19900, '1-month plan': 49900, '3-month plan': 99900 },
          currency: 'INR',
          description: 'Calm Kids Plan',
          buttonLabel: 'Start my plan',
        },
      }),
      field('terms', {
        label: 'I agree to the Terms of Use, Privacy Policy and Subscription Policy',
        required: true,
      }),
    ]),
  ],
  theme: {
    scope: 'page',
    pageBg: '#f5f3ff',
    cardBg: '#ffffff',
    cardBorder: '#e9e5ff',
    accentColor: '#6d4fe0',
    labelColor: '#1f1747',
    inputBg: '#ffffff',
    inputBorder: '#e2ddfb',
    inputTextColor: '#1f1747',
    textMode: 'dark',
    cardRadius: 20,
    cardShadow: 'md',
    fontFamily: 'jakarta',
  },
};

/** Tap-through quiz funnels: one question per screen, picture cards, an analyzing moment and an offer. */
export const funnelTemplates: FormTemplate[] = [calmKidsQuiz];
