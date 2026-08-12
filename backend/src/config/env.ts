import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 8081),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: process.env.MONGODB_URI ?? '',
};
