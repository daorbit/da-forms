 

/**
 * The arithmetic behind a calculated field.
 *
 * A copy of the backend's `lib/formula.ts`, kept in step by hand. The two
 * deployments share no build, and this is small, pure and finished — a package
 * that has to be published to fix a typo would cost more than the duplication.
 *
 * What this copy produces is only ever *shown*. The stored value is recomputed
 * server-side on submit, so the two disagreeing is a cosmetic bug rather than a
 * respondent naming their own total — which is why the browser is allowed a
 * copy of this at all.
 *
 * A hand-written parser rather than `eval` or `new Function`, for the same
 * reason it is one on the server: the grammar is numbers, `{{Field Label}}`
 * references, `+ - * / %` and parentheses, and nothing outside that can be
 * expressed, let alone executed.
 */

/** A token in the expression. */
type Token =
  | { kind: 'number'; value: number }
  | { kind: 'ref'; label: string }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '%' }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

export type FormulaResult =
  | { ok: true; value: number }
  /** The expression itself is wrong — reported to the author, not the respondent. */
  | { ok: false; reason: string };

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }

    // `{{Some Label}}` — the same placeholder syntax the email composer uses,
    // so an author who has written one has already written the other.
    if (ch === '{' && input[i + 1] === '{') {
      const end = input.indexOf('}}', i + 2);
      if (end === -1) return null;
      const label = input.slice(i + 2, end).trim();
      if (!label) return null;
      tokens.push({ kind: 'ref', label });
      i = end + 2;
      continue;
    }

    if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < input.length && ((input[j] >= '0' && input[j] <= '9') || input[j] === '.')) j++;
      const value = Number(input.slice(i, j));
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: 'number', value });
      i = j;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%') {
      tokens.push({ kind: 'op', value: ch });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i++;
      continue;
    }

    // Anything else — a letter, a quote, a semicolon — is not part of the
    // grammar and ends the parse rather than being skipped.
    return null;
  }

  return tokens;
}

/**
 * Recursive descent over the token list.
 *
 * Precedence is expressed by the call chain: `expr` handles + and -, and defers
 * to `term` for * / %, which defers to `factor` for literals, references,
 * unary minus and parentheses.
 */
function parse(tokens: Token[], values: Map<string, number>): FormulaResult {
  let pos = 0;

  const peek = () => tokens[pos];

  function factor(): FormulaResult {
    const token = peek();
    if (!token) return { ok: false, reason: 'unexpected end of formula' };

    if (token.kind === 'op' && token.value === '-') {
      pos++;
      const inner = factor();
      return inner.ok ? { ok: true, value: -inner.value } : inner;
    }

    if (token.kind === 'number') {
      pos++;
      return { ok: true, value: token.value };
    }

    if (token.kind === 'ref') {
      pos++;
      // An unanswered or non-numeric field counts as zero rather than failing:
      // a running total on a half-filled form should show the total so far, not
      // an error where a number belongs.
      return { ok: true, value: values.get(token.label) ?? 0 };
    }

    if (token.kind === 'lparen') {
      pos++;
      const inner = expr();
      if (!inner.ok) return inner;
      if (peek()?.kind !== 'rparen') return { ok: false, reason: 'missing closing bracket' };
      pos++;
      return inner;
    }

    return { ok: false, reason: 'unexpected symbol in formula' };
  }

  function term(): FormulaResult {
    let left = factor();
    if (!left.ok) return left;

    for (;;) {
      const token = peek();
      if (token?.kind !== 'op' || (token.value !== '*' && token.value !== '/' && token.value !== '%')) {
        return left;
      }
      pos++;
      const right = factor();
      if (!right.ok) return right;

      // Division by zero yields zero rather than Infinity or NaN: those reach
      // the respondent as "Infinity" in a price box, which is worse than a
      // wrong-looking zero the author can see and fix.
      if ((token.value === '/' || token.value === '%') && right.value === 0) {
        left = { ok: true, value: 0 };
        continue;
      }

      left = {
        ok: true,
        value:
          token.value === '*'
            ? left.value * right.value
            : token.value === '/'
              ? left.value / right.value
              : left.value % right.value,
      };
    }
  }

  function expr(): FormulaResult {
    let left = term();
    if (!left.ok) return left;

    for (;;) {
      const token = peek();
      if (token?.kind !== 'op' || (token.value !== '+' && token.value !== '-')) return left;
      pos++;
      const right = term();
      if (!right.ok) return right;
      left = {
        ok: true,
        value: token.value === '+' ? left.value + right.value : left.value - right.value,
      };
    }
  }

  const result = expr();
  if (!result.ok) return result;
  // Trailing tokens mean the expression ended early — "2 + 3 4" parses "2 + 3"
  // and would otherwise silently ignore the rest.
  if (pos !== tokens.length) return { ok: false, reason: 'unexpected symbol in formula' };
  return result;
}

/**
 * Evaluate one formula against a set of answers.
 *
 * `values` is keyed by field *label*, matching how the formula is written —
 * the author types the question's name, not its internal id.
 */
export function evaluateFormula(
  formula: string,
  values: Map<string, number>
): FormulaResult {
  // A bound on the input, so a pathological expression cannot occupy the parser
  // for long. Formulas are short by nature; anything past this is not one.
  if (formula.length > 500) return { ok: false, reason: 'formula is too long' };

  const tokens = tokenize(formula);
  if (!tokens) return { ok: false, reason: 'formula contains something unrecognised' };
  if (!tokens.length) return { ok: false, reason: 'formula is empty' };

  const result = parse(tokens, values);
  if (!result.ok) return result;
  if (!Number.isFinite(result.value)) return { ok: false, reason: 'formula did not produce a number' };
  return result;
}

/**
 * The numeric value of each answer, keyed by the field's label.
 *
 * Currency and formatted numbers arrive as strings with symbols and separators
 * in them, so the digits are extracted rather than `Number()` being trusted
 * with "₹1,200.00". A field with nothing numeric in it is omitted, and reads as
 * zero when referenced.
 */
export function numericValues(
  fields: { id: string; label: string; type: string; options?: string[] }[],
  data: Record<string, string>,
  /** Per-option scores, keyed by field id then option text. Used by quiz scoring. */
  optionValues?: Record<string, Record<string, number>>
): Map<string, number> {
  const values = new Map<string, number>();

  for (const field of fields) {
    const label = field.label?.trim();
    if (!label) continue;
    const raw = data[field.id];
    if (raw === undefined || raw === null || raw === '') continue;

    // A choice field is worth what the author said its chosen option is worth —
    // this is what lets "Large" mean 500 in a price formula.
    const perOption = optionValues?.[field.id];
    if (perOption) {
      // Checkboxes submit several options joined by commas; each contributes.
      const chosen = String(raw).split(',').map((s) => s.trim());
      const sum = chosen.reduce((total, option) => total + (perOption[option] ?? 0), 0);
      values.set(label, sum);
      continue;
    }

    const digits = String(raw).replace(/[^0-9.-]/g, '');
    const parsed = Number(digits);
    if (Number.isFinite(parsed)) values.set(label, parsed);
  }

  return values;
}
