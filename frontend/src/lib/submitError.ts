import { ApiError } from '@/lib/api';

export function submitErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.status < 500 && e.message) return e.message;
  if (e instanceof ApiError) return 'We could not send your response. Please try again in a moment.';
  return 'We could not reach the server. Check your connection and try again.';
}

export function formStateChanged(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 402 || e.status === 403);
}
