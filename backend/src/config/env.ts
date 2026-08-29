import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 8081),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: process.env.MONGODB_URI ?? '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  smtpFromName: process.env.SMTP_FROM_NAME || 'Forms',
  /** Where to ask what a workspace's plan allows. Unset disables plan limits entirely. */
  quantalogApiUrl: (process.env.QUANTALOG_API_URL ?? '').replace(/\/$/, ''),
  formsServiceSecret: process.env.FORMS_SERVICE_SECRET ?? '',
  /**
   * Shared secret the scheduled-cleanup route requires. Unset means the route
   * refuses every caller: a sweep that deletes uploads must never be reachable
   * just because someone guessed the path.
   */
  cronSecret: process.env.CRON_SECRET ?? '',
  /**
   * How long an uploaded file may sit unclaimed before the sweep removes it.
   * A respondent who picks a file and then abandons the form leaves an asset
   * nothing will ever reference, and storage we are paying for.
   */
  uploadGraceMinutes: Number(process.env.UPLOAD_GRACE_MINUTES ?? 5),
  /**
   * Encrypts workspace payment credentials at rest. Unset means payments
   * cannot be configured at all — storing a Razorpay secret in the clear is
   * not a degraded mode worth offering. Generate with `openssl rand -hex 32`.
   */
  encryptionKey: process.env.ENCRYPTION_KEY ?? '',
  /**
   * How long a submission may sit awaiting payment before the sweep removes
   * it. Someone who opens checkout and closes the tab leaves a row that will
   * never complete; without this they accumulate forever.
   */
  paymentGraceMinutes: Number(process.env.PAYMENT_GRACE_MINUTES ?? 30),
};
