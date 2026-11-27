import mongoose from 'mongoose';

export async function databaseHealth() {
  const started = Date.now();
  try {
    await mongoose.connection.db?.admin().ping();
    return { name: 'database', ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return { name: 'database', ok: false, latencyMs: Date.now() - started, detail: (error as Error).message };
  }
}