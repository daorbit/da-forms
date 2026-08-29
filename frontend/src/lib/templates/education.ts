import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Forms for schools, courses, and anything with a syllabus behind it. */
export const educationTemplates: FormTemplate[] = [
  {
    id: 'courseEnrollment',
    name: 'Course enrollment',
    description: 'Student details, course choice, and payment preference in two steps.',
    category: 'Education',
    keywords: ['school', 'class', 'student', 'training', 'signup'],
    title: 'Enroll in a course',
    formDescription: 'Places are confirmed in the order applications arrive.',
    submitLabel: 'Enroll',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'Student', description: 'Who is taking the course.' },
      { title: 'Course', description: 'What you want to study, and when.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Student name', required: true })],
        [field('email', { label: 'Email', required: true, placeholder: 'you@example.com' })]
      ),
      row(
        [field('phone', { label: 'Phone' })],
        [field('date', { label: 'Date of birth' })]
      ),
      pageBreak(),
      field('select', {
        label: 'Course',
        required: true,
        options: ['Introduction to Design', 'Web Development', 'Data Analysis', 'Project Management'],
      }),
      field('radio', {
        label: 'Preferred schedule',
        required: true,
        options: ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Self-paced'],
      }),
      field('select', {
        label: 'How would you like to pay?',
        options: ['In full', 'Two instalments', 'Monthly', 'My employer is paying'],
      }),
      field('textarea', { label: 'Anything we should know?', placeholder: 'Access needs, prior experience, questions.' }),
      field('terms', { label: 'I accept the enrollment terms', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#eef2ff',
      cardBg: '#ffffff',
      cardBorder: '#c7d2fe',
      accentColor: '#4f46e5',
      labelColor: '#1e1b4b',
      inputBg: '#ffffff',
      inputBorder: '#c7d2fe',
      inputTextColor: '#1e1b4b',
      textMode: 'dark',
      cardRadius: 14,
      cardShadow: 'lg',
      fontFamily: 'inter',
      pageBackground: { gradient: 'linear-gradient(150deg, #e0e7ff 0%, #f5f3ff 100%)' },
    },
  },
  {
    id: 'scholarship',
    name: 'Scholarship application',
    description: 'Academic record, financial need, and a personal statement, over three steps.',
    category: 'Education',
    keywords: ['grant', 'bursary', 'funding', 'university'],
    title: 'Scholarship application',
    formDescription: 'Applications are read anonymously by the awards committee.',
    submitLabel: 'Submit application',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'About you', description: 'Basic contact details.' },
      { title: 'Academics', description: 'Where you study and how it is going.' },
      { title: 'Statement', description: 'Why this scholarship, and why you.' },
    ],
    fields: [
      row(
        [field('name', { label: 'Full name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('address', { label: 'Home address' }),
      pageBreak(),
      field('text', { label: 'Current institution', required: true }),
      row(
        [field('text', { label: 'Programme of study', required: true })],
        [field('select', { label: 'Year of study', required: true, options: ['1st', '2nd', '3rd', '4th', 'Postgraduate'] })]
      ),
      field('decimal', { label: 'Current GPA or average', min: 0, max: 100 }),
      field('file', { label: 'Transcript', required: true }),
      pageBreak(),
      field('textarea', {
        label: 'Personal statement',
        required: true,
        placeholder: 'What you are working towards, and what this award would change.',
        maxLength: 2000,
      }),
      field('textarea', { label: 'Describe your financial need', required: true }),
      field('terms', { label: 'I confirm everything above is accurate', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#1c1917',
      cardBg: '#fafaf9',
      cardBorder: '#e7e5e4',
      accentColor: '#b45309',
      labelColor: '#292524',
      inputBg: '#ffffff',
      inputBorder: '#d6d3d1',
      inputTextColor: '#292524',
      textMode: 'dark',
      cardRadius: 8,
      cardShadow: 'xl',
      fontFamily: 'serif',
      pageBackground: { gradient: 'linear-gradient(180deg, #292524 0%, #1c1917 100%)' },
    },
  },
  {
    id: 'classFeedback',
    name: 'Class feedback',
    description: 'End-of-term ratings for teaching, materials, and pace.',
    category: 'Education',
    keywords: ['course', 'teacher', 'evaluation', 'survey', 'term'],
    title: 'How was this class?',
    formDescription: 'Anonymous unless you choose to leave your name.',
    submitLabel: 'Send feedback',
    fields: [
      field('rating', { label: 'Overall, how would you rate the class?', required: true, maxRating: 5 }),
      row(
        [field('rating', { label: 'Teaching', maxRating: 5 })],
        [field('rating', { label: 'Materials', maxRating: 5 })]
      ),
      field('radio', {
        label: 'The pace was',
        required: true,
        options: ['Too slow', 'About right', 'Too fast'],
      }),
      field('textarea', { label: 'What worked well?' }),
      field('textarea', { label: 'What would you change?' }),
      field('text', { label: 'Your name', helpText: 'Optional — leave blank to stay anonymous.' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f0fdfa',
      cardBg: '#ffffff',
      cardBorder: '#99f6e4',
      accentColor: '#0f766e',
      labelColor: '#134e4a',
      textMode: 'dark',
      cardRadius: 16,
      cardShadow: 'md',
      fontFamily: 'rounded',
    },
  },
  {
    id: 'parentConsent',
    name: 'Parent consent',
    description: 'Trip permission, emergency contacts, and a guardian signature block.',
    category: 'Education',
    keywords: ['school trip', 'guardian', 'permission', 'minor'],
    title: 'Permission slip',
    formDescription: 'Please return this before the deadline on the letter.',
    submitLabel: 'Give consent',
    fields: [
      row(
        [field('name', { label: "Student's name", required: true })],
        [field('text', { label: 'Class / group', required: true })]
      ),
      field('select', {
        label: 'Activity',
        required: true,
        options: ['Museum visit', 'Sports fixture', 'Field study', 'Residential trip'],
      }),
      field('yesNo', { label: 'I give permission for my child to attend', required: true }),
      row(
        [field('name', { label: 'Parent or guardian', required: true })],
        [field('phone', { label: 'Emergency phone', required: true })]
      ),
      field('textarea', {
        label: 'Medical conditions or allergies',
        placeholder: 'Include any medication carried on the day.',
      }),
      field('terms', { label: 'I have read the activity risk assessment', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#fffbeb',
      cardBg: '#ffffff',
      cardBorder: '#fde68a',
      accentColor: '#ca8a04',
      labelColor: '#422006',
      textMode: 'dark',
      cardRadius: 12,
      cardShadow: 'md',
      fontFamily: 'inter',
    },
  },
];
