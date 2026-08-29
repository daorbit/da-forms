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

export type EmailLayout =
  | 'plain'
  | 'thankYou'
  | 'receipt'
  | 'nextSteps'
  | 'banner'
  | 'confirmation'
  | 'minimal'
  | 'hero';

export interface LayoutOption {
  id: EmailLayout;
  label: string;
  /** One line on what it's for, so the right one is picked without opening it. */
  hint: string;
}

/** What the composer offers. Kept here so the picker and the renderer cannot drift. */
export const EMAIL_LAYOUTS: LayoutOption[] = [
  { id: 'thankYou', label: 'Thank you', hint: 'A confirmation tick above your message.' },
  { id: 'receipt', label: 'Receipt', hint: 'Your message, then a copy of what they submitted.' },
  { id: 'nextSteps', label: 'Next steps', hint: 'Your message, then a button to somewhere.' },
  { id: 'confirmation', label: 'Confirmation', hint: 'Tick, message, their answers, and a button.' },
  { id: 'banner', label: 'Banner', hint: 'A coloured header band across the top of the card.' },
  { id: 'hero', label: 'Hero', hint: 'Your first line set large, as a headline.' },
  { id: 'plain', label: 'Plain', hint: 'Your text, lightly styled. No heading or extras.' },
  { id: 'minimal', label: 'Minimal', hint: 'No card, no chrome — text on a plain background.' },
];

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

/** How the card around a message is dressed. */
type Chrome = 'card' | 'banner' | 'bare';

/**
 * The shell every message shares: the card, the form's name, the body.
 *
 * The form name sits at the top as plain text rather than a logo — the sender
 * is a form we know only by title, and an invented mark would be someone
 * else's brand.
 *
 * "banner" moves that name into a coloured band across the top; "bare" drops
 * the card altogether, for the layout that wants to look like a message
 * someone typed rather than a designed notification.
 */
function shell(formName: string, inner: string, accent: string, chrome: Chrome = 'card'): string {
  if (chrome === 'bare') {
    return `<div style="background:${C.card};padding:40px 16px;font-family:${FONT}">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;margin:0 auto">
    <tr><td>
      ${inner}
      <p style="margin:${S.major}px 0 0;font-size:12px;color:${C.faint}">Sent from ${escapeHtml(formName)}</p>
    </td></tr>
  </table>
</div>`;
  }

  const header =
    chrome === 'banner'
      ? `<tr><td style="background:${accent};border-radius:14px 14px 0 0;padding:20px ${S.major}px">
        <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;letter-spacing:-0.2px">${escapeHtml(formName)}</p>
      </td></tr>`
      : '';

  const bodyRadius = chrome === 'banner' ? '0 0 14px 14px' : '14px';
  const bodyBorder =
    chrome === 'banner'
      ? `border:1px solid ${C.line};border-top:none`
      : `border:1px solid ${C.line}`;
  const nameLine =
    chrome === 'banner'
      ? ''
      : `<p style="margin:0 0 ${S.major}px;font-size:15px;font-weight:700;color:${C.text};letter-spacing:-0.2px;text-align:center">
        ${escapeHtml(formName)}<span style="color:${accent}">.</span>
      </p>`;

  return `<div style="background:${C.page};padding:40px 16px;font-family:${FONT}">
  <!--[if mso]>
  <style>.card, .panel { border-radius: 0 !important; }</style>
  <![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto">
    ${header}
    <tr><td class="card" style="background:${C.card};${bodyBorder};border-radius:${bodyRadius};padding:${S.major}px">
      ${nameLine}
      ${inner}
    </td></tr>
  </table>
</div>`;
}

/**
 * The opening line, set as a headline.
 *
 * Takes the message's own first paragraph rather than inventing a heading —
 * the form owner wrote the words, this only sets them larger.
 */
function heroSplit(html: string): { headline: string; rest: string } {
  const clean = sanitizeHtml(html).trim();
  // The body is HTML from the editor, so the "first line" is its first block
  // element rather than the text before a blank line.
  const match = /^\s*<(p|h[1-3])>([\s\S]*?)<\/\1>/i.exec(clean);
  if (match) {
    return { headline: match[2], rest: clean.slice(match[0].length) };
  }
  // A body with no block markup at all: the first line is the headline.
  const [first, ...others] = clean.split(/<br\s*\/?>|\n/);
  return { headline: first ?? '', rest: others.join('<br>') };
}

/**
 * The tags the composer's editor can produce, and nothing else.
 *
 * The body arrives as HTML from a rich text editor, so it cannot simply be
 * escaped — but it is also not trusted markup: it is stored on a form and sent
 * to other people, so anything outside this list (a `<script>`, an `<iframe>`,
 * an event handler) is stripped rather than passed on to a mail client.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'span',
]);

function sanitizeHtml(html: string): string {
  return (
    html
      // Whole elements whose content is never body copy, contents included.
      .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]+>/g, (tag) => {
        const name = /^<\/?\s*([a-z0-9]+)/i.exec(tag)?.[1]?.toLowerCase();
        if (!name || !ALLOWED_TAGS.has(name)) return '';
        if (name === 'a') {
          // Only an http(s)/mailto target survives; `javascript:` and `data:`
          // hrefs are exactly what this is here to drop.
          const href = /href\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1] ?? '';
          if (!/^(https?:\/\/|mailto:)/i.test(href)) return tag.startsWith('</') ? '</a>' : '<a>';
          return tag.startsWith('</')
            ? '</a>'
            : `<a href="${escapeAttr(href)}" style="color:${C.text};text-decoration:underline">`;
        }
        // Everything else keeps the tag but loses its attributes, which is
        // where `onclick`, `style` overrides and stray classes would ride in.
        return tag.startsWith('</') ? `</${name}>` : `<${name}>`;
      })
  );
}

/**
 * The author's own message.
 *
 * Written in a rich text editor, so this is HTML: sanitised, then given the
 * type scale the rest of the template uses. Plain text still works — a body
 * with no tags comes through as its own paragraph.
 */
function prose(html: string, align: 'left' | 'center' = 'left'): string {
  const clean = sanitizeHtml(html).trim();
  const body = /<(p|h[1-3]|ul|ol|blockquote)\b/i.test(clean)
    ? clean
    : `<p>${clean.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

  // Styled by wrapping rather than by rewriting each tag: inline styles on a
  // container are inherited by the text inside it in every mail client that
  // matters, and the margins below are set on the elements themselves.
  return `<div style="font-size:14.5px;line-height:1.7;color:${C.dim};text-align:${align}">
    ${body
      .replace(/<p>/g, `<p style="margin:0 0 ${S.block}px">`)
      .replace(/<h1>/g, `<h1 style="margin:0 0 ${S.tight}px;font-size:22px;line-height:1.3;color:${C.text}">`)
      .replace(/<h2>/g, `<h2 style="margin:0 0 ${S.tight}px;font-size:19px;line-height:1.3;color:${C.text}">`)
      .replace(/<h3>/g, `<h3 style="margin:0 0 ${S.tight}px;font-size:16px;line-height:1.35;color:${C.text}">`)
      .replace(/<ul>/g, `<ul style="margin:0 0 ${S.block}px;padding-left:22px">`)
      .replace(/<ol>/g, `<ol style="margin:0 0 ${S.block}px;padding-left:22px">`)
      .replace(/<li>/g, `<li style="margin:0 0 4px">`)
      .replace(
        /<blockquote>/g,
        `<blockquote style="margin:0 0 ${S.block}px;padding:2px 0 2px 14px;border-left:3px solid ${C.line};color:${C.faint}">`
      )}
  </div>`;
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

/**
 * One answer in the submitted-answers panel.
 *
 * Label above value rather than the two in opposing columns: a right-aligned
 * value column reads as a price list, and it breaks badly the moment an answer
 * is a paragraph rather than a word — which is most of them.
 */
function answerRow(label: string, value: string, last: boolean): string {
  return `<tr>
    <td style="padding:${last ? `12px 0 2px` : `12px 0`}">
      <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;color:${C.faint}">${escapeHtml(label)}</p>
      <p style="margin:0;font-size:14.5px;line-height:1.5;color:${C.text}">${escapeHtml(value).replace(/\n/g, '<br>')}</p>
    </td>
  </tr>${last ? '' : `<tr><td style="padding:0"><div style="height:1px;background:${C.line}"></div></td></tr>`}`;
}

/**
 * The copy of what someone submitted.
 *
 * An outlined block with a rule under its heading, rather than a filled grey
 * card: the fill fought the message above it for attention, and a tinted panel
 * is the first thing a dark-mode client inverts into something muddy.
 */
export function answersPanel(answers: { label: string; value: string }[]): string {
  if (answers.length === 0) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${S.section}px 0 0">
    <tr><td class="panel" style="border:1px solid ${C.line};border-radius:12px;padding:4px 20px 16px">
      <p style="margin:${S.block}px 0 0;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${C.faint}">What you sent</p>
      <div style="height:1px;background:${C.line};margin:10px 0 0"></div>
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
  const centered = layout === 'thankYou' || layout === 'confirmation';
  const showsTick = layout === 'thankYou' || layout === 'confirmation';
  const showsAnswers = layout === 'receipt' || layout === 'confirmation';
  const showsButton = layout === 'nextSteps' || layout === 'confirmation';
  const chrome: Chrome = layout === 'banner' ? 'banner' : layout === 'minimal' ? 'bare' : 'card';

  const parts: string[] = [];

  if (showsTick) parts.push(tick(accent));

  if (layout === 'hero') {
    const { headline, rest } = heroSplit(body);
    if (headline) {
      parts.push(
        `<div style="margin:0 0 ${S.block}px;font-size:24px;font-weight:700;line-height:1.25;letter-spacing:-0.5px;color:${C.text}">${headline}</div>`
      );
    }
    if (rest) parts.push(prose(rest));
  } else {
    parts.push(prose(body, centered ? 'center' : 'left'));
  }

  if (showsAnswers) parts.push(answersPanel(answers));

  // Only an http(s) target gets a button — a `javascript:` or `data:` href
  // typed into the composer would be a scripting vector in whatever client
  // opens the message.
  if (showsButton && cta?.href && /^https?:\/\//i.test(cta.href)) {
    parts.push(button(cta.label || 'Continue', cta.href, accent));
  }

  return shell(formName, parts.join(''), accent, chrome);
}
