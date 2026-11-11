import { CrmError, crmFetch, errorText, type CrmLead } from './crmLead.js';

const HOST = /^[a-z0-9-]+\.(myfreshworks\.com|freshsales\.io)$/;

export interface FreshsalesCredentials {
  domain: string;
  apiKey: string;
}

function normaliseHost(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

function base(creds: FreshsalesCredentials): string {
  const host = normaliseHost(creds.domain);
  if (!HOST.test(host)) {
    throw new CrmError('Use your Freshsales address, like acme.myfreshworks.com or acme.freshsales.io.');
  }
  return host.endsWith('.freshsales.io') ? `https://${host}/api` : `https://${host}/crm/sales/api`;
}

function headers(creds: FreshsalesCredentials) {
  return { Authorization: `Token token=${creds.apiKey}`, 'Content-Type': 'application/json' };
}

export async function verifyFreshsales(creds: FreshsalesCredentials): Promise<void> {
  if (!creds.apiKey) throw new CrmError('Add your Freshsales API key.');
  const { ok, status, body } = await crmFetch(`${base(creds)}/selector/owners`, { headers: headers(creds) });
  if (status === 401 || status === 403) throw new CrmError('Freshsales refused the API key. Copy it again from Personal settings → API settings.');
  if (!ok) throw new CrmError(`Freshsales could not be reached: ${errorText(body, status)}`);
}

export async function createFreshsalesLead(creds: FreshsalesCredentials, lead: CrmLead): Promise<string> {
  const api = base(creds);
  const contact: Record<string, string> = { last_name: lead.lastName };
  if (lead.firstName) contact.first_name = lead.firstName;
  if (lead.email) contact.email = lead.email;
  if (lead.phone) contact.mobile_number = lead.phone;

  const created = await crmFetch(`${api}/contacts`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ contact }),
  });
  const id = (created.body.contact as { id?: unknown } | undefined)?.id;
  if (!created.ok || (typeof id !== 'number' && typeof id !== 'string')) {
    throw new CrmError(`Freshsales did not accept the contact: ${errorText(created.body, created.status)}`);
  }

  const note = await crmFetch(`${api}/notes`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ note: { description: lead.description, targetable_type: 'Contact', targetable_id: id } }),
  });
  if (!note.ok) throw new CrmError(`Freshsales saved the contact but not the answers note: ${errorText(note.body, note.status)}`);
  return String(id);
}
