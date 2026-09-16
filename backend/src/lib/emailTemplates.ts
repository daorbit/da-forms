
const C = {
  page: '#f4f5f7',
  card: '#ffffff',
  line: '#e5e7eb',
  /** Hairlines inside a panel, which need to be lighter than the card's edge. */
  lineSoft: '#eef0f3',
  text: '#111827',
  dim: '#4b5563',
  faint: '#6b7280',
} as const;

/** The vertical rhythm, as a scale rather than a number per call site. */
const S = { tight: 8, block: 14, section: 22, major: 28 } as const;

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


export const EMAIL_LAYOUTS: LayoutOption[] = [
  { id: 'thankYou', label: 'Thank you', hint: 'A confirmation tick above your message.' },
  { id: 'receipt', label: 'Receipt', hint: 'Your message, then a copy of what they submitted.' },
  { id: 'nextSteps', label: 'Next steps', hint: 'Your message, then a button to somewhere.' },
  { id: 'confirmation', label: 'Confirmation', hint: 'Tick, message, their answers, and a button.' },
  { id: 'hero', label: 'Headline', hint: 'Your first line set large, as a headline.' },
  { id: 'plain', label: 'Plain', hint: 'Your text, lightly styled. No heading or extras.' },
];


const LAYOUT_ALIASES: Partial<Record<EmailLayout, EmailLayout>> = {
  banner: 'plain',
  minimal: 'plain',
};

export function normalizeLayout(layout: EmailLayout = 'plain'): EmailLayout {
  return LAYOUT_ALIASES[layout] ?? layout;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

const FONT = `Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`;


function brandRow(brand: { name: string; logoUrl?: string }, accent: string): string {
  const logo = brand.logoUrl
    ? `<td style="padding-right:10px;vertical-align:middle">
        <img src="${escapeAttr(brand.logoUrl)}" width="26" height="26" alt=""
          style="display:block;border:0;outline:none;text-decoration:none;width:26px;height:26px;border-radius:6px">
      </td>`
    : '';

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 ${S.section}px"><tr>
    ${logo}
    <td style="vertical-align:middle;font-size:17px;font-weight:700;color:${C.text};letter-spacing:-0.3px">${escapeHtml(brand.name)}<span style="color:${accent}">.</span></td>
  </tr></table>`;
}


function shell(
  formName: string,
  inner: string,
  accent: string,
  brand: { name: string; logoUrl?: string },
  /** Caption under the message. Absent for workspaces whose plan removed it. */
  poweredBy?: string
): string {
  const footer = poweredBy
    ? `<p style="margin:${S.block}px 0 0;font-size:11.5px;line-height:1.5;color:${C.faint};text-align:center">${escapeHtml(poweredBy)}</p>`
    : '';

  return `<div style="background:${C.page};padding:32px 16px;font-family:${FONT}">
  <!--[if mso]>
  <style>.card, .panel { border-radius: 0 !important; }</style>
  <![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto">
    <tr><td class="card" style="background:${C.card};border:1px solid ${C.line};border-radius:14px;padding:${S.major}px">

      ${brandRow(brand, accent)}

      <!-- A two-tone rule: a short accent segment against the full-width
           hairline. A band of colour across the whole card competed with the
           message; a stub of it reads as a mark rather than a header. -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 ${S.section}px">
        <tr>
          <td width="36" style="height:2px;background:${accent};border-radius:2px;font-size:0;line-height:0">&nbsp;</td>
          <td style="height:1px;background:${C.line};font-size:0;line-height:0">&nbsp;</td>
        </tr>
      </table>

      ${inner}

      <div style="margin-top:${S.major}px;padding-top:${S.block}px;border-top:1px solid ${C.lineSoft}">
        <p style="margin:0;font-size:12px;line-height:1.5;color:${C.faint}">
          Sent from <span style="color:${C.dim};font-weight:600">${escapeHtml(formName)}</span>
        </p>
      </div>
    </td></tr>
    <tr><td>${footer}</td></tr>
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


function prose(html: string, align: 'left' | 'center' = 'left'): string {
  const clean = sanitizeHtml(html).trim();
  const body = /<(p|h[1-3]|ul|ol|blockquote)\b/i.test(clean)
    ? clean
    : `<p>${clean.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;


  const styled = body
    .replace(/<p>/g, `<p style="margin:0 0 ${S.block}px">`)
    .replace(/<h1>/g, `<h1 style="margin:0 0 ${S.tight}px;font-size:21px;line-height:1.3;letter-spacing:-0.4px;color:${C.text}">`)
    .replace(/<h2>/g, `<h2 style="margin:0 0 ${S.tight}px;font-size:18px;line-height:1.3;letter-spacing:-0.3px;color:${C.text}">`)
    .replace(/<h3>/g, `<h3 style="margin:0 0 ${S.tight}px;font-size:16px;line-height:1.35;color:${C.text}">`)
    .replace(/<ul>/g, `<ul style="margin:0 0 ${S.block}px;padding-left:20px">`)
    .replace(/<ol>/g, `<ol style="margin:0 0 ${S.block}px;padding-left:20px">`)
    .replace(/<li>/g, `<li style="margin:0 0 5px">`)
    .replace(
      /<blockquote>/g,
      `<blockquote style="margin:0 0 ${S.block}px;padding:2px 0 2px 14px;border-left:3px solid ${C.line};color:${C.faint}">`
    );

  return `<div style="font-size:15px;line-height:1.65;color:${C.dim};text-align:${align}">
    ${styled.replace(new RegExp(`margin:0 0 ${S.block}px(?![\\s\\S]*margin:0 0 ${S.block}px)`), 'margin:0')}
  </div>`;
}


function tick(accent: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto ${S.block}px"><tr>
    <td align="center" valign="middle" style="width:42px;height:42px;border-radius:21px;background:${accent};font-size:20px;line-height:42px;color:#ffffff;font-weight:700">&#10003;</td>
  </tr></table>`;
}


function answerRow(label: string, value: string, last: boolean): string {
  return `<tr>
    <td style="padding:${last ? '11px 0 0' : '11px 0'}">
      <p style="margin:0 0 3px;font-size:10.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${C.faint}">${escapeHtml(label)}</p>
      <p style="margin:0;font-size:14.5px;line-height:1.5;color:${C.text}">${escapeHtml(value).replace(/\n/g, '<br>')}</p>
    </td>
  </tr>${last ? '' : `<tr><td style="padding:0"><div style="height:1px;background:${C.lineSoft}"></div></td></tr>`}`;
}

/**
 * The copy of what someone submitted.
 *
 * An outlined block rather than a filled grey card: the fill fought the message
 * above it for attention, and a tinted panel is the first thing a dark-mode
 * client inverts into something muddy.
 */
export function answersPanel(answers: { label: string; value: string }[]): string {
  if (answers.length === 0) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${S.section}px 0 0">
    <tr><td class="panel" style="border:1px solid ${C.line};border-radius:12px;padding:16px 18px">
      <p style="margin:0;font-size:10.5px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${C.faint}">What you sent</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${answers.map((a, i) => answerRow(a.label, a.value, i === answers.length - 1)).join('')}
      </table>
    </td></tr>
  </table>`;
}


function button(label: string, href: string, accent: string, align: 'left' | 'center'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${S.section}px 0 0"><tr><td align="${align}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" style="background:${accent};border-radius:8px;mso-padding-alt:12px 24px">
        <a href="${escapeAttr(href)}" style="display:inline-block;padding:12px 24px;font-size:14.5px;font-weight:600;line-height:1;color:#ffffff !important;text-decoration:none !important;font-family:${FONT}">${escapeHtml(label)}</a>
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
  brand?: { name: string; logoUrl?: string; accentColor?: string };
  poweredBy?: string;
}

const DEFAULT_ACCENT = '#059669';


export function renderEmail({
  layout = 'plain',
  formName,
  body,
  answers = [],
  cta,
  accent,
  brand,
  poweredBy,
}: RenderOptions): string {
  const resolved = normalizeLayout(layout);

  // The form's own accent wins over the workspace's, because a form can be
  // themed individually; the workspace colour is the fallback for the forms
  // that never set one.
  const tone = accent || brand?.accentColor || DEFAULT_ACCENT;

  const centered = resolved === 'thankYou' || resolved === 'confirmation';
  const showsTick = resolved === 'thankYou' || resolved === 'confirmation';
  const showsAnswers = resolved === 'receipt' || resolved === 'confirmation';
  const showsButton = resolved === 'nextSteps' || resolved === 'confirmation';

  const parts: string[] = [];

  if (showsTick) parts.push(tick(tone));

  if (resolved === 'hero') {
    const { headline, rest } = heroSplit(body);
    if (headline) {
      parts.push(
        `<div style="margin:0 0 ${S.block}px;font-size:23px;font-weight:700;line-height:1.3;letter-spacing:-0.5px;color:${C.text}">${headline}</div>`
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
    parts.push(button(cta.label || 'Continue', cta.href, tone, centered ? 'center' : 'left'));
  }

  return shell(formName, parts.join(''), tone, brand ?? { name: formName }, poweredBy);
}
