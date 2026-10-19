import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readWindow } from './summaryWindow.js';

const NOW = Date.parse('2026-10-19T00:00:00Z');

test('defaults to the last 30 days', () => {
  const window = readWindow({}, NOW);
  assert.ok(window);
  assert.equal(window.until.getTime(), NOW);
  assert.equal(window.until.getTime() - window.since.getTime(), 30 * 24 * 60 * 60 * 1000);
});

test('accepts an explicit range', () => {
  const window = readWindow({ from: '2026-09-01', to: '2026-09-30' }, NOW);
  assert.equal(window?.since.toISOString(), '2026-09-01T00:00:00.000Z');
});

test('rejects malformed, inverted and oversized ranges', () => {
  assert.equal(readWindow({ from: 'yesterday' }, NOW), null);
  assert.equal(readWindow({ from: '2026-10-01', to: '2026-09-01' }, NOW), null);
  assert.equal(readWindow({ from: '2024-01-01', to: '2026-01-01' }, NOW), null);
});
