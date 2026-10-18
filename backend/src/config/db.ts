import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * One connection per process, reused across invocations.
 *
 * Serverless keeps a warm container between requests, so a fresh `connect` per
 * request would open connections faster than Atlas retires them and exhaust the
 * pool. The promise is cached, not the result: concurrent cold requests then
 * await the same in-flight connection rather than starting several.
 */
let pending: Promise<typeof mongoose> | null = null;

const CONNECTED = 1;
const DISCONNECTED = 0;

export function connectDb() {
  if (!env.mongodbUri) {
    console.warn('MONGODB_URI not set, skipping db connection');
    return Promise.resolve(null);
  }

  if (mongoose.connection.readyState === CONNECTED) return Promise.resolve(mongoose);

  if (!pending || mongoose.connection.readyState === DISCONNECTED) {
    pending = mongoose
      .connect(env.mongodbUri, { serverSelectionTimeoutMS: 10_000 })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }

  return pending;
}
