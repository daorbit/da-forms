import type { FormField } from '@/types';
import type { ImportColumn, MetaKey } from './importColumns';

const PEOPLE = [
  { first: 'Aarav', last: 'Sharma', company: 'Northwind Labs', city: 'Bengaluru' },
  { first: 'Priya', last: 'Patel', company: 'Bluefin Retail', city: 'Mumbai' },
  { first: 'Rohan', last: 'Mehta', company: 'Acme Logistics', city: 'Pune' },
  { first: 'Ananya', last: 'Iyer', company: 'Brightpath Health', city: 'Chennai' },
  { first: 'Kabir', last: 'Singh', company: 'Orbit Finance', city: 'Delhi' },
];

const MESSAGES = [
  'Interested in a demo for our sales team.',
  'Looking for pricing on the annual plan.',
  'Can you integrate with our CRM?',
  'Please call me next week.',
  'Evaluating options for Q4.',
];

const pad = (n: number) => String(n).padStart(2, '0');

function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function sampleValue(field: FormField, i: number): string {
  const person = PEOPLE[i % PEOPLE.length];
  const options = field.options ?? [];
  const pick = (offset = 0) => options[(i + offset) % options.length] ?? '';
  const label = (field.label ?? '').toLowerCase();

  switch (field.type) {
    case 'name':
      return `${person.first} ${person.last}`;
    case 'email':
      return `${person.first}.${person.last}@example.com`.toLowerCase();
    case 'phone':
      return `+91 98${String(45012300 + i * 1117).slice(0, 8)}`;
    case 'website':
      return `https://${person.company.toLowerCase().replace(/\s+/g, '')}.example.com`;
    case 'address':
      return `${12 + i} MG Road, ${person.city}`;
    case 'number':
    case 'decimal':
      return String(10 + i * 5);
    case 'currency':
      return String(25000 + i * 5000);
    case 'rating':
      return String(5 - (i % 3));
    case 'slider':
      return String(40 + i * 10);
    case 'nps':
      return String(10 - i);
    case 'yesNo':
      return i % 2 ? 'No' : 'Yes';
    case 'terms':
    case 'decisionBox':
      return 'Yes';
    case 'date':
      return dayOffset(-i);
    case 'datetime':
    case 'booking':
      return `${dayOffset(i + 1)} ${pad(10 + i)}:00`;
    case 'time':
      return `${pad(9 + i)}:30`;
    case 'monthYear':
      return dayOffset(0).slice(0, 7);
    case 'dateRange':
      return `${dayOffset(i)} to ${dayOffset(i + 3)}`;
    case 'timeRange':
      return '09:00 to 17:00';
    case 'numberRange':
      return `${10 * (i + 1)} - ${20 * (i + 1)}`;
    case 'checkbox':
    case 'multipleChoice':
    case 'chips':
      return options.length > 1 ? `${pick()}, ${pick(1)}` : pick();
    case 'select':
    case 'radio':
    case 'likert':
      return pick();
    case 'country':
      return 'India';
    case 'textarea':
      return MESSAGES[i % MESSAGES.length];
    default:
      if (/company|organi[sz]ation|business/.test(label)) return person.company;
      if (/city|location/.test(label)) return person.city;
      if (/first/.test(label)) return person.first;
      if (/last|surname/.test(label)) return person.last;
      if (/name/.test(label)) return `${person.first} ${person.last}`;
      if (/title|role|designation/.test(label)) return ['Founder', 'Sales Head', 'Marketing Manager', 'CTO', 'Ops Lead'][i % 5];
      return `Sample ${i + 1}`;
  }
}

function sampleMeta(key: MetaKey, i: number): string {
  switch (key) {
    case 'stage':
      return ['New', 'Contacted', 'Qualified', 'Won', 'Lost'][i % 5];
    case 'assignee':
      return ['Ajay', 'Neha', '', 'Ajay', 'Rahul'][i % 5];
    case 'tags':
      return ['webinar', 'webinar, priority', 'referral', 'event', 'priority'][i % 5];
    case 'note':
      return ['Asked for a pricing call', 'Follow up next week', '', 'Signed the annual plan', 'Budget not approved'][i % 5];
    case 'submittedAt':
      return `${dayOffset(-(i + 1))} ${pad(9 + i)}:15`;
    case 'meetLink':
    case 'eventLink':
      return '';
  }
}

export function sampleRows(columns: ImportColumn[], count = 5): string[][] {
  return Array.from({ length: count }, (_, i) =>
    columns.map((column) => (column.meta ? sampleMeta(column.meta, i) : sampleValue(column.field!, i))),
  );
}
