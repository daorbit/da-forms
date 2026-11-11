import { CrmError, crmFetch, errorText, type CrmLead } from './crmLead.js';

const API = 'https://api.hubapi.com';
const NOTE_TO_CONTACT = 202;
const EXISTING_ID = /Existing ID:\s*(\d+)/i;

export interface HubspotCredentials {
  accessToken: string;
}

function headers(creds: HubspotCredentials) {
  return { Authorization: `Bearer ${creds.accessToken}`, 'Content-Type': 'application/json' };
}

export async function verifyHubspot(creds: HubspotCredentials): Promise<void> {
  if (!creds.accessToken) throw new CrmError('Add your HubSpot private app access token.');
  const { ok, status, body } = await crmFetch(`${API}/crm/v3/objects/contacts?limit=1`, { headers: headers(creds) });
  if (status === 401) throw new CrmError('HubSpot refused the access token. Copy it again from your private app.');
  if (status === 403) throw new CrmError('The private app needs the crm.objects.contacts.read and crm.objects.contacts.write scopes.');
  if (!ok) throw new CrmError(`HubSpot could not be reached: ${errorText(body, status)}`);
}

async function upsertContact(creds: HubspotCredentials, lead: CrmLead): Promise<string> {
  const properties: Record<string, string> = { lastname: lead.lastName, company: lead.company, lifecyclestage: 'lead' };
  if (lead.firstName) properties.firstname = lead.firstName;
  if (lead.email) properties.email = lead.email;
  if (lead.phone) properties.phone = lead.phone;

  const { ok, status, body } = await crmFetch(`${API}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ properties }),
  });
  if (ok && typeof body.id === 'string') return body.id;
  if (status === 409) {
    const existing = EXISTING_ID.exec(errorText(body, status))?.[1];
    if (existing) return existing;
  }
  throw new CrmError(`HubSpot did not accept the contact: ${errorText(body, status)}`);
}

async function addNote(creds: HubspotCredentials, contactId: string, lead: CrmLead): Promise<void> {
  const { ok, status, body } = await crmFetch(`${API}/crm/v3/objects/notes`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({
      properties: { hs_timestamp: new Date().toISOString(), hs_note_body: lead.description.replace(/\n/g, '<br>') },
      associations: [
        { to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_CONTACT }] },
      ],
    }),
  });
  if (!ok) throw new CrmError(`HubSpot saved the contact but not the answers note: ${errorText(body, status)}`);
}

export async function createHubspotLead(creds: HubspotCredentials, lead: CrmLead): Promise<string> {
  const contactId = await upsertContact(creds, lead);
  await addNote(creds, contactId, lead);
  return contactId;
}
