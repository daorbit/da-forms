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
        label: 'SMTP login',
        // Deliberately `text`, not `email`. Brevo shows some accounts their own
        // account address here and others a generated `xxxxxxx@smtp-brevo.com`
        // identifier; both are addresses, but the field must accept whatever
        // the SMTP tab shows rather than imply the sign-in address is correct.
        type: 'text',
        secret: false,
        required: true,
        placeholder: '8a1b2c001@smtp-brevo.com',
        help: 'Copy the Login shown on Brevo\'s SMTP & API page, SMTP tab. It is often your account address, but some accounts get a generated smtp-brevo.com login instead — use whatever that page shows.',
      },
      {
        key: 'smtpKey',
        label: 'SMTP key',
        type: 'password',
        secret: true,
        required: true,
        placeholder: 'xsmtpsib-…',
        help: 'On the same SMTP tab, copy or generate an SMTP key. Not a REST API key (xkeysib-…) — that pair fails with "535 5.7.8 Authentication failed".',
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
  {
    id: 'slack',
    name: 'Slack',
    category: 'notification',
    description: 'Post a message to a Slack channel for every new response.',
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    testable: true,
    fields: [
      {
        key: 'webhookUrl',
        label: 'Incoming webhook URL',
        type: 'password',
        secret: true,
        required: true,
        placeholder: 'https://hooks.slack.com/services/…',
        help: 'Create an incoming webhook for the channel and paste its URL.',
      },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'notification',
    description: 'Post a message to a Discord channel for every new response.',
    docsUrl: 'https://support.discord.com/hc/en-us/articles/228383668',
    testable: true,
    fields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'password',
        secret: true,
        required: true,
        placeholder: 'https://discord.com/api/webhooks/…',
        help: 'In channel settings, open Integrations, create a webhook and copy its URL.',
      },
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'notification',
    description: 'Post a card to a Microsoft Teams channel for every new response.',
    docsUrl: 'https://support.microsoft.com/en-us/office/create-incoming-webhooks-with-workflows-for-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498',
    testable: true,
    fields: [
      {
        key: 'webhookUrl',
        label: 'Workflow webhook URL',
        type: 'password',
        secret: true,
        required: true,
        placeholder: 'https://….logic.azure.com/workflows/…',
        help: 'In the channel, open Workflows, pick "Post to a channel when a webhook request is received", and copy the URL it gives you.',
      },
    ],
  },
  {
    id: 'google-chat',
    name: 'Google Chat',
    category: 'notification',
    description: 'Post a card to a Google Chat space for every new response.',
    docsUrl: 'https://developers.google.com/workspace/chat/quickstart/webhooks',
    testable: true,
    fields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'password',
        secret: true,
        required: true,
        placeholder: 'https://chat.googleapis.com/v1/spaces/…',
        help: 'In the space, open Apps & integrations, choose Webhooks, add one and copy its URL.',
      },
    ],
  },
];

/** App ids in the 'email' category — the mailer's candidate transports. */
export const EMAIL_APP_IDS = APP_CATALOG.filter((a) => a.category === 'email').map((a) => a.id);

export const CHAT_APP_IDS = APP_CATALOG.filter((a) => a.category === 'notification').map((a) => a.id);

export function getDescriptor(appId: string): AppDescriptor | undefined {
  return APP_CATALOG.find((a) => a.id === appId);
}

export function isAppId(value: unknown): value is AppId {
  return typeof value === 'string' && APP_CATALOG.some((a) => a.id === value);
}
