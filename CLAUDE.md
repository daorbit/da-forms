# da-forms — forms service

React (Vite, Mantine) frontend in `frontend`, Express + TypeScript backend in `backend`, MongoDB models. It is embedded inside the Quantalog dashboard (`../real-time-analytics`) as "Lead capture" and is also reachable on its own through public form links. Quantalog is live with real users, so keep changes safe and fast.

## Structure

- Backend: `routes/form.route.ts` mounts workspace routes (`requireWorkspaceToken`), settings routes and public routes (rate limited). Logic lives in `services/*`. Controllers are split by area in `controllers/form/` (forms, submissions, publicForm, payments, formAi) and re-exported by `controllers/form.controller.ts`. Use `loadOwnedForm` from `controllers/form/shared.ts` for any route that must check a form belongs to the workspace. Gateways are in `services/gateways`. Shared helpers are in `lib/*`.
- Frontend: `pages/*` (form list, builder, entries, public form), `components/builder/*`, `components/apps/*`, `lib/*` for pure helpers, `hooks/*`.
- Embedded mode reads the host theme and workspace token from `app/hostTokens.ts`, `app/themeParams.ts` and `hooks/useEmbedded.ts`.

## What already exists

Form builder with drag and drop, steps, matrix, ranking, repeater, signature and file upload fields, formulas, thank-you pages, themes and backgrounds, device preview. AI form generation (from text or a photo) and AI editing (Orbit). Entries as table, Excel view and read/unread kanban, filters, bulk update and delete, attachments, PDF export. Partial save with resume link and edit-by-token. Quiz scoring through `correctOptions` and `optionValues`. Open and close dates and a submission cap (`schedule`). Payments through Razorpay, PayU and Cashfree. Notification emails with templates, app connections (Brevo, custom SMTP, Slack and Discord) and a webhook app. Conditional logic: `showIf` holds one rule or an AND/OR group, with number comparisons; a condition on a `pageBreak` skips the step after it; `endings` pick a thank-you message or redirect by answer; `notifications.ownerRoutes` add owner email recipients by answer. The client evaluates in `utils/conditionalLogic.ts` and the server in `lib/conditions.ts`; change both together. Entries pipeline: stage (new, contacted, qualified, won, lost), assignee, tags and internal notes on each submission (`services/pipeline.service.ts`), a stage board in `EntriesKanban`, and a lead score summed from `optionValues` (`lib/leadScore.ts`). A template library, per-field drop-off analytics and CSV export. Turnstile spam protection, per-form view analytics, share modal with QR and iframe embed snippets, plan limits and a demo workspace.

## Roadmap

1. WhatsApp alerts as another entry in `lib/app-catalog.ts` (category `notification`), posted through `lib/chatAlert.ts`.
2. Export to Google Sheets and an API for reading submissions from Quantalog.
3. Assignee picked from the Quantalog workspace members, and a note author. Both need Quantalog to expose members and put the user in the workspace token, so they touch both repos.
4. Webhook events (`submission.created`, `payment.paid`), retries with backoff through `cron.route.ts`, and a delivery log in place of the single `lastStatus`.
5. Email and phone verification with a one-time code before submit.
6. Form version history with restore, saved on each publish. `useUndoHistory` covers only the open builder session.
7. Multi-language forms, picked by browser language or a URL parameter.
8. A/B variants with a traffic split, compared through the per-form view analytics.
9. Per-form data retention and deletion of one respondent's data.
10. Receipt PDF attached to the respondent email. `lib/submissionPdf.ts` is frontend only, so the backend needs its own.
11. A booking field backed by Google Calendar, and HubSpot and Zoho CRM apps in `lib/app-catalog.ts`.
12. Replace the remaining inline `style={{}}` props in the frontend with CSS modules.
13. Add tests for `lib/formula.ts`, `lib/conditions.ts`, validation and the payment webhooks.

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
