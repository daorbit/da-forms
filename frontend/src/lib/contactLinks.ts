const CALLING_CODES: Record<string, string> = {
  IN: '91',
  US: '1',
  CA: '1',
  GB: '44',
  AU: '61',
  NZ: '64',
  AE: '971',
  SA: '966',
  QA: '974',
  SG: '65',
  MY: '60',
  ID: '62',
  PH: '63',
  PK: '92',
  BD: '880',
  LK: '94',
  NP: '977',
  ZA: '27',
  NG: '234',
  KE: '254',
  DE: '49',
  FR: '33',
  ES: '34',
  IT: '39',
  NL: '31',
};

const FALLBACK_CODE = '91';

function localCallingCode(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    return (region && CALLING_CODES[region]) || FALLBACK_CODE;
  } catch {
    return FALLBACK_CODE;
  }
}

export function internationalDigits(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return undefined;
  if (phone.trim().startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return localCallingCode() + digits.slice(1);
  if (digits.length <= 10) return localCallingCode() + digits;
  return digits;
}

function firstName(name: string | undefined): string | undefined {
  return name?.trim().split(/\s+/)[0];
}

function greeting(name: string | undefined) {
  const first = firstName(name);
  return first ? `Hi ${first}` : 'Hi';
}

export function callUrl(phone: string): string {
  const digits = internationalDigits(phone);
  return `tel:${digits ? `+${digits}` : phone.replace(/[^\d+]/g, '')}`;
}

export function whatsappUrl(phone: string, name: string | undefined, formTitle: string): string | undefined {
  const digits = internationalDigits(phone);
  if (!digits) return undefined;
  const text = `${greeting(name)}, thanks for filling in "${formTitle}". `;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function emailUrl(email: string, name: string | undefined, formTitle: string): string {
  const subject = `Re: ${formTitle}`;
  const body = `${greeting(name)},\n\nThanks for getting in touch through "${formTitle}".\n\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
