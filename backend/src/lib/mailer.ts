import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

/** Whether credentials are configured at all. Callers check this before sending. */
export function mailConfigured(): boolean {
  return Boolean(env.smtpUser && env.smtpPass);
}

function mailFrom(): string {
  return env.smtpFrom ? `"${env.smtpFromName}" <${env.smtpFrom}>` : '';
}

let transporter: Transporter | null = null;

/** The shared transport, built on first use and reused across sends. */
function getTransport(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    // 465 is implicit TLS; 587 upgrades with STARTTLS instead.
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
  await getTransport().sendMail({ from: mailFrom(), to, subject, html, text });
}
