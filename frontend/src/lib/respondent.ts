import type { FormField, Submission } from '@/types';

export interface RespondentIdentity {
  name?: string;
  email?: string;
  phone?: string;
  initials: string;
}

function answerOf(fields: FormField[], submission: Submission, match: (field: FormField) => boolean) {
  for (const field of fields) {
    if (!match(field)) continue;
    const value = submission.data[field.id];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function initialsOf(text: string | undefined): string {
  if (!text) return '?';
  const words = text.replace(/@.*$/, '').split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

export function respondentIdentity(fields: FormField[], submission: Submission): RespondentIdentity {
  const name =
    answerOf(fields, submission, (f) => f.type === 'name') ??
    answerOf(fields, submission, (f) => f.type === 'text' && /\bname\b/i.test(f.label ?? ''));
  const email =
    answerOf(fields, submission, (f) => f.type === 'email') ??
    submission.payment?.payerEmail;
  const phone =
    answerOf(fields, submission, (f) => f.type === 'phone') ??
    submission.payment?.payerContact;
  return { name, email, phone, initials: initialsOf(name ?? email) };
}

export function sourceHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
