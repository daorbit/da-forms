/**
 * The HTML a notification email is rendered into.
 *
 * Built for mail clients rather than browsers, which is why it looks dated —
 * tables instead of flexbox, inline styles instead of a stylesheet, no
 * external assets. Nothing here is Quantalog-branded: these messages come from
 * whoever owns the form, so the only identity in them is the form's own name
 * and accent colour.
 *
 * Mirrored by `frontend/src/lib/emailTemplates.ts`, which renders the
 * composer's preview from the same markup. Change one, change the other.
 */

/**
 * The palette.
 *
 * Light, and deliberately so. A dark email is a bet that the client will
 * honour your background colour — and the one that most reliably does not,
 * Outlook's Word engine, keeps the text colour while dropping the background.
 * A light palette fails in the safe direction.
 */
const C = {
  page: '#f5f6f8',
  card: '#ffffff',
  panel: '#f3f4f6',
  line: '#e5e7eb',
  text: '#111827',
  dim: '#4b5563',
  faint: '#6b7280',
} as const;

/** The vertical rhythm, as a scale rather than a number per call site. */
const S = { tight: 8, block: 16, section: 24, major: 32 } as const;

export type EmailLayout = 'plain' | 'thankYou' | 'receipt' | 'nextSteps';

export interface LayoutOption {
  id: EmailLayout;
  label: string;
  /** One line on what it's for, so the right one is picked without opening it. */
  hint: string;
}

/** What the composer offers. Kept here so the picker and the renderer cannot drift. */
export const EMAIL_LAYOUTS: LayoutOption[] = [
  { id: 'plain', label: 'Plain', hint: 'Your text, lightly styled. No heading or extras.' },
  { id: 'thankYou', label: 'Thank you', hint: 'A confirmation tick above your message.' },
  { id: 'receipt', label: 'Receipt', hint: 'Your message, then a copy of what they submitted.' },
  { id: 'nextSteps', label: 'Next steps', hint: 'Your message, then a button to somewhere.' },
];

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * The shell every message shares: the card, the form's name, the body.
 *
 * The form name sits at the top as plain text rather than a logo — the sender
 * is a form we know only by title, and an invented mark would be someone
 * else's brand.
 */
function shell(formName: string, inner: string, accent: string): string {
  return `<div style="background:${C.page};padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <!--[if mso]>
  <style>.card, .panel { border-radius: 0 !important; }</style>
  <![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto">
    <tr><td class="card" style="background:${C.card};border:1px solid ${C.line};border-radius:14px;padding:${S.major}px">
      <p style="margin:0 0 ${S.major}px;font-size:15px;font-weight:700;color:${C.text};letter-spacing:-0.2px;text-align:center">
        ${escapeHtml(formName)}<span style="color:${accent}">.</span>
      </p>
      ${inner}
    </td></tr>
  </table>
</div>`;
}

/** The author's own text, as paragraphs. Blank lines separate them. */
function prose(text: string, align: 'left' | 'center' = 'left'): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 ${S.block}px;font-size:14.5px;line-height:1.7;color:${C.dim};text-align:${align}">${block.replace(
          /\n/g,
          '<br>'
        )}</p>`
    )
    .join('');
}

/**
 * The confirmation tick.
 *
 * Drawn as a table cell with a background rather than an image: an image in
 * email is hidden until the recipient clicks "show images", which for the one
 * element that says "this worked" is exactly the wrong thing to hide.
 */
function tick(accent: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto ${S.section}px"><tr>
    <td align="center" valign="middle" style="width:56px;height:56px;border-radius:28px;background:${accent};font-size:28px;line-height:56px;color:#ffffff;font-weight:700">&#10003;</td>
  </tr></table>`;
}

/** A label/value line in the submitted-answers panel. */
function answerRow(label: string, value: string, last: boolean): string {
  return `<tr>
    <td style="padding:9px 0;font-size:12.5px;color:${C.faint};white-space:nowrap;vertical-align:top;width:38%">${escapeHtml(label)}</td>
    <td style="padding:9px 0;font-size:13.5px;color:${C.text};text-align:right;vertical-align:top">${escapeHtml(value).replace(/\n/g, '<br>')}</td>
  </tr>${last ? '' : `<tr><td colspan="2" style="padding:0"><div style="height:1px;background:${C.line}"></div></td></tr>`}`;
}

/** The boxed copy of what someone submitted. */
export function answersPanel(answers: { label: string; value: string }[]): string {
  if (answers.length === 0) return '';
  return `<p style="margin:${S.section}px 0 ${S.tight}px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${C.faint}">What you sent</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td class="panel" style="background:${C.panel};border-radius:10px;padding:6px 18px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${answers.map((a, i) => answerRow(a.label, a.value, i === answers.length - 1)).join('')}
      </table>
    </td></tr>
  </table>`;
}

/**
 * A call-to-action button.
 *
 * A table with a background colour rather than a styled `<a>`: Outlook renders
 * the anchor's padding inconsistently, and a link that looks like plain text
 * is the difference between a message that converts and one that doesn't.
 */
function button(label: string, href: string, accent: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${S.section}px 0 0"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" style="background:${accent};border-radius:8px;mso-padding-alt:11px 22px">
        <a href="${escapeAttr(href)}" style="display:inline-block;padding:11px 22px;font-size:14px;font-weight:600;line-height:1;color:#ffffff !important;text-decoration:none !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">${escapeHtml(label)}</a>
      </td>
    </tr></table>
  </td></tr></table>`;
}

export interface RenderOptions {
  layout?: EmailLayout;
  formName: string;
  /** The message the form owner wrote, placeholders already filled. */
  body: string;
  /** Rendered by the receipt layout, and by any layout for the owner's own alert. */
  answers?: { label: string; value: string }[];
  cta?: { label: string; href: string };
  /** The form's own accent colour, so its mail matches its page. */
  accent?: string;
}

const DEFAULT_ACCENT = '#059669';

/**
 * Renders one notification email.
 *
 * Every layout is the author's text plus at most one built element — a tick, a
 * receipt panel, a button. Anything more would be inventing a message the form
 * owner did not write.
 */
export function renderEmail({
  layout = 'plain',
  formName,
  body,
  answers = [],
  cta,
  accent = DEFAULT_ACCENT,
}: RenderOptions): string {
  const centered = layout === 'thankYou';
  const parts: string[] = [];

  if (layout === 'thankYou') parts.push(tick(accent));
  parts.push(prose(body, centered ? 'center' : 'left'));
  if (layout === 'receipt') parts.push(answersPanel(answers));
  // Only an http(s) target gets a button — a `javascript:` or `data:` href
  // typed into the composer would be a scripting vector in whatever client
  // opens the message.
  if (layout === 'nextSteps' && cta?.href && /^https?:\/\//i.test(cta.href)) {
    parts.push(button(cta.label || 'Continue', cta.href, accent));
  }

  return shell(formName, parts.join(''), accent);
}
