import type { CSSProperties } from 'react';
import { Text, UnstyledButton } from '@mantine/core';
import { CheckIcon } from 'lucide-react';
import type { FormField } from '@/types';
import classes from './ChoiceCards.module.css';

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  multiple: boolean;
  readOnly?: boolean;
  label?: string;
  labelColor?: string;
  accentColor?: string;
  inputBg?: string;
  inputBorder?: string;
  inputTextColor?: string;
  error?: string;
}

function columnsFor(field: FormField, hasImages: boolean): number {
  if (field.cardColumns) return field.cardColumns;
  return hasImages ? 2 : 1;
}

export function ChoiceCards({
  field,
  value,
  onChange,
  multiple,
  readOnly,
  label,
  labelColor,
  accentColor,
  inputBg,
  inputBorder,
  inputTextColor,
  error,
}: Props) {
  const options = field.options ?? [];
  const selected = multiple ? (value ? value.split(', ') : []) : [value];
  const hasImages = options.some((opt) => field.optionImages?.[opt]);
  const vars = {
    '--choice-columns': columnsFor(field, hasImages),
    ...(accentColor ? { '--choice-accent': accentColor } : {}),
    ...(inputBg ? { '--choice-bg': inputBg } : {}),
    ...(inputBorder ? { '--choice-border': inputBorder } : {}),
    ...(inputTextColor ? { '--choice-text': inputTextColor } : {}),
  } as CSSProperties;

  const pick = (opt: string) => {
    if (readOnly) return;
    if (!multiple) return onChange(opt);
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next.join(', '));
  };

  return (
    <div className={classes.root} style={vars}>
      {label && (
        <Text size="sm" fw={500} mb={8} c={labelColor}>
          {label}
          {field.required && <span className={classes.required}> *</span>}
        </Text>
      )}
      <div className={classes.grid} role={multiple ? 'group' : 'radiogroup'} aria-label={label || field.label}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          const image = field.optionImages?.[opt];
          const badge = field.optionBadges?.[opt];
          const hint = field.optionHints?.[opt];
          return (
            <UnstyledButton
              key={opt}
              type="button"
              className={classes.card}
              data-selected={on || undefined}
              data-has-image={image ? true : undefined}
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={on}
              onClick={() => pick(opt)}
            >
              {badge && <span className={classes.badge}>{badge}</span>}
              {image && <img src={image} alt="" className={classes.image} loading="lazy" />}
              <span className={classes.body}>
                <span className={classes.text}>
                  <span className={classes.label}>{opt}</span>
                  {hint && <span className={classes.hint}>{hint}</span>}
                </span>
                <span className={classes.mark} data-multiple={multiple || undefined} aria-hidden>
                  {on && <CheckIcon size={13} strokeWidth={3} />}
                </span>
              </span>
            </UnstyledButton>
          );
        })}
      </div>
      {error && (
        <Text size="xs" c="red" mt={6}>
          {error}
        </Text>
      )}
    </div>
  );
}
