import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  if (!env.mongodbUri) {
    console.warn('MONGODB_URI not set, skipping db connection');
    return;
  }
  await mongoose.connect(env.mongodbUri);
  console.log('mongodb connected');
}
