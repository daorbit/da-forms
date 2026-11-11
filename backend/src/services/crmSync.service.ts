import type { FormDocument, FormField } from '../models/form.model.js';
import type { SubmissionBooking, SubmissionPayment } from '../models/submission.model.js';
import { AppConnectionModel, type AppId } from '../models/appConnection.model.js';
import { CRM_APP_IDS } from '../lib/app-catalog.js';
import { flattenFields } from '../lib/pipe.js';
import { answersOf } from '../lib/submissionAnswers.js';
import type { CrmLead } from '../lib/crm/crmLead.js';
import { CRM_PROVIDERS } from '../lib/crm/crmProviders.js';
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

export function buildCrmLead({ form, data, payment, booking, leadSource }: CrmLeadInput): CrmLead {
  const customer = findCustomerDetails(form.fields, data);
  const { firstName, lastName } = splitName(customer.name);
  const answers = answersOf(form.fields, data, payment, booking)
    .map((a) => `${a.label}: ${a.value}`)
    .join('\n');
  const header = [`Form: ${form.title}`, leadSource ? `Lead source: ${leadSource}` : ''].filter(Boolean).join('\n');
  const who = customer.name ?? customer.email ?? FALLBACK_LAST_NAME;

  return {
    firstName,
    lastName: lastName ?? customer.email ?? FALLBACK_LAST_NAME,
    email: customer.email,
    phone: customer.phone,
    company: companyOf(form.fields, data) ?? customer.name ?? customer.email ?? form.title,
    description: `${header}\n\n${answers}`.slice(0, MAX_DESCRIPTION),
    title: `${who} · ${form.title}`.slice(0, 200),
  };
}

async function pushTo(workspaceId: string, appId: AppId, lead: CrmLead): Promise<void> {
  const provider = CRM_PROVIDERS[appId];
  if (!provider) return;
  const connection = await resolveConnection(workspaceId, appId);
  if (!connection) return;
  await provider.push(connection, lead);
  void markUsed(workspaceId, appId);
}

export async function pushLeadToCrm(input: CrmLeadInput): Promise<void> {
  const workspaceId = input.form.workspaceId;
  const enabled = await AppConnectionModel.find({ workspaceId, appId: { $in: CRM_APP_IDS }, enabled: true })
    .select('appId')
    .lean();
  if (!enabled.length) return;

  const lead = buildCrmLead(input);
  const results = await Promise.allSettled(enabled.map((row) => pushTo(workspaceId, row.appId as AppId, lead)));
  const failures = results.flatMap((r, i) => (r.status === 'rejected' ? [`${enabled[i].appId}: ${String(r.reason)}`] : []));
  if (failures.length) throw new Error(failures.join('; '));
}
