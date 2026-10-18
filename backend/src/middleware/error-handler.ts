import type { ErrorRequestHandler } from 'express';
import type { ApiError } from '../types/index.js';

interface KnownError {
  name?: string;
  code?: number;
  type?: string;
}

function clientError(err: KnownError): { status: number; body: ApiError } | null {
  if (err.code === 11000) {
    return { status: 409, body: { error: 'duplicate', message: 'That value is already in use' } };
  }
  if (err.type === 'entity.parse.failed') {
    return { status: 400, body: { error: 'invalid_json', message: 'The request body is not valid JSON' } };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, body: { error: 'payload_too_large', message: 'The request is too large' } };
  }
  if (err.name === 'CastError') {
    return { status: 400, body: { error: 'invalid_id', message: 'That id is not valid' } };
  }
  if (err.name === 'ValidationError') {
    return { status: 400, body: { error: 'invalid_input', message: 'Some of the values are not valid' } };
  }
  return null;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    console.error(`[error] after response on ${req.method} ${req.originalUrl}:`, err);
    req.socket.destroy();
    return;
  }

  const known = err && typeof err === 'object' ? clientError(err as KnownError) : null;
  if (known) {
    res.status(known.status).json(known.body);
    return;
  }

  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  const body: ApiError = {
    error: 'internal_error',
    message: 'Something went wrong. Please try again.',
  };
  res.status(500).json(body);
};
