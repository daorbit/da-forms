import type { ErrorRequestHandler } from 'express';
import type { ApiError } from '../types/index.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const body: ApiError = {
    error: 'internal_error',
    message: err instanceof Error ? err.message : 'Unknown error',
  };
  res.status(500).json(body);
};
