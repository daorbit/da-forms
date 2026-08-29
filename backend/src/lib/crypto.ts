import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Symmetric encryption for third-party credentials we must be able to read back.
 *
 * Hashing is not an option here: calling Razorpay needs the real secret, not a
 * proof that someone knew it. So the goal is narrower than "unreadable" — it is
 * that a dump of the database alone is not enough. The key lives in the
 * environment, so an attacker needs both.
 *
 * AES-256-GCM rather than CBC: it authenticates as well as encrypts, so a
 * modified ciphertext throws instead of decrypting into a plausible-looking
 * wrong secret that we would then send to Razorpay.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — what GCM is specified for
const AUTH_TAG_LENGTH = 16;

export class EncryptionUnavailableError extends Error {
  constructor() {
    super('ENCRYPTION_KEY is not configured — payment credentials cannot be stored');
  }
}

export function isEncryptionConfigured(): boolean {
  return Boolean(env.encryptionKey);
}

/**
 * A 32-byte key from whatever the environment supplies.
 *
 * SHA-256 of the configured value, so operators are not forced to produce
 * exactly 32 bytes of base64 by hand. It stretches nothing — a weak key stays
 * weak — so the deployment notes ask for `openssl rand -hex 32`.
 */
function keyBytes(): Buffer {
  if (!env.encryptionKey) throw new EncryptionUnavailableError();
  return createHash('sha256').update(env.encryptionKey).digest();
}

/** Returns `iv:authTag:ciphertext`, all base64 — one self-contained string per column. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBytes(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

/**
 * Reverses `encrypt`. Throws on a malformed or tampered value rather than
 * returning something wrong — the caller is about to spend money with it.
 */
export function decrypt(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) throw new Error('Malformed encrypted value');

  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Malformed encrypted value');
  }

  const decipher = createDecipheriv(ALGORITHM, keyBytes(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString(
    'utf8'
  );
}

/**
 * The last four characters of a secret, for showing which key is saved without
 * handing it back. Everything else about the value stays server-side.
 */
export function maskTail(plaintext: string): string {
  return plaintext.length <= 4 ? '••••' : `••••${plaintext.slice(-4)}`;
}
