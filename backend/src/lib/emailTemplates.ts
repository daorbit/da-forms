
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

/**
 * Which illustrated header a message carries.
 *
 * Two, because there are only two audiences: the person who filled the form in
 * and the person who owns it. Deliberately wordless about the product — these
 * go out under someone else's name, so the art says "a form was submitted" and
 * nothing about who built the form service.
 */
export type BannerName = 'submission-received' | 'new-submission';

export function bannerCid(name: BannerName): string {
  return `forms-banner-${name}`;
}

/**
 * The banner as markup, referenced by cid.
 *
 * A CID attachment rather than a hosted URL: Gmail strips `data:` URIs out of
 * `<img src>`, and a remote image is blocked until the reader allows it — which
 * for the element that sets the tone of the whole message means most people see
 * a grey box. The caller has to put the matching part on the message; see
 * `bannerAttachment` in the mailer-side helper.
 */
function bannerImg(name: BannerName, src?: string): string {
  // `src` is the composer's escape hatch: a browser cannot resolve a cid, so
  // the preview passes an http URL for the same file and a real send leaves it
  // unset to keep the attachment reference.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 ${S.section}px">
    <tr><td style="font-size:0;line-height:0">
      <img src="${src ? escapeAttr(src) : `cid:${bannerCid(name)}`}" width="600" alt=""
        style="display:block;border:0;outline:none;text-decoration:none;width:100%;max-width:600px;height:auto;border-radius:10px">
    </td></tr>
  </table>`;
}


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


/**
 * A very pale version of the accent, for the wash behind the header.
 *
 * Mixed towards white in sRGB rather than taken from a fixed palette, because
 * the accent is whatever colour the form owner picked — there is no set of
 * hand-tuned tints to look one up in. `amount` is how much of the accent
 * survives; at 0.06 even a saturated red lands as a blush rather than a colour
 * in its own right, which is the point: the wash should read as warmth on the
 * page, not as a second brand colour competing with the banner.
 *
 * Returns null for anything that is not a plain 3- or 6-digit hex, so a stored
 * `rgb()` or a named colour falls back to no gradient instead of emitting
 * broken CSS into a mail client.
 */
function tintOf(hex: string, amount = 0.06): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;

  const raw = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const mix = (channel: number) => Math.round(255 - (255 - channel) * amount);

  const r = mix(parseInt(raw.slice(0, 2), 16));
  const g = mix(parseInt(raw.slice(2, 4), 16));
  const b = mix(parseInt(raw.slice(4, 6), 16));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function shell(
  formName: string,
  inner: string,
  accent: string,
  brand: { name: string; logoUrl?: string },
  /** Caption under the message. Absent for workspaces whose plan removed it. */
  poweredBy?: string,
  /** The illustrated header, when the message has one. */
  banner?: BannerName,
  /** An http source for that header, for a preview rendered in a browser. */
  bannerUrl?: string
): string {
  const footer = poweredBy
    ? `<p style="margin:${S.section}px 0 0;font-size:11.5px;line-height:1.5;color:${C.faint}">${escapeHtml(poweredBy)}</p>`
    : '';


  const divider = banner
    ? bannerImg(banner, bannerUrl)
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 ${S.section}px">
        <tr>
          <td width="36" style="height:2px;background:${accent};border-radius:2px;font-size:0;line-height:0">&nbsp;</td>
          <td style="height:1px;background:${C.line};font-size:0;line-height:0">&nbsp;</td>
        </tr>
      </table>`;

  // A wash behind the header, fading out by the time the message starts.
  //
  // `background-color` is set first as the fallback: Outlook's Word engine
  // drops `background-image` entirely, and a gradient with nothing flat behind
  // it would fail to the client's own white. The stop is in pixels rather than
  // a percentage so the fade ends at the same place whether the message is four
  // lines or forty.
  const wash = tintOf(accent);
  const page = wash
    ? `background-color:${wash};background-image:linear-gradient(180deg,${wash} 0%,${C.card} 260px)`
    : `background:${C.card}`;

  return `<div style="${page};padding:28px 16px;font-family:${FONT}">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto">
    <tr><td style="padding:0">

      ${brandRow(brand, accent)}

      ${divider}

      ${inner}

      <div style="margin-top:${S.major}px;padding-top:${S.block}px;border-top:1px solid ${C.line}">
        <p style="margin:0;font-size:12px;line-height:1.55;color:${C.faint}">
          Sent from <span style="color:${C.dim};font-weight:600">${escapeHtml(formName)}</span>
        </p>
        ${footer}
      </div>
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
    <td style="padding:10px 18px 10px 0;vertical-align:top;font-size:12.5px;line-height:1.5;color:${C.faint};white-space:nowrap">${escapeHtml(label)}</td>
    <td style="padding:10px 0;vertical-align:top;font-size:14.5px;line-height:1.55;color:${C.text};text-align:right">${escapeHtml(value).replace(/\n/g, '<br>')}</td>
  </tr>${last ? '' : `<tr><td colspan="2" style="padding:0"><div style="height:1px;background:${C.lineSoft}"></div></td></tr>`}`;
}


export function answersPanel(answers: { label: string; value: string }[]): string {
  if (answers.length === 0) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${S.section}px 0 0">
    <tr><td colspan="2" style="padding:0 0 ${S.tight}px">
      <p style="margin:0;font-size:10.5px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${C.faint}">What you sent</p>
    </td></tr>
    <tr><td colspan="2" style="padding:0"><div style="height:1px;background:${C.line}"></div></td></tr>
    ${answers.map((a, i) => answerRow(a.label, a.value, i === answers.length - 1)).join('')}
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
  /**
   * The illustrated header this message carries.
   *
   * Set by the sender, not by the layout: which banner belongs on a message is
   * a question about who is reading it — the respondent or the form's owner —
   * and the layout only decides what sits under it.
   */
  banner?: BannerName;
  /**
   * Where to load the banner from instead of the cid reference.
   *
   * Only the composer sets this. A delivered message must keep the cid, so
   * that the image resolves against its own attachment rather than a request
   * the reader's mail client may refuse to make.
   */
  bannerUrl?: string;
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
  banner,
  bannerUrl,
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

  return shell(formName, parts.join(''), tone, brand ?? { name: formName }, poweredBy, banner, bannerUrl);
}
