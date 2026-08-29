import type { FormTemplate } from './types';
import { field, pageBreak, row } from './types';

/** Restaurants, hotels, and venues — forms that end in a booking. */
export const hospitalityTemplates: FormTemplate[] = [
  {
    id: 'tableReservation',
    name: 'Table reservation',
    description: 'Party size, date and time, and dietary notes for a restaurant.',
    category: 'Hospitality',
    keywords: ['restaurant', 'booking', 'dinner', 'table', 'reservation'],
    title: 'Reserve a table',
    formDescription: 'We hold tables for 15 minutes past the booking time.',
    submitLabel: 'Reserve',
    fields: [
      row(
        [field('date', { label: 'Date', required: true })],
        [field('time', { label: 'Time', required: true })]
      ),
      field('number', { label: 'Number of guests', required: true, min: 1, max: 20, initialValue: '2' }),
      field('select', {
        label: 'Seating preference',
        options: ['No preference', 'Window', 'Booth', 'Outside', 'Bar'],
      }),
      field('textarea', { label: 'Allergies or dietary needs' }),
      field('text', { label: 'Special occasion?', placeholder: 'Birthday, anniversary…' }),
      row(
        [field('name', { label: 'Name', required: true })],
        [field('phone', { label: 'Phone', required: true })]
      ),
      field('email', { label: 'Email', required: true }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#1c1917',
      cardBg: '#fffbf5',
      cardBorder: '#e7e0d6',
      accentColor: '#9a3412',
      labelColor: '#292524',
      inputBg: '#ffffff',
      inputBorder: '#e7e0d6',
      inputTextColor: '#292524',
      textMode: 'dark',
      cardRadius: 4,
      cardShadow: 'xl',
      fontFamily: 'serif',
      pageBackground: { gradient: 'linear-gradient(160deg, #292524 0%, #1c1917 100%)' },
    },
  },
  {
    id: 'hotelBooking',
    name: 'Hotel booking enquiry',
    description: 'Stay dates, room type, and guest details in two steps.',
    category: 'Hospitality',
    keywords: ['hotel', 'stay', 'room', 'guest', 'travel'],
    title: 'Enquire about a stay',
    formDescription: 'Tell us the dates and we will come back with availability and a rate.',
    submitLabel: 'Send enquiry',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'Your stay', description: 'When, and what kind of room.' },
      { title: 'Your details', description: 'Where to send the confirmation.' },
    ],
    fields: [
      row(
        [field('date', { label: 'Check in', required: true })],
        [field('date', { label: 'Check out', required: true })]
      ),
      row(
        [field('number', { label: 'Adults', required: true, min: 1, max: 10, initialValue: '2' })],
        [field('number', { label: 'Children', min: 0, max: 10, initialValue: '0' })]
      ),
      field('radio', {
        label: 'Room type',
        required: true,
        options: ['Standard', 'Deluxe', 'Suite', 'Family room'],
      }),
      field('checkbox', {
        label: 'Extras',
        options: ['Breakfast', 'Airport transfer', 'Late checkout', 'Parking', 'Cot'],
      }),
      pageBreak(),
      row(
        [field('name', { label: 'Lead guest', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
      field('phone', { label: 'Phone' }),
      field('textarea', { label: 'Requests', placeholder: 'Quiet room, high floor, accessibility needs…' }),
    ],
    theme: {
      scope: 'page',
      pageBg: '#f0fdf4',
      cardBg: '#ffffff',
      cardBorder: '#dcfce7',
      accentColor: '#15803d',
      labelColor: '#14532d',
      inputBg: '#fafffb',
      inputBorder: '#bbf7d0',
      inputTextColor: '#14532d',
      textMode: 'dark',
      cardRadius: 18,
      cardShadow: 'lg',
      fontFamily: 'rounded',
      pageBackground: {
        gradient: 'linear-gradient(135deg, #34d399 0%, #38bdf8 100%)',
        overlay: '#ffffff',
        overlayOpacity: 60,
      },
    },
  },
  {
    id: 'cateringEnquiry',
    name: 'Catering enquiry',
    description: 'Event type, headcount, menu style, and budget for a caterer.',
    category: 'Hospitality',
    keywords: ['catering', 'event', 'food', 'wedding', 'party'],
    title: 'Catering enquiry',
    formDescription: 'The more detail here, the more precise our proposal.',
    submitLabel: 'Send enquiry',
    fields: [
      field('select', {
        label: 'Type of event',
        required: true,
        options: ['Wedding', 'Corporate', 'Private party', 'Conference', 'Other'],
      }),
      row(
        [field('date', { label: 'Event date', required: true })],
        [field('number', { label: 'Guests', required: true, min: 1, max: 2000 })]
      ),
      field('text', { label: 'Venue', placeholder: 'Name or address' }),
      field('checkbox', {
        label: 'Service style',
        options: ['Plated', 'Buffet', 'Canapés', 'Family style', 'Food stalls', 'Bar service'],
      }),
      field('textarea', { label: 'Dietary requirements across the party' }),
      field('select', {
        label: 'Budget per head',
        options: ['Under $30', '$30 – $60', '$60 – $100', 'Over $100', 'Not sure yet'],
      }),
      row(
        [field('name', { label: 'Your name', required: true })],
        [field('email', { label: 'Email', required: true })]
      ),
    ],
    theme: {
      scope: 'page',
      pageBg: '#fdf4ff',
      cardBg: '#ffffff',
      cardBorder: '#f5d0fe',
      accentColor: '#a21caf',
      labelColor: '#4a044e',
      textMode: 'dark',
      cardRadius: 16,
      cardShadow: 'lg',
      fontFamily: 'inter',
    },
  },
];
