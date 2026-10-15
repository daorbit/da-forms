import type { FormField } from '@/types';
import type { FormTemplate } from '../types';
import { field, pageBreak, row } from '../types';
import { email, longText, multiPills, pick, pills } from '../proKit';
import { travelLook, travelScopes } from './travelLooks';

const DESTINATIONS = [
  'Rishikesh',
  'Mussoorie',
  'Nainital',
  'Jim Corbett',
  'Auli',
  'Shimla',
  'Manali',
  'Kasol',
  'Dharamshala',
  'Spiti Valley',
  'Amritsar',
  'Not sure yet',
];

function traveller(label = 'Full name', required = true): FormField {
  return field('name', { label, required, placeholder: 'Your full name', hideLastName: true });
}

function mobile(label = 'Phone / WhatsApp', required = true): FormField {
  return field('phone', { label, required, placeholder: '+91 98765 43210' });
}

function headcount(label: string, initialValue: string, required = false): FormField {
  return field('number', { label, required, min: 0, max: 60, initialValue });
}

export const travelTemplates: FormTemplate[] = travelScopes([
  {
    id: 'travel-plan-trip',
    name: 'Plan my trip',
    description: 'A three-step trip planner on a full-bleed Himalayan photo, for itemised quotes.',
    category: 'Travel',
    keywords: ['travel', 'trip', 'itinerary', 'tour', 'quote', 'himalaya', 'holiday', 'agency'],
    title: 'Where the Himalaya begins',
    formDescription: 'Tell us how you like to travel. A local planner replies with an itemised quote within a day.',
    submitLabel: 'Get my itinerary',
    stepIndicator: 'stepper',
    showStepHeadings: true,
    steps: [
      { title: 'The journey', description: 'Where and when you are dreaming of.' },
      { title: 'Your group', description: 'Who is coming and how you like to stay.' },
      { title: 'Reach you', description: 'Where we send your plan.' },
    ],
    fields: [
      multiPills('Where would you like to go?', DESTINATIONS, { required: true }),
      field('dateRange', { label: 'Travel dates', required: true }),
      pills('Pace of the trip', ['Slow and easy', 'Balanced', 'Pack it in'], { required: true }),
      pageBreak(),
      row([headcount('Adults', '2', true)], [headcount('Children', '0')]),
      pills('Where you like to stay', ['Boutique homestay', 'Heritage hotel', 'Luxury resort', 'Riverside camp']),
      pick('Budget per person', ['Under ₹15,000', '₹15,000 – ₹30,000', '₹30,000 – ₹60,000', '₹60,000+'], { required: true }),
      pageBreak(),
      traveller(),
      row([email()], [mobile()]),
      pills('Best way to reply', ['WhatsApp', 'Phone call', 'Email'], { required: true }),
      longText('Anything we should plan around?', 'Birthdays, elderly parents, a sunrise you have always wanted to see…'),
    ],
    theme: travelLook('himalaya'),
  },
  {
    id: 'travel-enquiry',
    name: 'Travel enquiry',
    description: 'An editorial contact form in warm parchment and serif type, made for travel brands.',
    category: 'Travel',
    keywords: ['travel', 'contact', 'enquiry', 'tour', 'agency', 'get in touch'],
    title: 'Let’s plan something unhurried',
    formDescription: 'Write to us about the trip you have in mind. A real person replies, usually within a few hours.',
    submitLabel: 'Send enquiry',
    fields: [
      traveller('Your name'),
      row([email()], [mobile('Phone', false)]),
      pick('Destination', DESTINATIONS),
      longText('Your message', 'Dates, group size, the feeling you are after…', true),
      field('decisionBox', { label: 'Send me seasonal trip ideas, no more than once a month' }),
    ],
    theme: travelLook('parchment'),
  },
  {
    id: 'travel-quote',
    name: 'Custom tour quote',
    description: 'Departure city, nights and inclusions on a sea of clouds, for exact pricing.',
    category: 'Travel',
    keywords: ['quote', 'price', 'package', 'tour', 'travel', 'estimate', 'cab', 'hotel'],
    title: 'Your itemised quote',
    formDescription: 'Pick what to include and we will price every line, with nothing hidden.',
    submitLabel: 'Request my quote',
    fields: [
      row([traveller()], [mobile()]),
      row(
        [field('text', { label: 'Starting from', required: true, placeholder: 'Delhi, Chandigarh, Dehradun…' })],
        [field('date', { label: 'Departure date', required: true })]
      ),
      row(
        [pick('Length of trip', ['2–3 nights', '4–5 nights', '6–8 nights', '9+ nights'], { required: true })],
        [pick('Travellers', ['Solo', '2', '3–4', '5–8', '9+'], { required: true })]
      ),
      multiPills('Include in the quote', ['Hotels', 'Private cab', 'Local guide', 'Meals', 'Activities', 'Train or flight tickets'], {
        required: true,
      }),
      longText('Must-see places or notes', 'Optional, but it sharpens the quote.'),
    ],
    theme: travelLook('cloudSea'),
  },
  {
    id: 'travel-trek',
    name: 'Trek registration',
    description: 'Batch, experience, fitness and emergency contact, in a dark glass card over snow.',
    category: 'Travel',
    keywords: ['trek', 'hiking', 'adventure', 'expedition', 'registration', 'mountain', 'camp'],
    title: 'Reserve your spot on the trail',
    formDescription: 'Small batches, certified trek leaders. Tell us a little about you so we can keep you safe.',
    submitLabel: 'Reserve my spot',
    stepIndicator: 'progress',
    showStepHeadings: true,
    steps: [
      { title: 'Your trek', description: 'Pick the trail and the batch.' },
      { title: 'Safety', description: 'What we need before you set off.' },
    ],
    fields: [
      traveller(),
      row([email()], [mobile()]),
      row(
        [pick('Trek', ['Kedarkantha', 'Har Ki Dun', 'Valley of Flowers', 'Kuari Pass', 'Hampta Pass', 'Triund'], { required: true })],
        [pick('Batch', ['This month', 'Next month', 'In 2–3 months', 'Flexible'], { required: true })]
      ),
      pills('Trekking experience', ['First trek', '1–3 treks', 'Seasoned'], { required: true }),
      field('yesNo', { label: 'Can you jog 5 km in under 40 minutes?', required: true }),
      multiPills('Gear to rent', ['Trekking shoes', 'Poles', 'Down jacket', 'Backpack', 'None, I have my own']),
      pageBreak(),
      row(
        [field('text', { label: 'Emergency contact', required: true, placeholder: 'Name and relation' })],
        [mobile('Their phone', true)]
      ),
      longText('Medical conditions or allergies', 'Asthma, knee injuries, medication… or “none”.', true),
      field('terms', { label: 'I understand high-altitude treks carry risk and agree to the trek guidelines', required: true }),
    ],
    theme: travelLook('summit'),
  },
  {
    id: 'travel-honeymoon',
    name: 'Honeymoon planner',
    description: 'A romantic, serif-led planner on alpenglow peaks, with special touches built in.',
    category: 'Travel',
    keywords: ['honeymoon', 'couple', 'romantic', 'anniversary', 'getaway', 'travel'],
    title: 'Your honeymoon, unhurried',
    formDescription: 'Quiet stays, slow mornings and a few surprises. Tell us about the two of you.',
    submitLabel: 'Plan our honeymoon',
    fields: [
      row([traveller('Your name')], [field('text', { label: 'Partner’s name', placeholder: 'Their name' })]),
      row([email()], [mobile()]),
      field('dateRange', { label: 'When are you travelling?', required: true }),
      pills('The setting you imagine', ['Snow and mountains', 'Lakes and forests', 'By the river', 'A bit of everything'], {
        required: true,
      }),
      multiPills('Special touches', ['Candlelight dinner', 'Room décor', 'Couple spa', 'Private bonfire', 'Photoshoot']),
      pick('Budget for the two of you', ['Under ₹50,000', '₹50,000 – ₹1,00,000', '₹1,00,000 – ₹2,00,000', '₹2,00,000+']),
      longText('Anything we should know?', 'Dietary needs, a date that matters, a surprise to keep secret…'),
    ],
    theme: travelLook('alpenglow'),
  },
  {
    id: 'travel-group',
    name: 'Group and corporate tours',
    description: 'Offsites, college trips and family reunions: size, dates and logistics in one card.',
    category: 'Travel',
    keywords: ['group', 'corporate', 'offsite', 'team', 'school', 'college', 'family', 'tour'],
    title: 'Travel together',
    formDescription: 'From 10 to 200 people. We handle transport, stays and the schedule, so you can just show up.',
    submitLabel: 'Request a proposal',
    fields: [
      row([traveller('Organiser’s name')], [email('Work email')]),
      row([mobile()], [field('text', { label: 'Company or group', placeholder: 'Acme Pvt. Ltd.' })]),
      pills('Kind of trip', ['Corporate offsite', 'School or college', 'Friends', 'Family reunion', 'Pilgrimage'], { required: true }),
      row(
        [field('number', { label: 'Group size', required: true, min: 5, max: 500, initialValue: '20' })],
        [pick('Budget per person', ['Under ₹10,000', '₹10,000 – ₹20,000', '₹20,000 – ₹40,000', '₹40,000+'])]
      ),
      field('dateRange', { label: 'Preferred dates', required: true }),
      multiPills('You will need', ['Meeting room', 'Team activities', 'Bonfire and music', 'Coach from Delhi', 'GST invoice']),
      longText('Tell us more', 'Goals for the trip, must-haves, anything to avoid.'),
    ],
    theme: travelLook('pine'),
  },
  {
    id: 'travel-stay',
    name: 'Homestay booking',
    description: 'A calm lakeside booking request for homestays, cottages and boutique stays.',
    category: 'Travel',
    keywords: ['homestay', 'hotel', 'cottage', 'booking', 'stay', 'room', 'resort', 'bnb'],
    title: 'Stay a while',
    formDescription: 'Request your dates and we will confirm availability within a few hours.',
    submitLabel: 'Request booking',
    fields: [
      field('dateRange', { label: 'Check-in and check-out', required: true }),
      row([headcount('Adults', '2', true)], [headcount('Children', '0')]),
      pills('Room', ['Valley-view room', 'Garden cottage', 'Family suite'], { required: true }),
      pills('Meals', ['Breakfast', 'Breakfast and dinner', 'All meals']),
      traveller(),
      row([email()], [mobile()]),
      longText('Special requests', 'Early check-in, a cot, airport pickup…'),
    ],
    theme: travelLook('lakeside'),
  },
  {
    id: 'travel-pilgrimage',
    name: 'Char Dham yatra',
    description: 'Pilgrimage registration for families: dhams, darshan dates and elderly assistance.',
    category: 'Travel',
    keywords: ['char dham', 'yatra', 'pilgrimage', 'kedarnath', 'badrinath', 'temple', 'spiritual'],
    title: 'Char Dham yatra',
    formDescription: 'Yamunotri, Gangotri, Kedarnath and Badrinath, planned around your family’s pace.',
    submitLabel: 'Register for the yatra',
    fields: [
      traveller('Lead pilgrim'),
      row([mobile()], [email('Email', false)]),
      multiPills('Dhams to visit', ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath', 'All four'], { required: true }),
      row([field('date', { label: 'Start date', required: true })], [headcount('Pilgrims', '2', true)]),
      pills('Travelling with seniors?', ['No', 'Yes, need assistance', 'Yes, need palki or pony']),
      pills('Getting there', ['By road', 'Helicopter for Kedarnath', 'Help me decide']),
      longText('Health or dietary needs', 'Sattvic meals, medication, mobility…'),
    ],
    theme: { ...travelLook('himalaya'), accentColor: '#8a3f12', inputBg: '#f4eadc', inputBorder: '#f4eadc' },
  },
  {
    id: 'travel-callback',
    name: 'Talk to a trip expert',
    description: 'A compact WhatsApp-first callback card under a starry sky. Three taps to send.',
    category: 'Travel',
    keywords: ['callback', 'whatsapp', 'call', 'expert', 'travel', 'contact', 'embed'],
    title: 'Talk to a trip expert',
    formDescription: 'Leave your number. We call or WhatsApp you back, Mon–Sat, 9:30 am – 7:30 pm.',
    submitLabel: 'Call me back',
    fields: [
      traveller('Name'),
      mobile('WhatsApp number'),
      pick('Thinking of', DESTINATIONS),
      pills('Best time', ['Morning', 'Afternoon', 'Evening'], { required: true }),
    ],
    theme: travelLook('stargazer'),
  },
  {
    id: 'travel-feedback',
    name: 'Traveller story',
    description: 'A warm post-trip review with ratings, a favourite moment and a photo to share.',
    category: 'Travel',
    keywords: ['feedback', 'review', 'testimonial', 'story', 'rating', 'travel', 'post trip'],
    title: 'How was your journey?',
    formDescription: 'Your story helps the next traveller, and helps us get better.',
    submitLabel: 'Share my story',
    fields: [
      row([traveller('Name')], [pick('Trip you took', DESTINATIONS.filter((d) => d !== 'Not sure yet'))]),
      field('rating', { label: 'Overall experience', required: true, maxRating: 5 }),
      row([field('rating', { label: 'Guide and driver', maxRating: 5 })], [field('rating', { label: 'Stays', maxRating: 5 })]),
      field('nps', { label: 'How likely are you to recommend us to a friend?' }),
      longText('Your favourite moment', 'The view, the chai, the conversation…', true),
      field('imageUpload', { label: 'Share a photo', helpText: 'Optional. We may feature it, with credit.' }),
      field('decisionBox', { label: 'You may feature my story on your website' }),
    ],
    theme: travelLook('driftwood'),
  },
]);
