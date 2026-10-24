import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express, { Router } from 'express';
import { createServerErrorReporter, markServerErrorReported, messageOf, type ServerErrorReport } from './server-error-reporter.js';

const WID = '66f1a2b3c4d5e6f708192a3b';
const SETTLE_MS = 30;

let captured: { status: number; report: ServerErrorReport }[] = [];
let server: Server;
let base: string;

function buildApp() {
  const app = express();
  app.use(createServerErrorReporter((status, report) => captured.push({ status, report }), ['/api/cron/']));

  const settings = Router();
  settings.put('/payments', (_req, res) => {
    res.status(500).json({ error: 'internal_error', message: 'Encryption key is missing' });
  });
  app.use('/api/workspaces/:workspaceId/settings', settings);

  app.post('/api/cron/sweep-uploads', (_req, res) => {
    res.status(500).json({ error: 'sweep failed' });
  });
  app.get('/ok', (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/bad', (_req, res) => {
    res.status(400).json({ error: 'invalid' });
  });
  app.get('/handled', (_req, res) => {
    markServerErrorReported(res);
    res.status(500).json({ error: 'already reported' });
  });
  app.get('/text', (_req, res) => {
    res.status(503).send('upload store unavailable');
  });
  return app;
}

async function call(path: string, init: RequestInit = {}): Promise<number> {
  const response = await fetch(`${base}${path}`, init);
  await response.arrayBuffer();
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
  return response.status;
}

before(async () => {
  server = buildApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  captured = [];
});

describe('createServerErrorReporter', () => {
  test('reports a 5xx with route, message, timing and request id', async () => {
    const status = await call(`/api/workspaces/${WID}/settings/payments?x=1`, {
      method: 'PUT',
      headers: { 'x-vercel-id': 'bom1::xyz' },
    });
    assert.equal(status, 500);
    assert.equal(captured.length, 1);
    const { report } = captured[0];
    assert.equal(captured[0].status, 500);
    assert.equal(report.method, 'PUT');
    assert.equal(report.path, `/api/workspaces/${WID}/settings/payments?x=1`);
    assert.equal(report.route, `/api/workspaces/${WID}/settings/payments`);
    assert.equal(report.message, 'internal_error: Encryption key is missing');
    assert.equal(report.requestId, 'bom1::xyz');
    assert.ok(report.durationMs >= 0);
  });

  test('skips the configured prefixes', async () => {
    assert.equal(await call('/api/cron/sweep-uploads', { method: 'POST' }), 500);
    assert.equal(captured.length, 0);
  });

  test('ignores 2xx and 4xx responses', async () => {
    await call('/ok');
    await call('/bad');
    assert.equal(captured.length, 0);
  });

  test('skips responses marked as already reported', async () => {
    await call('/handled');
    assert.equal(captured.length, 0);
  });

  test('reads plain-text bodies', async () => {
    await call('/text');
    assert.equal(captured[0].status, 503);
    assert.equal(captured[0].report.message, 'upload store unavailable');
    assert.equal(captured[0].report.requestId, undefined);
  });
});

describe('messageOf', () => {
  test('joins error and message', () => {
    assert.equal(messageOf({ error: 'duplicate', message: 'That value is already in use' }), 'duplicate: That value is already in use');
    assert.equal(messageOf({ error: 'only' }), 'only');
  });

  test('returns undefined for empty or unusable bodies', () => {
    assert.equal(messageOf({}), undefined);
    assert.equal(messageOf('  '), undefined);
    assert.equal(messageOf(undefined), undefined);
    assert.equal(messageOf(7), undefined);
  });

  test('bounds long text', () => {
    assert.equal(messageOf('y'.repeat(800))?.length, 500);
  });
});
