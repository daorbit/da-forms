import type { AppId } from '../../models/appConnection.model.js';
import { createZohoLead, zohoAccessToken, type ZohoCredentials } from '../zohoCrm.js';
import type { CrmLead } from './crmLead.js';
import { createHubspotLead, verifyHubspot } from './hubspotCrm.js';
import { createPipedriveLead, verifyPipedrive } from './pipedriveCrm.js';
import { createFreshsalesLead, verifyFreshsales } from './freshsalesCrm.js';

export interface CrmConnection {
  config: Record<string, unknown>;
  secrets: Record<string, string>;
}

export interface CrmProvider {
  name: string;
  verify: (connection: CrmConnection) => Promise<void>;
  push: (connection: CrmConnection, lead: CrmLead) => Promise<unknown>;
}

function zoho({ config, secrets }: CrmConnection): ZohoCredentials {
  return {
    region: String(config.region ?? 'com'),
    clientId: String(config.clientId ?? ''),
    clientSecret: secrets.clientSecret ?? '',
    refreshToken: secrets.refreshToken ?? '',
  };
}

const hubspot = ({ secrets }: CrmConnection) => ({ accessToken: secrets.accessToken ?? '' });
const pipedrive = ({ secrets }: CrmConnection) => ({ apiToken: secrets.apiToken ?? '' });
const freshsales = ({ config, secrets }: CrmConnection) => ({ domain: String(config.domain ?? ''), apiKey: secrets.apiKey ?? '' });

export const CRM_PROVIDERS: Partial<Record<AppId, CrmProvider>> = {
  'zoho-crm': {
    name: 'Zoho CRM',
    verify: async (c) => {
      await zohoAccessToken(zoho(c));
    },
    push: (c, lead) => createZohoLead(zoho(c), lead),
  },
  hubspot: {
    name: 'HubSpot',
    verify: (c) => verifyHubspot(hubspot(c)),
    push: (c, lead) => createHubspotLead(hubspot(c), lead),
  },
  pipedrive: {
    name: 'Pipedrive',
    verify: (c) => verifyPipedrive(pipedrive(c)),
    push: (c, lead) => createPipedriveLead(pipedrive(c), lead),
  },
  freshsales: {
    name: 'Freshsales',
    verify: (c) => verifyFreshsales(freshsales(c)),
    push: (c, lead) => createFreshsalesLead(freshsales(c), lead),
  },
};
