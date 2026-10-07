import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';
import { fullName, look } from './proKit';

export const featuredTemplates: FormTemplate[] = [
  {
    id: 'featured-waitlist',
    name: 'Product waitlist',
    description: 'A calm, minimal early-access page with a single clear action.',
    category: 'Featured',
    keywords: ['launch', 'beta', 'early access', 'signup', 'coming soon'],
    title: 'Be first in line',
    formDescription: 'We are opening access in small batches. Leave your details and we will save you a spot.',
    submitLabel: 'Join the waitlist',
    fields: [
      fullName(),
      field('email', { label: 'Work email', required: true, placeholder: 'jordan@company.com' }),
      field('select', {
        label: 'What best describes you?',
        placeholder: 'Choose your role',
        options: ['Founder', 'Product', 'Engineering', 'Design', 'Marketing', 'Other'],
      }),
      field('decisionBox', { label: 'Email me product news and launch updates' }),
    ],
    theme: look('studio'),
  },
  {
    id: 'featured-onboarding',
    name: 'Client onboarding',
    description: 'A three-step intake for agencies and studios, in a refined dark finish.',
    category: 'Featured',
    keywords: ['agency', 'client', 'intake', 'kickoff', 'project'],
    title: 'Welcome aboard',
    formDescription: 'A few details so we can hit the ground running on day one.',
    submitLabel: 'Submit onboarding',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'About you', description: 'Who we will be working with.' },
      { title: 'The project', description: 'What success looks like.' },
      { title: 'Logistics', description: 'Budget, timing and files.' },
    ],
    fields: [
      fullName('Your name'),
      row(
        [field('email', { label: 'Email', required: true, placeholder: 'you@company.com' })],
        [field('phone', { label: 'Phone', placeholder: '+1 555 010 2030' })]
      ),
      row(
        [field('text', { label: 'Company', required: true, placeholder: 'Acme Inc.' })],
        [field('website', { label: 'Website', placeholder: 'acme.com' })]
      ),
      pageBreak(),
      field('chips', {
        label: 'What do you need help with?',
        required: true,
        allowMultiple: true,
        options: ['Brand identity', 'Website', 'Product design', 'Content', 'Growth'],
      }),
      field('textarea', {
        label: 'Describe the project',
        required: true,
        placeholder: 'Goals, audience, and anything that is already in place.',
      }),
      field('textarea', {
        label: 'What does success look like in 90 days?',
        placeholder: 'A launch, a number, a feeling…',
      }),
      pageBreak(),
      field('select', {
        label: 'Budget range',
        required: true,
        placeholder: 'Choose a range',
        options: ['Under $10k', '$10k – $25k', '$25k – $50k', '$50k – $100k', '$100k+'],
      }),
      field('date', { label: 'Ideal launch date' }),
      field('file', { label: 'Brief or brand assets', helpText: 'PDF, deck or a zip of assets.' }),
    ],
    theme: look('studio-dark'),
  },
  {
    id: 'featured-demo',
    name: 'Book a demo',
    description: 'A polished B2B demo request with qualification built in.',
    category: 'Featured',
    keywords: ['sales', 'saas', 'demo', 'lead', 'b2b', 'meeting'],
    title: 'See it in action',
    formDescription: 'Tell us a little about your team and we will tailor a 30-minute walkthrough.',
    submitLabel: 'Request my demo',
    fields: [
      fullName(),
      row(
        [field('email', { label: 'Work email', required: true, placeholder: 'you@company.com' })],
        [field('text', { label: 'Company', required: true, placeholder: 'Acme Inc.' })]
      ),
      row(
        [field('text', { label: 'Job title', placeholder: 'Head of Growth' })],
        [
          field('select', {
            label: 'Team size',
            required: true,
            placeholder: 'Select',
            options: ['1–10', '11–50', '51–200', '201–1,000', '1,000+'],
          }),
        ]
      ),
      field('chips', {
        label: 'What are you most interested in?',
        allowMultiple: true,
        options: ['Analytics', 'Automation', 'Integrations', 'Security', 'Pricing'],
      }),
      field('textarea', { label: 'Anything we should know beforehand?', placeholder: 'Optional' }),
    ],
    theme: look('indigo-pro'),
  },
  {
    id: 'featured-nps',
    name: 'Customer pulse',
    description: 'An editorial NPS survey with underline fields and serif type.',
    category: 'Featured',
    keywords: ['nps', 'survey', 'satisfaction', 'csat', 'customer'],
    title: 'How are we doing?',
    formDescription: 'Two minutes, four questions. Your answers go straight to the product team.',
    submitLabel: 'Share feedback',
    fields: [
      field('nps', { label: 'How likely are you to recommend us to a colleague?', required: true }),
      field('select', {
        label: 'What is the main reason for your score?',
        placeholder: 'Choose one',
        options: ['Product quality', 'Ease of use', 'Support', 'Price', 'Something else'],
      }),
      field('textarea', { label: 'What is one thing we could do better?', placeholder: 'Be as candid as you like.' }),
      field('email', {
        label: 'Email',
        placeholder: 'Leave it if you would like a reply',
      }),
    ],
    theme: look('editorial'),
  },
  {
    id: 'featured-event',
    name: 'Event registration',
    description: 'A glassy, after-dark registration page for launches and meetups.',
    category: 'Featured',
    keywords: ['event', 'rsvp', 'conference', 'meetup', 'ticket', 'launch'],
    title: 'Launch Night',
    formDescription: 'An evening of demos, conversations and good company. Seats are limited.',
    submitLabel: 'Reserve my seat',
    fields: [
      fullName(),
      row(
        [field('email', { label: 'Email', required: true, placeholder: 'you@example.com' })],
        [field('text', { label: 'Company', placeholder: 'Optional' })]
      ),
      field('radio', {
        label: 'How will you attend?',
        required: true,
        options: ['In person', 'Livestream'],
      }),
      field('select', {
        label: 'Dietary preference',
        placeholder: 'No preference',
        options: ['Vegetarian', 'Vegan', 'Gluten free', 'Halal', 'Kosher'],
      }),
      field('terms', { label: 'I am happy to appear in event photos', required: true }),
    ],
    theme: look('aurora-glass'),
  },
  {
    id: 'featured-application',
    name: 'Job application',
    description: 'A two-step application that feels considered, not bureaucratic.',
    category: 'Featured',
    keywords: ['hiring', 'careers', 'job', 'apply', 'resume', 'cv'],
    title: 'Join the team',
    formDescription: 'We read every application personally. Take your time.',
    submitLabel: 'Submit application',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'Your details', description: 'How we can reach you.' },
      { title: 'Your work', description: 'Show us what you are proud of.' },
    ],
    fields: [
      fullName(),
      row(
        [field('email', { label: 'Email', required: true, placeholder: 'you@example.com' })],
        [field('phone', { label: 'Phone', placeholder: '+1 555 010 2030' })]
      ),
      row(
        [
          field('select', {
            label: 'Role',
            required: true,
            placeholder: 'Choose a role',
            options: ['Product Designer', 'Frontend Engineer', 'Backend Engineer', 'Product Manager', 'Other'],
          }),
        ],
        [field('country', { label: 'Based in' })]
      ),
      pageBreak(),
      field('website', { label: 'Portfolio or LinkedIn', required: true, placeholder: 'linkedin.com/in/you' }),
      field('file', { label: 'Résumé', required: true, helpText: 'PDF, up to 10 MB.' }),
      field('textarea', {
        label: 'Tell us about a project you are proud of',
        required: true,
        placeholder: 'What was the problem, what did you do, and what changed?',
      }),
      field('select', {
        label: 'When could you start?',
        placeholder: 'Choose one',
        options: ['Immediately', 'Within a month', 'In 1–3 months', 'Later'],
      }),
    ],
    theme: look('studio'),
  },
  {
    id: 'featured-reservation',
    name: 'Table reservation',
    description: 'A warm, hospitality-grade booking form in soft sand tones.',
    category: 'Featured',
    keywords: ['restaurant', 'booking', 'table', 'dinner', 'reservation', 'cafe'],
    title: 'Reserve a table',
    formDescription: 'We hold tables for 15 minutes. For parties over eight, please call us.',
    submitLabel: 'Request reservation',
    fields: [
      row(
        [field('date', { label: 'Date', required: true })],
        [field('time', { label: 'Time', required: true })]
      ),
      field('select', {
        label: 'Party size',
        required: true,
        placeholder: 'How many guests?',
        options: ['1 guest', '2 guests', '3 guests', '4 guests', '5 guests', '6 guests', '7 guests', '8 guests'],
      }),
      fullName('Name'),
      row(
        [field('phone', { label: 'Phone', required: true, placeholder: '+1 555 010 2030' })],
        [field('email', { label: 'Email', placeholder: 'For your confirmation' })]
      ),
      field('select', {
        label: 'Occasion',
        placeholder: 'Just dinner',
        options: ['Birthday', 'Anniversary', 'Business', 'Date night', 'Celebration'],
      }),
      field('textarea', { label: 'Requests or allergies', placeholder: 'Window seat, high chair, nut allergy…' }),
    ],
    theme: look('sand'),
  },
  {
    id: 'featured-bug',
    name: 'Developer bug report',
    description: 'A sharp, compact report form for engineering teams.',
    category: 'Featured',
    keywords: ['bug', 'issue', 'engineering', 'qa', 'support', 'developer'],
    title: 'Report an issue',
    formDescription: 'Clear reproduction steps get bugs fixed fastest.',
    submitLabel: 'File report',
    fields: [
      field('text', { label: 'Summary', required: true, placeholder: 'Export button does nothing on Safari' }),
      row(
        [
          field('select', {
            label: 'Severity',
            required: true,
            placeholder: 'Select',
            options: ['Critical', 'High', 'Medium', 'Low'],
          }),
        ],
        [
          field('select', {
            label: 'Area',
            placeholder: 'Select',
            options: ['Web app', 'API', 'Mobile', 'Billing', 'Other'],
          }),
        ]
      ),
      field('textarea', {
        label: 'Steps to reproduce',
        required: true,
        placeholder: '1. Go to…\n2. Click…\n3. See error',
      }),
      field('textarea', { label: 'Expected vs. actual', placeholder: 'What should happen, and what happened instead' }),
      field('imageUpload', { label: 'Screenshot' }),
      field('email', { label: 'Your email', required: true, placeholder: 'you@company.com' }),
    ],
    theme: look('graphite'),
  },
  {
    id: 'featured-newsletter-card',
    name: 'Newsletter card',
    description: 'A compact embedded signup that sits beautifully on any site.',
    category: 'Featured',
    keywords: ['newsletter', 'subscribe', 'embed', 'email', 'signup'],
    title: 'The weekly brief',
    formDescription: 'One email every Friday. No noise, unsubscribe anytime.',
    submitLabel: 'Subscribe',
    fields: [field('email', { label: 'Email', required: true, placeholder: 'you@example.com', hideLabel: true })],
    theme: look('studio', { cardWidth: undefined, density: 'comfortable' }, 'card'),
  },
  {
    id: 'featured-launch',
    name: 'Creator collab',
    description: 'A bold, high-contrast pitch form for brands and creators.',
    category: 'Featured',
    keywords: ['creator', 'influencer', 'brand', 'partnership', 'collab', 'pitch'],
    title: 'Work with us',
    formDescription: 'Pitch us your idea. We reply to every serious proposal within a week.',
    submitLabel: 'Send pitch',
    fields: [
      fullName('Name'),
      row(
        [field('email', { label: 'Email', required: true, placeholder: 'you@example.com' })],
        [field('website', { label: 'Main channel', required: true, placeholder: 'youtube.com/@you' })]
      ),
      field('select', {
        label: 'Audience size',
        placeholder: 'Select',
        options: ['Under 10k', '10k – 50k', '50k – 250k', '250k – 1M', '1M+'],
      }),
      field('chips', {
        label: 'Format',
        allowMultiple: true,
        options: ['Video', 'Podcast', 'Newsletter', 'Livestream', 'Event'],
      }),
      field('textarea', { label: 'Your idea', required: true, placeholder: 'The concept, the audience fit, and the timing.' }),
    ],
    theme: look('volt'),
  },
];
