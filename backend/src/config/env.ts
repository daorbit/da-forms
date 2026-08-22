import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 8081),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: process.env.MONGODB_URI ?? '',
  // Signs the math-captcha token handed to respondents — falls back to a
  // fixed dev value so local setup needs no extra config, but production
  // should always set this.
  captchaSecret: process.env.CAPTCHA_SECRET ?? 'dev-captcha-secret-change-me',
};
