import { createTtlCache } from './ttlCache.js';

const REGIONS: Record<string, { accounts: string; api: string }> = {
  com: { accounts: 'https://accounts.zoho.com', api: 'https://www.zohoapis.com' },
  in: { accounts: 'https://accounts.zoho.in', api: 'https://www.zohoapis.in' },
  eu: { accounts: 'https://accounts.zoho.eu', api: 'https://www.zohoapis.eu' },
  'com.au': { accounts: 'https://accounts.zoho.com.au', api: 'https://www.zohoapis.com.au' },
  jp: { accounts: 'https://accounts.zoho.jp', api: 'https://www.zohoapis.jp' },
  ca: { accounts: 'https://accounts.zohocloud.ca', api: 'https://www.zohoapis.ca' },
};

const TOKEN_TTL_MS = 50 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;

const tokens = createTtlCache<string>(TOKEN_TTL_MS, 200);

export interface ZohoCredentials {
  region: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface ZohoLead {
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  company: string;
  description: string;
}

export class ZohoError extends Error {}

function endpoints(region: string) {
  const found = REGIONS[region.trim().toLowerCase().replace(/^\./, '')];
  if (!found) throw new ZohoError('Unknown Zoho data centre. Use com, in, eu, com.au, jp or ca.');
  return found;
}

export function isZohoRegion(region: string): boolean {
  return Boolean(REGIONS[region.trim().toLowerCase().replace(/^\./, '')]);
}

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}

async function requestAccessToken(creds: ZohoCredentials): Promise<string> {
  const { accounts } = endpoints(creds.region);
  const params = new URLSearchParams({
    refresh_token: creds.refreshToken,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    grant_type: 'refresh_token',
  });
  const { body } = await fetchJson(`${accounts}/oauth/v2/token?${params.toString()}`, { method: 'POST' });
  const token = typeof body.access_token === 'string' ? body.access_token : '';
  if (!token) {
    const reason = typeof body.error === 'string' ? body.error : 'no access token returned';
    throw new ZohoError(`Zoho refused the credentials (${reason}). Check the client ID, secret, refresh token and data centre.`);
  }
  return token;
}

export function zohoAccessToken(creds: ZohoCredentials): Promise<string> {
  return tokens.load(`${creds.region}:${creds.clientId}:${creds.refreshToken.slice(-12)}`, () => requestAccessToken(creds));
}

export async function createZohoLead(creds: ZohoCredentials, lead: ZohoLead): Promise<string | undefined> {
  const { api } = endpoints(creds.region);
  const token = await zohoAccessToken(creds);
  const record = {
    First_Name: lead.firstName,
    Last_Name: lead.lastName,
    Email: lead.email,
    Phone: lead.phone,
    Company: lead.company,
    Description: lead.description,
  };
  const { ok, status, body } = await fetchJson(`${api}/crm/v2/Leads`, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [record], trigger: ['workflow'] }),
  });
  const row = Array.isArray(body.data) ? (body.data[0] as Record<string, unknown> | undefined) : undefined;
  if (!ok || row?.status === 'error') {
    const message = typeof row?.message === 'string' ? row.message : `HTTP ${status}`;
    throw new ZohoError(`Zoho CRM did not accept the lead: ${message}`);
  }
  const details = row?.details as { id?: string } | undefined;
  return details?.id;
}
