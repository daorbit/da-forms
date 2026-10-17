export const NOT_TRACKED = 'Not tracked';
export const DIRECT = 'Direct';

export interface SubmissionAttribution {
  channel: string;
  paid?: boolean;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  landingUrl?: string;
  legacyEmbed?: boolean;
}

interface Touch {
  page?: string;
  referrer?: string;
  formUrl?: string;
  legacyEmbed?: unknown;
}

const MAX_TEXT = 200;
const MAX_URL = 600;

const SOURCE_NAMES: [RegExp, string][] = [
  [/^(google|googleads|adwords|gads)$/, 'Google'],
  [/^(bing|microsoft|msads)$/, 'Bing'],
  [/^(instagram|ig|insta)$/, 'Instagram'],
  [/^(facebook|fb|meta|messenger)$/, 'Facebook'],
  [/^(linkedin|li|lnkd)$/, 'LinkedIn'],
  [/^(youtube|yt)$/, 'YouTube'],
  [/^(twitter|x|tco)$/, 'X'],
  [/^tiktok$/, 'TikTok'],
  [/^(whatsapp|wa)$/, 'WhatsApp'],
  [/^(telegram|tg)$/, 'Telegram'],
  [/^pinterest$/, 'Pinterest'],
  [/^reddit$/, 'Reddit'],
  [/^quora$/, 'Quora'],
  [/^(chatgpt|openai)$/, 'ChatGPT'],
  [/^perplexity$/, 'Perplexity'],
  [/^(email|e-mail|newsletter|mailchimp|brevo|sendinblue|klaviyo)$/, 'Email'],
  [/^sms$/, 'SMS'],
  [/^(qr|qrcode|qr-code|qr_code)$/, 'QR code'],
];

const REFERRER_HOSTS: [RegExp, string][] = [
  [/^(mail\.google\.com|outlook\.(live|office|office365)\.com|mail\.yahoo\.com)$/, 'Email'],
  [/(^|\.)google\.[a-z.]+$/, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)search\.yahoo\.com$/, 'Yahoo'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, 'Facebook'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'WhatsApp'],
  [/(^|\.)(t\.me|telegram\.org)$/, 'Telegram'],
  [/(^|\.)pinterest\.[a-z.]+$/, 'Pinterest'],
  [/(^|\.)reddit\.com$/, 'Reddit'],
  [/(^|\.)quora\.com$/, 'Quora'],
  [/(^|\.)(chatgpt\.com|chat\.openai\.com)$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity'],
];

const PAID_CLICK_IDS: [string, string][] = [
  ['gclid', 'Google'],
  ['gbraid', 'Google'],
  ['wbraid', 'Google'],
  ['msclkid', 'Bing'],
  ['ttclid', 'TikTok'],
  ['li_fat_id', 'LinkedIn'],
  ['twclid', 'X'],
];

const PAID_MEDIUM = /^(cpc|ppc|paid|paid[-_ ]?social|paid[-_ ]?search|cpm|cpv|display|ads?|sponsored)$/i;

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function toUrl(value: unknown): URL | undefined {
  const text = clip(value, MAX_URL);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

function bareHost(url: URL): string {
  return url.hostname.replace(/^www\./, '').toLowerCase();
}

function sourceName(raw: string): string {
  const key = raw.toLowerCase().replace(/^www\./, '').replace(/\.(com|in|org|net|co)$/, '').trim();
  const known = SOURCE_NAMES.find(([pattern]) => pattern.test(key));
  if (known) return known[1];
  return raw.charAt(0).toUpperCase() + raw.slice(1, 40);
}

function referrerName(host: string): string {
  return REFERRER_HOSTS.find(([pattern]) => pattern.test(host))?.[1] ?? host;
}

function param(urls: (URL | undefined)[], key: string): string | undefined {
  for (const url of urls) {
    const value = clip(url?.searchParams.get(key), MAX_TEXT);
    if (value) return value;
  }
  return undefined;
}

function parseTouch(raw: unknown): Touch | undefined {
  if (typeof raw !== 'string' || raw.length > 4000) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Touch) : undefined;
  } catch {
    return undefined;
  }
}

export function attributionFrom(raw: unknown): SubmissionAttribution | undefined {
  const touch = parseTouch(raw);
  if (!touch) return undefined;

  const page = toUrl(touch.page);
  const formUrl = toUrl(touch.formUrl);
  const referrerUrl = toUrl(touch.referrer);
  const urls = [page, formUrl];

  const source = param(urls, 'utm_source');
  const medium = param(urls, 'utm_medium');
  const campaign = param(urls, 'utm_campaign');
  const term = param(urls, 'utm_term');
  const content = param(urls, 'utm_content');
  const clickId = PAID_CLICK_IDS.find(([key]) => param(urls, key));
  const fbclid = param(urls, 'fbclid');

  const ownHosts = new Set([page, formUrl].filter((u): u is URL => Boolean(u)).map(bareHost));
  const externalReferrer = referrerUrl && !ownHosts.has(bareHost(referrerUrl)) ? referrerUrl : undefined;

  let channel: string;
  if (source) channel = sourceName(source);
  else if (clickId) channel = clickId[1];
  else if (medium && /^e-?mail$/i.test(medium)) channel = 'Email';
  else if (externalReferrer) channel = referrerName(bareHost(externalReferrer));
  else if (fbclid) channel = 'Facebook';
  else channel = DIRECT;

  const paid = Boolean((medium && PAID_MEDIUM.test(medium)) || clickId);
  if (paid && channel !== DIRECT) channel = `${channel} Ads`;

  return {
    channel,
    ...(paid ? { paid } : {}),
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
    ...(term ? { term } : {}),
    ...(content ? { content } : {}),
    ...(externalReferrer ? { referrer: externalReferrer.href.slice(0, MAX_URL) } : {}),
    ...(page ? { landingUrl: page.href.slice(0, MAX_URL) } : {}),
    ...(touch.legacyEmbed === true ? { legacyEmbed: true } : {}),
  };
}
