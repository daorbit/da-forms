import { CrmError, crmFetch, errorText, fullName, type CrmLead } from './crmLead.js';

const API = 'https://api.pipedrive.com/v1';

export interface PipedriveCredentials {
  apiToken: string;
}

function headers(creds: PipedriveCredentials) {
  return { 'x-api-token': creds.apiToken, 'Content-Type': 'application/json' };
}

function idOf(body: Record<string, unknown>): number | undefined {
  const id = (body.data as { id?: unknown } | undefined)?.id;
  return typeof id === 'number' ? id : undefined;
}

async function post(creds: PipedriveCredentials, path: string, payload: unknown, what: string) {
  const { ok, status, body } = await crmFetch(`${API}${path}`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify(payload),
  });
  if (!ok || body.success === false) throw new CrmError(`Pipedrive did not accept the ${what}: ${errorText(body, status)}`);
  return body;
}

export async function verifyPipedrive(creds: PipedriveCredentials): Promise<void> {
  if (!creds.apiToken) throw new CrmError('Add your Pipedrive API token.');
  const { ok, status, body } = await crmFetch(`${API}/users/me`, { headers: headers(creds) });
  if (status === 401) throw new CrmError('Pipedrive refused the API token. Copy it again from Personal preferences → API.');
  if (!ok) throw new CrmError(`Pipedrive could not be reached: ${errorText(body, status)}`);
}

export async function createPipedriveLead(creds: PipedriveCredentials, lead: CrmLead): Promise<string> {
  const person = await post(
    creds,
    '/persons',
    {
      name: fullName(lead) || lead.lastName,
      ...(lead.email ? { email: [{ value: lead.email, primary: true }] } : {}),
      ...(lead.phone ? { phone: [{ value: lead.phone, primary: true }] } : {}),
    },
    'person',
  );
  const personId = idOf(person);
  if (!personId) throw new CrmError('Pipedrive created the person but returned no id.');

  const created = await post(creds, '/leads', { title: lead.title, person_id: personId }, 'lead');
  const leadId = (created.data as { id?: unknown } | undefined)?.id;
  if (typeof leadId !== 'string') throw new CrmError('Pipedrive created the lead but returned no id.');

  await post(creds, '/notes', { content: lead.description.replace(/\n/g, '<br>'), lead_id: leadId }, 'answers note');
  return leadId;
}
