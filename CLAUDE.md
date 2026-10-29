# da-forms — forms service

React (Vite, Mantine) frontend in `frontend`, Express + TypeScript backend in `backend`, MongoDB models. It is embedded inside the Quantalog dashboard (`../real-time-analytics`) as "Lead capture" and is also reachable on its own through public form links. Quantalog is live with real users, so keep changes safe and fast.

`npm run dev` at this root starts the backend on port 8081 and the frontend on port 3001 (proxies `/api`). Backend tests use `node:test` (`npm test` in `backend`, files `src/**/*.test.ts`). Both apps deploy as one Vercel project (`vercel.json`): `/api/*` goes to `backend/api/index.ts` and everything else to the frontend build.

## Structure

- Backend: `routes/form.route.ts` mounts workspace routes (`requireWorkspaceToken`), settings routes and public routes (rate limited). Logic lives in `services/*`. Controllers are split by area in `controllers/form/` (forms, submissions, publicForm, payments, formAi) and re-exported by `controllers/form.controller.ts`. Use `loadOwnedForm` from `controllers/form/shared.ts` for any route that must check a form belongs to the workspace. Gateways are in `services/gateways`. Shared helpers are in `lib/*`.
- Backend routes (`routes/index.ts`, all under `/api`): `/workspaces/:workspaceId/forms` and `/workspaces/:workspaceId/settings` (workspace token, `blockDemoWorkspaceWrites`), `/public/forms` (respondents), `/public/workspaces/:workspaceId/payments/*` (gateway webhooks and the PayU return, kept as raw bodies in `app.ts` so signatures verify), `/google-calendar/callback`, `/cron/*` and `/internal/*`.
- `/cron/*` (`routes/cron.route.ts`) runs `sweep-uploads`, `sweep-payments` and `sweep-partials`, behind `Bearer CRON_SECRET`. They are called by the `sweep-uploads-cron` Cloudflare Worker in `../real-time-analytics/real-ana-be/workers`. New scheduled work goes in that worker, never in a timer.
- `/internal/workspaces/:workspaceId` (DELETE, `Bearer FORMS_SERVICE_SECRET`) purges a workspace when Quantalog deletes it (`services/workspace-purge.service.ts`).
- Every call to Quantalog goes through `lib/quantalog.ts` (`/api/internal/forms/*`): plan limits, branding, AI generate and edit, the bell, Telegram, WhatsApp, audit and submissions. Form AI runs in Quantalog, not here.
- Work after a response (mail, webhooks, Sheets, alerts) goes through `runAfterResponse` in `lib/afterResponse.ts`, which uses Vercel's `waitUntil`. A submission's side effects are queued once through `queueSubmissionEffects` in `services/submissionEffects.service.ts`.
- Frontend: `pages/*` (form list, builder, entries, public form), `components/builder/*`, `components/apps/*`, `components/ui/*`, `lib/*` for pure helpers, `hooks/*`. Toasts go through `lib/notify.ts`.
- Embedded pages: `IS_EMBEDDED`
- Paid-response invoices: a payment field's `pay.invoice` (`enabled`, `taxRate`, set in the builder's Payment section) makes `services/submissionInvoice.service.ts` create a paid invoice in the workspace's Invoicing through `lib/invoicing.ts`. It runs as a `queueSubmissionEffects` effect for paid responses and from `POST /:id/submissions/:subId/invoice`, which also retries a failed one. The result is stored on the submission as `invoice` and shown in the payment dialog (`PaymentInvoiceRow`). It needs Quantalog's `limits.invoicingEnabled`, `INVOICES_API_BASE` and `FORMS_INVOICE_SECRET`. comes from `lib/bootParams.ts` (`?embedded=1`). Every embedded page header shows `HostNotificationsBell` next to the Docs button.
- Embedded mode reads the host theme and workspace token from `app/hostTokens.ts`, `app/themeParams.ts` and `hooks/useEmbedded.ts`.
- Telegram is not an app here. Quantalog owns the workspace's Telegram connection: the Quantalog bot or the workspace's own bot, with per-chat form alerts, set up in Apps → Telegram. `services/telegramAlert.service.ts` posts each alert through `sendTelegramAlert` in `lib/quantalog.ts`.
  - Each form opts in with `notifications.telegramEnabled`, set in the builder's Alerts dialog (`components/builder/alerts`), next to the Quantalog bell switch.
  - When it is unset, the form follows `ownerEnabled || ownerInAppEnabled`. `lib/notifyChannels.ts` holds that rule, mirrored in the frontend; change both together.
  - The bell, chat and Telegram alerts never depend on the plan's `notificationEmails`. Only email does.
- WhatsApp alerts:
  - Each form opts in with `notifications.whatsappEnabled`, in the same Alerts dialog.
  - Alerts post to Quantalog's `/api/internal/forms/whatsapp/:workspaceId`. Quantalog owns the WhatsApp connection (Apps → WhatsApp): numbers are verified with a WhatsApp code, and alerts go to verified numbers with `formAlerts` on, through the shared WireWeb number, on plans with `whatsappReports`.
- Microsoft Teams: Teams posts to a Workflows webhook as an Adaptive Card (`teamsCard` in `lib/chatAlert.ts`).
- Google Chat: posts a `cardsV2` card to a `chat.googleapis.com` space webhook (`googleChatCard`). Answer values are HTML-escaped, because card text accepts a little HTML. On the next alert, an old `telegram` AppConnection is moved to Quantalog with `importTelegramBot` and then deleted. If the move conflicts, it keeps sending directly.
- App catalog: `lib/app-catalog.ts` describes each connectable app (`brevo`, `smtp`, `slack`, `discord`, `teams`, `google-chat`) with its category, fields, which fields are secret and whether it can be tested. Quantalog's Apps screen renders its connect form from this descriptor (`GET /settings/apps`), so a new app needs a catalog entry, an `AppId` in `models/appConnection.model.ts` (one connection per workspace and app), a test in `controllers/appConnection.controller.ts` if `testable`, and a sender in `lib/chatAlert.ts` or `lib/mailer.ts`. The legacy `telegram` id is only migrated, never created.
- Secrets (app keys, payment keys, Google tokens) are encrypted with `ENCRYPTION_KEY` through `lib/crypto.ts`. Responses only ever carry `maskTail` values (`••••1234`); a save that omits a secret keeps the stored one.
- Payments, Google Calendar, Google Sheets and the webhook app have their own settings routes (`/settings/payments`, `/calendar`, `/sheets`, `/webhook-app`), not the generic `/settings/apps`. `/settings/telegram` and `/settings/whatsapp` only report whether Quantalog's connection can send form alerts.
- Workspace app connections (email, payments, Google Calendar, Slack, Discord, webhook) are managed only in Quantalog under Apps (`real-ana-fe/src/features/integrations`), which calls this service's `/settings/*` routes with the workspace token. This app has no connections UI of its own: every Connect or Manage action calls `openConnections(appId)` from `lib/hostConnections.ts`, which asks the host to navigate when embedded and opens the Quantalog tab otherwise.
- The look mirrors the Quantalog dashboard exactly, in light and dark. `app/theme.ts` matches `real-ana-fe/src/app/theme.ts`; `styles/tokens.css` matches the tokens at the top of `real-ana-fe/src/app/App.css`; `styles/mantine-overrides.css` matches its global Mantine rules (App.css and `polish.css`); `styles/dropdown.css` and `styles/fonts.css` are copies of theirs. Use the tokens (`--shell`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--text`, `--text-2`, `--muted`, `--accent`, `--cta`) rather than Mantine gray/dark shades or hex values, and change both repos together. The public form page is the exception: it renders inside `.da-forms-light-surface` with the form's own theme.

## What already exists

Form builder with drag and drop, steps, matrix, ranking, repeater, signature and file upload fields, formulas, thank-you pages, themes and backgrounds, device preview. AI form generation (from text or a photo) and AI editing (Orbit). Entries as table, Excel view and read/unread kanban, filters, bulk update and delete, attachments, PDF export. Partial save with resume link and edit-by-token. Quiz scoring through `correctOptions` and `optionValues`. Open and close dates and a submission cap (`schedule`). Payments through Razorpay, PayU and Cashfree. Notification emails with templates, app connections (Brevo, custom SMTP, Slack, Discord, Microsoft Teams and Google Chat through `lib/chatAlert.ts`, and Telegram and WhatsApp through Quantalog) and a webhook app. Google Sheets: the workspace connects a Google account with the `drive.file` scope (`services/sheetsConnection.service.ts`, sharing the Calendar OAuth client and callback, told apart by `kind` in the signed state), and `services/sheetsSync.service.ts` creates one spreadsheet per form on its first response and appends a row for each completed response (`FormSheet` stores the spreadsheet and its column order). Conditional logic: `showIf` holds one rule or an AND/OR group, with number comparisons; a condition on a `pageBreak` skips the step after it; `endings` pick a thank-you message or redirect by answer; `notifications.ownerRoutes` add owner email recipients by answer. The client evaluates in `utils/conditionalLogic.ts` and the server in `lib/conditions.ts`; change both together. Entries pipeline: stage (new, contacted, qualified, won, lost), assignee, tags and internal notes on each submission (`services/pipeline.service.ts`), a stage board in `EntriesKanban`, and a lead score summed from `optionValues` (`lib/leadScore.ts`). A template library, per-field drop-off analytics and CSV export. Quiz-funnel pieces (`components/funnel`):
  - Radio and Checkbox can render as picture cards: `choiceLayout: 'cards'`, `cardColumns`, and per-option `optionImages`, `optionBadges` and `optionHints`, keyed by option text like `optionValues`.
  - An `image` block.
  - A `loader` "analyzing" screen. It stands alone on its own step in one-question mode (`standsAlone` in `lib/questionPages.ts`), hides the nav buttons and advances itself after `duration` seconds.
  - A `countdown` timer. `duration` is in minutes and the deadline is kept in sessionStorage.

  All three blocks are display-only and are listed with the other layout types on both sides. A `booking` field (one per form): weekly hours, buffers, notice, seats and days off in `field.booking`; slots come from `lib/bookingSlots.ts` (mirrored in the frontend for the builder preview); `services/booking.service.ts` reserves a seat through the unique index on `Booking` and creates the Google Calendar event with a Meet link. The workspace's Google Calendar OAuth connection lives here (`services/calendarConnection.service.ts`, tokens encrypted with `ENCRYPTION_KEY`), not in Quantalog. Turnstile spam protection, per-form view analytics, share modal with QR and iframe embed snippets, plan limits and a demo workspace.

## Roadmap

1. WhatsApp alerts to more than the owner. That needs Meta's Cloud API in place of the shared WireWeb session.
2. An API for reading submissions from Quantalog, and a backfill of existing responses into a newly linked Google Sheet.
3. Assignee picked from the Quantalog workspace members, and a note author. Both need Quantalog to expose members and put the user in the workspace token, so they touch both repos.
4. Webhook events (`submission.created`, `payment.paid`), retries with backoff through `cron.route.ts`, and a delivery log in place of the single `lastStatus`.
5. Email and phone verification with a one-time code before submit.
6. Form version history with restore, saved on each publish. `useUndoHistory` covers only the open builder session.
7. Multi-language forms, picked by browser language or a URL parameter.
8. A/B variants with a traffic split, compared through the per-form view analytics.
9. Per-form data retention and deletion of one respondent's data.
10. Receipt PDF attached to the respondent email. `lib/submissionPdf.ts` is frontend only, so the backend needs its own.
11. HubSpot and Zoho CRM apps in `lib/app-catalog.ts`. Booking follow-ups: reschedule and cancel links for respondents, reminder emails through `cron.route.ts`.
12. Replace the remaining inline `style={{}}` props in the frontend (about 80) with CSS modules.
13. Add tests for submission validation and the payment webhooks. `formula`, `conditions`, `attribution` and `summaryWindow` already have tests.

## Rules

1. No comments in code files, including CSS.
2. No inline CSS. Use Mantine props, CSS modules and existing CSS files.
3. Split code into components, hooks, utilities and services. Never put a whole feature in one file.
4. Before writing anything new, search for an existing helper, hook, component or style and reuse it.
5. Public routes (`/public/forms/*`) carry customer traffic. Rate limit them, validate on the server, and never make a submission wait on mail, webhooks or AI. Send those after responding.
6. Every workspace query includes `workspaceId`. Bound every list with a limit or pagination, use `.select()` and `.lean()` for read-only results, and add an index for any new query shape.
7. Run independent awaits with `Promise.all`. No queries inside loops.
8. Deployed to Vercel serverless. Do not rely on in-memory state; scheduled work goes through `cron.route.ts`.
9. Keep response shapes stable. The Quantalog dashboard and its embedded frame depend on them, so check both repos when a shape or token claim changes.
10. Load heavy frontend libraries only on the screen that uses them.
11. User docs for forms live in the Quantalog landing page: `../real-time-analytics/quantalog-lp/src/content/docs/lead-capture.tsx` and `forms-*.tsx`, registered in `quantalog-lp/src/lib/docs.ts`. A new or changed user-facing feature updates the matching page in the same change, and the builder links to it with `DocsLink` and a path from `frontend/src/lib/docs.ts`.
12. The developer runs type-checks and builds. Do not run `tsc`, builds or test suites unless asked. In the final message, say what changed and what to check by hand.
