/**
 * The tags a rich text block may contain, and nothing else.
 *
 * The content is written by the form's author, but it is rendered into every
 * respondent's browser — so it is not trusted markup. Anything outside this
 * list (a `<script>`, an `<iframe>`, an `onclick`) is stripped rather than
 * passed through.
 *
 * Deliberately the same approach as the email body sanitizer in
 * `emailTemplates.ts`: an allow-list of tags, attributes dropped wholesale, and
 * links restricted to schemes that cannot execute.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'span', 'code', 'pre',
]);

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function sanitizeRichText(html: string): string {
  return html
    // Whole elements whose content is never body copy, contents included.
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, (tag) => {
      const name = /^<\/?\s*([a-z0-9]+)/i.exec(tag)?.[1]?.toLowerCase();
      if (!name || !ALLOWED_TAGS.has(name)) return '';
      if (name === 'a') {
        if (tag.startsWith('</')) return '</a>';
        // Only an http(s)/mailto target survives; `javascript:` and `data:`
        // hrefs are exactly what this is here to drop.
        const href = /href\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1] ?? '';
        if (!/^(https?:\/\/|mailto:)/i.test(href)) return '<a>';
        return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`;
      }
      // Everything else keeps the tag but loses its attributes, which is where
      // `onclick`, `style` overrides and stray classes would ride in.
      return tag.startsWith('</') ? `</${name}>` : `<${name}>`;
    });
}
