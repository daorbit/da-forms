export interface MailAttachment {
  filename: string;
  content: Buffer;
  cid: string;
  contentType?: string;
}

export interface MailMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
  headers?: Record<string, string>;
}

export interface MailTransport {
  sendMail(message: MailMessage): Promise<unknown>;
  verify(): Promise<unknown>;
  close(): void;
}

const API_BASE = 'https://api.resend.com';
const USER_AGENT = 'quantalog-forms';
const TIMEOUT_MS = 20_000;
const SEND_ONLY_KEY_STATUS = 401;
const SEND_ONLY_KEY_ERROR = 'restricted_api_key';

interface ResendError {
  name?: string;
  message?: string;
}

function request(apiKey: string, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function readError(res: Response): Promise<ResendError> {
  return ((await res.json().catch(() => null)) as ResendError | null) ?? {};
}

function failure(status: number, error: ResendError): Error {
  return new Error(error.message || `Resend answered with status ${status}.`);
}

function toResendAttachment(attachment: MailAttachment) {
  return {
    filename: attachment.filename,
    content: attachment.content.toString('base64'),
    content_id: attachment.cid,
    ...(attachment.contentType ? { content_type: attachment.contentType } : {}),
  };
}

export function createResendTransport(apiKey: string): MailTransport {
  return {
    async sendMail({ from, to, subject, html, text, attachments, headers }) {
      const res = await request(apiKey, '/emails', {
        method: 'POST',
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
          text,
          ...(attachments?.length ? { attachments: attachments.map(toResendAttachment) } : {}),
          ...(headers ? { headers } : {}),
        }),
      });
      if (!res.ok) throw failure(res.status, await readError(res));
      return res.json();
    },

    async verify() {
      const res = await request(apiKey, '/domains?limit=1');
      if (res.ok) return true;

      const error = await readError(res);
      if (res.status === SEND_ONLY_KEY_STATUS && error.name === SEND_ONLY_KEY_ERROR) return true;
      throw failure(res.status, error);
    },

    close() {},
  };
}
