import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';

connectDb().then(() => {
  createApp().listen(env.port, () => {
    console.log(`backend listening on http://localhost:${env.port}`);
  });
});
