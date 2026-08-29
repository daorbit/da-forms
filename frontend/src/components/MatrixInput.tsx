import { Radio } from '@mantine/core';
import classes from './MatrixInput.module.css';

interface Props {
  rows: string[];
  options: string[];
  /** Stored as "Row: Answer | Row: Answer" so the whole grid is one value. */
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  labelColor?: string;
  inputBorder?: string;
  accentColor?: string;
}

/** Parses the stored pairs back into a lookup, ignoring anything malformed. */
function parseSelections(value: string): Map<string, string> {
  return new Map(
    value
      .split(' | ')
      .map((pair) => {
        // Split on the first separator only: an answer may itself contain ": ".
        const at = pair.indexOf(': ');
        return at === -1 ? null : ([pair.slice(0, at), pair.slice(at + 2)] as [string, string]);
      })
      .filter((entry): entry is [string, string] => entry !== null)
  );
}

export function MatrixInput({
  rows,
  options,
  value,
  onChange,
  readOnly,
  labelColor,
  inputBorder,
  accentColor,
}: Props) {
  const selections = parseSelections(value);

  function select(row: string, answer: string) {
    if (readOnly) return;
    const next = new Map(selections);
    next.set(row, answer);
    // Rebuilt in the field's own row order, so the stored value stays stable
    // regardless of the order the respondent answered in.
    onChange(
      rows
        .filter((r) => next.has(r))
        .map((r) => `${r}: ${next.get(r)}`)
        .join(' | ')
    );
  }

  return (
    <div
      className={classes.wrap}
      style={
        {
          '--matrix-border': inputBorder,
          '--matrix-label': labelColor,
        } as React.CSSProperties
      }
    >
      <table className={classes.table}>
        <thead>
          <tr className={classes.headRow}>
            <th className={classes.headCorner} />
            {options.map((option) => (
              <th key={option} scope="col" className={classes.headCell}>
                {option}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className={classes.row}>
              <th scope="row" className={classes.rowLabel} style={{ fontWeight: 400, textAlign: 'left' }}>
                {row}
              </th>
              {options.map((option) => (
                <td key={option} className={classes.optionCell}>
                  <Radio
                    checked={selections.get(row) === option}
                    onChange={() => select(row, option)}
                    disabled={readOnly}
                    color={accentColor}
                    // Each cell's control is unlabelled on screen — the header
                    // and row heading carry the meaning visually, but a screen
                    // reader needs both stated on the input itself.
                    aria-label={`${row}: ${option}`}
                    styles={inputBorder ? { radio: { borderColor: inputBorder } } : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
