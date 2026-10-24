import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_DETAIL,
  areaOf,
  cooldownKey,
  firstAppFrame,
  opsAlertLogLine,
  presentFields,
  renderDirectAlert,
  routeShape,
  serverErrorAlert,
  serverResponseAlert,
  statusLabel,
  workspaceOf,
} from './opsAlertFormat.js';

const WID = '66f1a2b3c4d5e6f708192a3b';
const FOOTER = { environment: 'production', sentAt: new Date('2026-10-24T10:12:03.000Z') };

describe('routeShape', () => {
  test('replaces object ids and numbers and drops the query', () => {
    assert.equal(routeShape(`/api/workspaces/${WID}/forms/12/entries?page=2`), '/api/workspaces/:id/forms/:id/entries');
  });

  test('keeps route params and words', () => {
    assert.equal(routeShape('/api/public/forms/:slug/submit'), '/api/public/forms/:slug/submit');
  });
});

describe('areaOf', () => {
  test('names the feature under a workspace', () => {
    assert.equal(areaOf(`/api/workspaces/${WID}/settings/apps`), 'workspaces · settings');
  });

  test('names public routes by their resource', () => {
    assert.equal(areaOf('/api/public/forms/abc/submit'), 'public · forms');
  });

  test('uses the first segment otherwise', () => {
    assert.equal(areaOf('/api/google-calendar/callback?code=1'), 'google-calendar');
    assert.equal(areaOf('/'), 'root');
  });
});

describe('workspaceOf', () => {
  test('reads the workspace id or returns undefined', () => {
    assert.equal(workspaceOf(`/api/workspaces/${WID}/forms`), WID);
    assert.equal(workspaceOf('/api/public/forms/abc'), undefined);
  });
});

describe('statusLabel', () => {
  test('adds the reason phrase when one exists', () => {
    assert.equal(statusLabel(502), '502 Bad Gateway');
    assert.equal(statusLabel(599), '599');
  });
});

describe('firstAppFrame', () => {
  test('returns the first frame from the app source', () => {
    const stack = [
      'Error: boom',
      '    at Module._compile (node:internal/modules/cjs/loader:1:1)',
      '    at handle (D:/app/node_modules/express/lib/router/layer.js:95:5)',
      '    at saveKeys (file:///D:/app/src/services/payments.service.ts:31:9)',
    ].join('\n');
    assert.equal(firstAppFrame(stack), 'saveKeys (src/services/payments.service.ts:31:9)');
  });

  test('returns undefined without a stack or app frame', () => {
    assert.equal(firstAppFrame(undefined), undefined);
    assert.equal(firstAppFrame('Error\n    at x (node:internal/a:1:1)'), undefined);
  });
});

describe('presentFields', () => {
  test('drops empty values and keeps zero', () => {
    assert.deepEqual(
      presentFields([
        ['A', 'x'],
        ['B', undefined],
        ['C', ''],
        ['D', 0],
      ]),
      [
        { label: 'A', value: 'x' },
        { label: 'D', value: '0' },
      ],
    );
  });
});

describe('cooldownKey', () => {
  const base = { title: 'Request failed · 500 Internal Server Error', where: 'POST /x', detail: `form ${WID} failed 3 times` };

  test('groups repeats of the same failure', () => {
    assert.equal(cooldownKey(base), cooldownKey({ ...base, detail: 'form 0123456789abcdef01234567 failed 9 times' }));
  });

  test('separates different titles and endpoints', () => {
    assert.notEqual(cooldownKey(base), cooldownKey({ ...base, title: 'Other' }));
    assert.notEqual(cooldownKey(base), cooldownKey({ ...base, where: 'POST /y' }));
  });
});

describe('opsAlertLogLine', () => {
  test('writes one line with the fields', () => {
    assert.equal(
      opsAlertLogLine({ title: 'T', where: 'W', detail: 'D', fields: [{ label: 'Path', value: '/p' }] }),
      '[ops-alert] Forms API | T | W | D | Path=/p',
    );
    assert.equal(opsAlertLogLine({ title: 'T', where: 'W', detail: 'D' }), '[ops-alert] Forms API | T | W | D');
  });
});

describe('renderDirectAlert', () => {
  test('escapes HTML and says it bypassed Quantalog', () => {
    assert.equal(
      renderDirectAlert(
        { title: 'Request failed · 500 Internal Server Error', where: 'GET /<a>', detail: 'x & <y>', fields: [{ label: 'Path', value: '/a?b=<c>' }] },
        FOOTER,
      ),
      [
        '<b>Forms API · Request failed · 500 Internal Server Error</b>',
        '',
        '<b>Where:</b> <code>GET /&lt;a&gt;</code>',
        '<b>Issue:</b> x &amp; &lt;y&gt;',
        '<b>Path:</b> <code>/a?b=&lt;c&gt;</code>',
        '',
        '<i>production · sent directly, Quantalog relay failed · 2026-10-24T10:12:03.000Z</i>',
      ].join('\n'),
    );
  });
});

describe('serverResponseAlert', () => {
  test('describes the failed request', () => {
    assert.deepEqual(
      serverResponseAlert(502, {
        method: 'PUT',
        path: `/api/workspaces/${WID}/settings/payments?x=1`,
        route: `/api/workspaces/${WID}/settings/payments`,
        message: 'internal_error: Encryption key is missing',
        durationMs: 12,
        requestId: 'bom1::xyz',
      }),
      {
        title: 'Request failed · 502 Bad Gateway',
        where: 'PUT /api/workspaces/:id/settings/payments',
        detail: 'internal_error: Encryption key is missing',
        fields: [
          { label: 'Area', value: 'workspaces · settings' },
          { label: 'Path', value: `/api/workspaces/${WID}/settings/payments` },
          { label: 'Workspace', value: WID },
          { label: 'Took', value: '12 ms' },
          { label: 'Vercel request', value: 'bom1::xyz' },
        ],
      },
    );
  });

  test('falls back to the path and a default issue, and bounds the issue', () => {
    const alert = serverResponseAlert(500, { method: 'GET', path: '/api/public/forms/abc' });
    assert.equal(alert.where, 'GET /api/public/forms/abc');
    assert.equal(alert.detail, 'The endpoint answered with an error status but no error message.');
    assert.equal(serverResponseAlert(500, { method: 'GET', path: '/', message: 'x'.repeat(5000) }).detail.length, MAX_DETAIL);
  });
});

describe('serverErrorAlert', () => {
  test('reports the error and where it was thrown', () => {
    const error = Object.assign(new RangeError('bad page'), {
      code: 11001,
      stack: 'RangeError: bad page\n    at list (file:///var/task/dist/controllers/form/forms.controller.js:5:1)',
    });
    const alert = serverErrorAlert(error, 'GET', `/api/workspaces/${WID}/forms?page=-1`);
    assert.equal(alert.where, 'GET /api/workspaces/:id/forms');
    assert.equal(alert.detail, 'RangeError: bad page');
    assert.deepEqual(alert.fields, [
      { label: 'Area', value: 'workspaces · forms' },
      { label: 'Path', value: `/api/workspaces/${WID}/forms` },
      { label: 'Code', value: '11001' },
      { label: 'Thrown at', value: 'list (dist/controllers/form/forms.controller.js:5:1)' },
      { label: 'Workspace', value: WID },
    ]);
  });

  test('handles thrown values that are not errors', () => {
    assert.equal(serverErrorAlert(null, 'GET', '/x').detail, 'Error: null');
  });
});
