# da-forms — forms service

React (Vite, Mantine) frontend in `frontend`, Express + TypeScript backend in `backend`, MongoDB models. It is embedded inside the Quantalog dashboard (`../real-time-analytics`) as "Lead capture" and is also reachable on its own through public form links. Quantalog is live with real users, so keep changes safe and fast.

## Structure

- Backend: `routes/form.route.ts` mounts workspace routes (`requireWorkspaceToken`), settings routes and public routes (rate limited). Logic lives in `services/*`. Controllers are split by area in `controllers/form/` (forms, submissions, publicForm, payments, formAi) and re-exported by `controllers/form.controller.ts`. Use `loadOwnedForm` from `controllers/form/shared.ts` for any route that must check a form belongs to the workspace. Gateways are in `services/gateways`. Shared helpers are in `lib/*`.
- Frontend: `pages/*` (form list, builder, entries, public form), `components/builder/*`, `components/apps/*`, `lib/*` for pure helpers, `hooks/*`.
- Embedded mode reads the host theme and workspace token from `app/hostTokens.ts`, `app/themeParams.ts` and `hooks/useEmbedded.ts`.

## What already exists

Form builder with drag and drop, steps, matrix, ranking, repeater, signature and file upload fields, formulas, thank-you pages, themes and backgrounds, device preview. AI form generation and AI editing (Orbit). Entries as table, Excel view and read/unread kanban, filters, bulk update and delete, attachments. Partial save with resume link and edit-by-token. Payments through Razorpay, PayU and Cashfree. Notification emails with templates, app connections (Brevo, custom SMTP, Slack and Discord) and a webhook app. Conditional logic (`showIf`), a template library, per-field drop-off analytics and CSV export. Turnstile spam protection, per-form view analytics, share modal with QR, plan limits and a demo workspace.

## Roadmap

1. WhatsApp alerts as another entry in `lib/app-catalog.ts` (category `notification`), posted through `lib/chatAlert.ts`.
2. Export to Google Sheets and an API for reading submissions from Quantalog.
3. Replace the remaining inline `style={{}}` props in the frontend with CSS modules.
4. Add tests for `lib/formula.ts`, validation and the payment webhooks.

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
11. The developer runs type-checks and builds. Do not run `tsc`, builds or test suites unless asked. In the final message, say what changed and what to check by hand.
