# How the three repos fit together

Three git repos sit side by side in one parent folder (`ana-plus-forms`) and ship as one product, Quantalog. Paths below start from that parent folder.

| Repo | Role | Local ports | Production |
|---|---|---|---|
| `real-time-analytics` | **Quantalog**, the host: dashboard (`real-ana-fe`), API (`real-ana-be`), landing page and docs (`quantalog-lp`), Orbit AI extension | API 4000, dashboard 5173, landing 5777 | `quantalog-be.daorbit.in`, `studio-quantalog.daorbit.in` |
| `da-forms` | **Lead capture**, the forms service | API 8081, app 3001 | `forms.daorbit.in` |
| `invoice-generator` | **Invoicing**, the quotes and invoices service | API 8082, app 3002 | `invoicing.daorbit.in` |

The ports don't overlap, so `npm run dev` in all three runs the whole product at once.

## The shape of it

```
                 ┌──────────────────────────────────────────┐
                 │  real-time-analytics (Quantalog)         │
                 │  owns users, sessions, workspaces,       │
                 │  roles, plans, billing, the bell,        │
                 │  Telegram, WhatsApp, AI, cron workers    │
                 └───────┬──────────────────────┬───────────┘
   iframe + workspace    │                      │   iframe + workspace
   token (forms-token)   │                      │   token (invoices-token)
                         ▼                      ▼
             ┌──────────────────────┐  ┌──────────────────────┐
             │  da-forms            │  │  invoice-generator   │
             │  forms, submissions, │  │  quotations,         │
             │  form app connections│  │  invoices, business  │
             │  payments, bookings  │  │  profile             │
             └──────────────────────┘  └──────────────────────┘
```

Quantalog is the only place with accounts. Both services trust a short-lived workspace token that Quantalog signs, and neither has its own login. The two services don't talk to each other.

## Embedding

| | da-forms | invoice-generator |
|---|---|---|
| Dashboard route | `/app/lead-capture` | `/app/invoices` (only while the `invoicing` app is on) |
| Host feature | `real-ana-fe/src/features/leadCapture` | `real-ana-fe/src/features/invoices` |
| Frame URL env | `VITE_LEAD_FORMS_URL` | `VITE_INVOICES_URL` (tile hidden while unset) |
| Frame reads boot params in | `da-forms/frontend/src/lib/bootParams.ts` (`?embedded=1`, `IS_EMBEDDED`) | `invoice-generator/frontend/src/lib/bootParams.ts` (`/<workspaceId>?embedded=1&wt=<token>`) |

The host passes its theme and the workspace token in the frame URL. The frame asks the host for things with `postMessage`: a fresh token (`quantalog:workspace-token-request`, answered by `useHostFrameToken`), opening the bell, or navigating to Apps (`da-forms/frontend/src/lib/hostConnections.ts`, `invoice-generator/frontend/src/lib/hostMessages.ts`). Both services also work outside the frame: da-forms through public form links, invoice-generator shows "Open from Quantalog".

## Workspace tokens

| | da-forms | invoice-generator |
|---|---|---|
| Minted by | `POST /api/workspaces/:wid/forms-token` (`real-ana-be/src/http/routes/forms-token.ts`) | `POST /api/workspaces/:wid/invoices-token` (`real-ana-be/src/http/routes/invoices-token.ts`) |
| Signed with | `FORMS_SERVICE_SECRET` | `INVOICE_SERVICE_SECRET` |
| Checked by | `da-forms/backend/src/middleware/require-workspace-token.ts` | `invoice-generator/backend/src/lib/workspace-token.ts` |

Both tokens have the same format (`workspaceId.expiresAt.actorId.signature`, HMAC-SHA256, base64url), last one hour and are minted for editors and above. The invoices token is refused while the Invoicing app is off.

## Calls between the backends

**Quantalog → da-forms** (`FORMS_API_BASE`, workspace token)
- Apps screen (`real-ana-fe/src/features/integrations`, `lib/formsClient.ts`) manages form connections through da-forms `/api/workspaces/:id/settings/*`: email (Brevo, SMTP), Slack, Discord, Teams, Google Chat, payments (Razorpay, Cashfree, PayU), Google Calendar, Google Sheets, webhook. da-forms has no connections UI of its own.
- The MCP connector for Claude and ChatGPT reads forms and submissions from da-forms (`real-ana-be/src/infra/http-client/forms-service.ts`).
- Quantalog Popups shows published da-forms forms on customer sites through `tracker.js`.
- Workspace deletion calls da-forms `DELETE /api/internal/workspaces/:id` (`Bearer FORMS_SERVICE_SECRET`).

**da-forms → Quantalog** (`QUANTALOG_API_URL`, `Bearer FORMS_SERVICE_SECRET`)
- Every call goes through `da-forms/backend/src/lib/quantalog.ts` to `/api/internal/forms/*` (`real-ana-be/src/http/routes/forms-internal.ts`): `limits`, `branding`, `generate` and `edit` (form AI runs in Quantalog's `modules/forms-ai`), `notify` (the bell), `telegram`, `telegram-import`, `whatsapp`, `audit`, `submissions`.
- Plan-limit refusals use Quantalog's `planLimit(...)` shape (402, `quota_exceeded` or `plan_required`).

**Quantalog → invoice-generator** (`INVOICES_API_BASE`)
- The Invoicing panel in Apps (`InvoicingSettings.tsx`, `invoicesClient.ts`, sharing `createServiceClient` with `formsClient`) saves business details to `PUT /settings` with the workspace token.
- Workspace deletion calls `DELETE /api/internal/workspaces/:id` (`purgeInvoiceWorkspace` in `real-ana-be/src/infra/http-client/invoice-service.ts`, `Bearer INVOICE_SERVICE_SECRET`).

**invoice-generator → Quantalog** (`QUANTALOG_API_URL`, `Bearer INVOICE_SERVICE_SECRET`)
- Quotation and invoice emails go through `POST /api/internal/invoices/email/:workspaceId` (`real-ana-be/src/http/routes/invoices-internal.ts`), sent by Quantalog's mailer with the PDF attached and a link to the public page.
- Public share links (`/p/<token>`) are served by invoice-generator itself, without a token.

## Who owns what

| Thing | Lives in |
|---|---|
| Users, sessions, workspaces, roles, plans, billing | Quantalog |
| Quantalog app flags (`apps.<id>.enabled`, including `invoicing`) | Quantalog |
| Telegram and WhatsApp connections | Quantalog (da-forms only posts alerts to it) |
| Form AI (generate and edit) | Quantalog `modules/forms-ai` |
| Forms, submissions, pipeline, bookings | da-forms |
| Form app connections, payment gateways, Google Calendar and Sheets | da-forms (managed from Quantalog's Apps screen) |
| Invoices, quotations, numbering, business profile | invoice-generator |
| User docs for all three | `real-time-analytics/quantalog-lp/src/content/docs` (`lead-capture.tsx`, `forms-*.tsx`, `quantalog-invoicing.tsx`) |

## Scheduled work

None of the three uses Vercel Cron. Cloudflare Workers in `real-ana-be/workers/*-cron` call cron routes with `Bearer CRON_SECRET`. `sweep-uploads-cron` calls da-forms (`/api/cron/sweep-uploads`, `sweep-payments`, `sweep-partials`) and, every 5 minutes, invoice-generator's `/api/cron/scheduled-emails` through `INVOICES_API_BASE`. The Cloudflare account is at its trigger limit, so new scheduled work in any repo runs inside an existing worker tick.

## Shared secrets

| Secret | Same value in |
|---|---|
| `FORMS_SERVICE_SECRET` | `real-ana-be`, `da-forms/backend` |
| `INVOICE_SERVICE_SECRET` | `real-ana-be`, `invoice-generator/backend` |
| `CRON_SECRET` | `real-ana-be`, `da-forms/backend`, `invoice-generator/backend` |

## Shared look

One visual system across all three. `da-forms/frontend` copies the theme and tokens from `real-ana-fe` (`src/app/theme.ts`, the tokens in `src/app/App.css`, `polish.css`), and `invoice-generator/frontend` copies da-forms' copies along with its UI pieces (`PageHeader`, `DocsButton`, `HostNotificationsBell`, ...). A token or theme change goes to all three.

## Changes that cross repos

Update every affected repo in the same change when touching:
- a workspace token claim or format
- an `/api/internal/*` route on either side
- a response shape the other side reads (da-forms settings, forms and submissions; invoice-generator settings)
- the `planLimit` error shape
- theme tokens
- a user-facing feature (its docs page in `quantalog-lp`)
