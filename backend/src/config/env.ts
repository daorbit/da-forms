import 'dotenv/config';

/** Comma-separated list, so several consuming apps can share one deployment. */
function originList(value: string | undefined, fallback: string) {
  return (value ?? fallback)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT ?? 8081),
  corsOrigin: originList(process.env.CORS_ORIGIN, 'http://localhost:3001'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: process.env.MONGODB_URI ?? '',
};
