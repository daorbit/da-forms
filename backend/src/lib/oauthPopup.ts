import type { Response } from 'express';
import { env } from '../config/env.js';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderOAuthPopup(
  res: Response,
  options: { source: string; ok: boolean; title: string; message: string; reason?: string }
): void {
  const targetOrigin = env.publicFormBaseUrl || '*';
  const payload = JSON.stringify({ source: options.source, status: options.ok ? 'connected' : 'error', reason: options.reason ?? '' });

  res.type('html').send(`<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(options.title)}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f7f9; color: #1c1e21;
    font: 14px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { max-width: 340px; padding: 28px; text-align: center; }
  h1 { font-size: 15px; font-weight: 600; margin: 0; }
  p { color: #65676b; margin: 8px 0 16px; }
  button { border: 1px solid #ccd0d5; background: #fff; border-radius: 6px; padding: 7px 16px; font: inherit; cursor: pointer; }
</style>
<main>
  <h1>${escapeHtml(options.title)}</h1>
  <p>${escapeHtml(options.message)}</p>
  <button type="button" onclick="window.close()">Close</button>
</main>
<script>
  if (window.opener && window.opener !== window) {
    window.opener.postMessage(${payload}, ${JSON.stringify(targetOrigin)});
    ${options.ok ? 'window.close();' : ''}
  }
</script>`);
}
