interface Touch {
  page?: string;
  referrer?: string;
  formUrl: string;
  legacyEmbed?: boolean;
}

export const HOST_CONTEXT_MESSAGE = 'da-forms:context';

let hostTouch: { page?: string; referrer?: string } | null = null;

function storageKey(formId: string) {
  return `da-forms-touch-${formId}`;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value.slice(0, 600) : undefined;
}

function currentTouch(): Touch {
  const formUrl = window.location.href;
  if (window.self === window.top) {
    return { page: formUrl, referrer: text(document.referrer), formUrl };
  }
  if (hostTouch) return { page: hostTouch.page, referrer: hostTouch.referrer, formUrl };
  return { page: text(document.referrer), formUrl, legacyEmbed: true };
}

function readSaved(formId: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(formId));
  } catch {
    return null;
  }
}

function save(formId: string, payload: string) {
  try {
    sessionStorage.setItem(storageKey(formId), payload);
  } catch {
    return;
  }
}

const TRACKING_PARAM = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|msclkid|ttclid|li_fat_id|twclid)$/i;

function hasTracking(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return [...new URL(url).searchParams.keys()].some((key) => TRACKING_PARAM.test(key));
  } catch {
    return false;
  }
}

function hasExternalReferrer(touch: Touch): boolean {
  if (!touch.referrer) return false;
  try {
    const referrerHost = new URL(touch.referrer).host;
    return [touch.page, touch.formUrl].every((url) => !url || new URL(url).host !== referrerHost);
  } catch {
    return false;
  }
}

function isCampaignTouch(touch: Touch): boolean {
  return hasTracking(touch.page) || hasTracking(touch.formUrl) || hasExternalReferrer(touch);
}

function savedTouch(formId: string): Touch | null {
  const saved = readSaved(formId);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as Touch;
  } catch {
    return null;
  }
}

function keepBest(formId: string, touch: Touch) {
  const previous = savedTouch(formId);
  if (previous && isCampaignTouch(previous) && !isCampaignTouch(touch)) return;
  save(formId, JSON.stringify(touch));
}

export function captureTouch(formId: string) {
  if (window.self !== window.top) return;
  keepBest(formId, currentTouch());
}

export function rememberHostTouch(formId: string, data: unknown) {
  if (!data || typeof data !== 'object') return;
  const { page, referrer } = data as Record<string, unknown>;
  hostTouch = { page: text(page), referrer: text(referrer) };
  keepBest(formId, currentTouch());
}

export function attributionPayload(formId: string): string {
  return readSaved(formId) ?? JSON.stringify(currentTouch());
}
