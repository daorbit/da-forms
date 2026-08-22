# DA Forms — Remaining Feature Ideas

Punted from a feature-brainstorm session. Nothing here is committed to a
timeline — this is a backlog, ranked roughly by value vs effort.

## Shipped this round (for context, not a todo)

- Spam protection: honeypot field + per-IP rate limiting + math CAPTCHA on
  public submissions.
- Analytics: per-form view/submission/completion-rate (Entries page), plus
  workspace-level stats (total forms, live/draft counts, total submissions)
  on the forms list.
- Public URL moved to `/from/:id/view`.

## High value, not built

- **Conditional logic** — show/hide a field based on another field's answer.
  Needs: a rule model on `FormField` (`showIf: { fieldId, operator, value }`),
  evaluation in both the builder canvas (live preview) and `FieldControl`
  render path, and validation so a hidden-but-required field doesn't block
  submission. Biggest gap vs Typeform/Google Forms.
- **Multi-page / multi-step forms** — split long forms into pages with a
  progress bar and per-page validation before advancing. Needs a `page`
  grouping on fields (or a new `pageBreak` field type) and step state in
  `FormRenderer`.
- **File upload storage** — `imageUpload`/`file` field types exist but check
  whether uploads persist anywhere (S3/local disk) vs just capturing a
  filename string. If the latter, this is a correctness gap, not a feature.
- **Webhooks / Zapier-style integration** — POST a payload to a configured
  URL on every new submission. High value for real usage, moderate backend
  effort (retry policy, signing).
- **Response export formats** — CSV export already exists on the Entries
  page; add per-submission detail view and PDF export.

## Medium value

- **Field-level duplicate/uniqueness validation** — e.g. reject a submission
  if an email or `uniqueId` field value already exists for that form.
- **Save a form as a reusable template** — right now templates are the 7
  hardcoded ones in `formTemplates.ts`; let a user promote one of their own
  forms into a template.
- **Team/collaborator access** — currently single-workspace with no
  invite/role system. Needed before this is usable by more than one person
  per workspace.
- **Field-level default/preset values** — type-specific presets (e.g.
  "today's date" default for a date field), beyond the current free-text
  Initial Value.
- **Per-field analytics / drop-off tracking** — where in a form respondents
  abandon. Needs tracking partial interaction, not just final submit —
  meaningfully more complex than the view/submit counters just added.

## Smaller polish

- **Duplicate whole form** from the Forms list (field-level duplicate exists
  in the builder; whole-form duplicate does not).
- **Custom CSS class / pixel-width override** per field, for power users.
- **Source/referrer breakdown** — `sourceUrl` is already captured on every
  submission (`Submission.sourceUrl`); grouping/displaying it on the
  Entries page is a cheap follow-up to the analytics work.
