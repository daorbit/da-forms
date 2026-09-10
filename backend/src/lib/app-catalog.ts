import type { AppId, AppCategory } from '../models/appConnection.model.js';

 
export type AppFieldType = 'text' | 'number' | 'password' | 'boolean' | 'email';

export interface AppField {
  key: string;
  label: string;
  type: AppFieldType;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  help?: string;
  default?: string | number | boolean;
}

export interface AppDescriptor {
  id: AppId;
  name: string;
  category: AppCategory;
  description: string;
  docsUrl?: string;
  testable: boolean;
  fields: AppField[];
}

const FROM_FIELDS: AppField[] = [
  {
    key: 'fromName',
    label: 'From name',
    type: 'text',
    secret: false,
    required: true,
    placeholder: 'Acme Forms',
    help: 'Shown as the sender name on every notification email.',
  },
  {
    key: 'fromEmail',
    label: 'From address',
    type: 'email',
    secret: false,
    required: true,
    placeholder: 'no-reply@acme.com',
    help: 'Must be an address the provider is allowed to send from.',
  },
];

export const APP_CATALOG: AppDescriptor[] = [
  {
    id: 'brevo',
    name: 'Brevo',
    category: 'email',
    description: 'Send notification emails through your Brevo account.',
    docsUrl: 'https://app.brevo.com/settings/keys/smtp',
    testable: true,
    fields: [
      {
        key: 'loginEmail',
        label: 'Brevo login email',
        type: 'email',
        secret: false,
        required: true,
        placeholder: 'you@company.com',
        help: 'The address you sign in to Brevo with — it is the SMTP username.',
      },
      {
        key: 'smtpKey',
        label: 'SMTP key',
        type: 'password',
        secret: true,
        required: true,
        placeholder: 'xsmtpsib-…',
        help: 'In Brevo, open SMTP & API, then the SMTP tab, and generate a new SMTP key. Not a REST API key.',
      },
      ...FROM_FIELDS,
    ],
  },
  {
    id: 'smtp',
    name: 'Custom SMTP',
    category: 'email',
    description: 'Send notification emails through your own mail server.',
    testable: true,
    fields: [
      {
        key: 'host',
        label: 'Host',
        type: 'text',
        secret: false,
        required: true,
        placeholder: 'smtp.example.com',
      },
      {
        key: 'port',
        label: 'Port',
        type: 'number',
        secret: false,
        required: true,
        default: 587,
        help: '465 for implicit TLS, 587 for STARTTLS.',
      },
      {
        key: 'secure',
        label: 'Use implicit TLS',
        type: 'boolean',
        secret: false,
        required: false,
        default: false,
        help: 'On for port 465. Leave off for 587.',
      },
      {
        key: 'user',
        label: 'Username',
        type: 'text',
        secret: false,
        required: true,
        placeholder: 'no-reply@example.com',
      },
      {
        key: 'pass',
        label: 'Password',
        type: 'password',
        secret: true,
        required: true,
      },
      ...FROM_FIELDS,
    ],
  },
];

/** App ids in the 'email' category — the mailer's candidate transports. */
export const EMAIL_APP_IDS = APP_CATALOG.filter((a) => a.category === 'email').map((a) => a.id);

export function getDescriptor(appId: string): AppDescriptor | undefined {
  return APP_CATALOG.find((a) => a.id === appId);
}

export function isAppId(value: unknown): value is AppId {
  return typeof value === 'string' && APP_CATALOG.some((a) => a.id === value);
}
