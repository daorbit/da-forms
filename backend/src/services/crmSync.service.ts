import type { FormDocument, FormField } from '../models/form.model.js';
import type { SubmissionBooking, SubmissionPayment } from '../models/submission.model.js';
import { AppConnectionModel } from '../models/appConnection.model.js';
import { CRM_APP_IDS } from '../lib/app-catalog.js';
import { flattenFields } from '../lib/pipe.js';
import { answersOf } from '../lib/submissionAnswers.js';
import { createZohoLead, type ZohoCredentials, type ZohoLead } from '../lib/zohoCrm.js';
import { findCustomerDetails } from './payment.service.js';
import { markUsed, resolveConnection } from './appConnection.service.js';

const COMPANY_HINTS = ['company', 'organisation', 'organization', 'business', 'brand'];
const MAX_DESCRIPTION = 30_000;
const FALLBACK_LAST_NAME = 'Form lead';

export interface CrmLeadInput {
  form: FormDocument;
  data: Record<string, string>;
  payment?: SubmissionPayment;
  booking?: SubmissionBooking;
  leadSource?: string;
}

function companyOf(fields: FormField[], data: Record<string, string>): string | undefined {
  for (const field of flattenFields(fields)) {
    const label = (field.label ?? '').toLowerCase();
    const value = data[field.id];
    if (typeof value === 'string' && value.trim() && COMPANY_HINTS.some((hint) => label.includes(hint))) {
      return value.trim().slice(0, 200);
    }
  }
  return undefined;
}

function splitName(name: string | undefined): { firstName?: string; lastName?: string } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

export function buildCrmLead({ form, data, payment, booking, leadSource }: CrmLeadInput): ZohoLead {
  const customer = findCustomerDetails(form.fields, data);
  const { firstName, lastName } = splitName(customer.name);
  const answers = answersOf(form.fields, data, payment, booking)
    .map((a) => `${a.label}: ${a.value}`)
    .join('\n');
  const header = [`Form: ${form.title}`, leadSource ? `Lead source: ${leadSource}` : ''].filter(Boolean).join('\n');

  return {
    firstName,
    lastName: lastName ?? customer.email ?? FALLBACK_LAST_NAME,
    email: customer.email,
    phone: customer.phone,
    company: companyOf(form.fields, data) ?? customer.name ?? customer.email ?? form.title,
    description: `${header}\n\n${answers}`.slice(0, MAX_DESCRIPTION),
  };
}

function zohoCredentials(config: Record<string, unknown>, secrets: Record<string, string>): ZohoCredentials {
  return {
    region: String(config.region ?? 'com'),
    clientId: String(config.clientId ?? ''),
    clientSecret: secrets.clientSecret ?? '',
    refreshToken: secrets.refreshToken ?? '',
  };
}

export async function zohoCredentialsFor(workspaceId: string): Promise<ZohoCredentials | null> {
  const connection = await resolveConnection(workspaceId, 'zoho-crm');
  return connection ? zohoCredentials(connection.config, connection.secrets) : null;
}

export async function pushLeadToCrm(input: CrmLeadInput): Promise<void> {
  const workspaceId = input.form.workspaceId;
  const enabled = await AppConnectionModel.exists({ workspaceId, appId: { $in: CRM_APP_IDS }, enabled: true });
  if (!enabled) return;

  const creds = await zohoCredentialsFor(workspaceId);
  if (!creds) return;

  await createZohoLead(creds, buildCrmLead(input));
  void markUsed(workspaceId, 'zoho-crm');
}
