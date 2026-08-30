/**
 * Opening prompts for the Orbit form builder.
 *
 * Three are drawn at random each time the pane opens rather than showing the
 * same three forever: the list is there to demonstrate the range of what can be
 * asked for, and a fixed trio teaches that Orbit builds contact forms and
 * surveys. Someone who reopens it twice sees six different ideas instead.
 *
 * Each one is written the way a person would actually type it — a purpose, and
 * often a detail about tone or a field that matters. A bare noun ("contact
 * form") is a worse example than a sentence, because the sentence is what
 * produces the better form.
 */
const SUGGESTIONS = [
  // Hiring and people
  'A job application form for a restaurant, with CV upload',
  'Graduate scheme application with education history and a short essay',
  'Interview feedback form for a hiring panel',
  'Staff holiday request with dates and cover arrangements',
  'Employee onboarding details — bank, emergency contact, tax code',
  'Exit interview asking why someone is leaving and what would have kept them',
  'Timesheet for contractors, with hours and project',
  'Internal referral form for recommending a candidate',

  // Health and care
  'Patient intake for a dental clinic, calm and light',
  'New patient medical history with allergies and current medication',
  'Physiotherapy assessment with a pain scale and problem areas',
  'Consent form for a minor procedure, formal and clear',
  'Vet registration for a new pet, with breed and vaccination history',
  'Therapy enquiry, warm and private-feeling',

  // Events
  'RSVP for a birthday party, bold and fun',
  'Wedding RSVP with meal choice and dietary needs',
  'Conference registration with session picks and an invoice address',
  'Workshop booking with a date preference and experience level',
  'Charity gala ticket request, elegant and understated',
  'Volunteer signup with availability by day',

  // Feedback and research
  'Event feedback with a 1-5 rating and comments',
  'Customer satisfaction survey with NPS and an open comment',
  'Product research survey about how people currently solve a problem',
  'Course evaluation for students at the end of a term',
  'Restaurant feedback covering food, service and atmosphere',
  'Post-support-call survey, short enough that people finish it',

  // Sales and enquiries
  'Contact form for a design studio',
  'Quote request for a building job, with photos and a budget range',
  'Demo request for a B2B product, with company size and role',
  'Wholesale enquiry with expected order volume',
  'Property viewing request with preferred times',
  'Catering enquiry with headcount, date and dietary needs',
  'Freelance project brief — scope, timeline, budget',

  // Bookings and scheduling
  'Salon appointment booking with service and stylist preference',
  'Table reservation with party size and any occasion',
  'Studio hire request with equipment needed',
  'Tutoring session booking with subject and level',
  'Test drive booking for a car dealership',

  // Education
  'School trip permission slip with emergency contact',
  'Course enrolment with prior qualifications',
  'Scholarship application with a personal statement',
  'Parent-teacher meeting request with preferred slots',

  // Operations and internal
  'IT support ticket with urgency and what was already tried',
  'Expense claim with amount, category and receipt upload',
  'Incident report for a workplace accident, formal',
  'Maintenance request for a rented property, with photos',
  'Stock order request for a small shop',
  'Change request form with the reason and who approved it',

  // Community and membership
  'Club membership application with a photo and emergency contact',
  'Newsletter signup with topic interests, minimal and modern',
  'Petition signature with name, postcode and an optional comment',
  'Community grant application with what the money is for',
];

/**
 * `count` prompts, drawn at random without repeats.
 *
 * A partial Fisher-Yates over a copy: shuffling only as far as needed, and
 * never touching the source array, so a second call is as fresh as the first.
 * Picking indices at random without this would eventually offer the same
 * suggestion twice in one set, which reads as a bug rather than as chance.
 */
export function pickSuggestions(count = 3): string[] {
  const pool = [...SUGGESTIONS];
  const take = Math.min(count, pool.length);

  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, take);
}
