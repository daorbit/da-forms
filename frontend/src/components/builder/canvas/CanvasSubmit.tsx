import type { FormTheme, SubmitButtonAlign, SubmitButtonSize, SubmitButtonWidth } from '@/types';
import { buttonRadius } from '@/lib/formSkin';
import { contrastOn } from '@/lib/formTheme';
import { InlineText } from './InlineText';
import classes from './Canvas.module.css';

interface Props {
  label: string;
  onChange: (value: string) => void;
  theme?: FormTheme;
  width?: SubmitButtonWidth;
  align?: SubmitButtonAlign;
  size?: SubmitButtonSize;
}

export function CanvasSubmit({ label, onChange, theme, width, align, size }: Props) {
  const radius = buttonRadius(theme);
  const vars = {
    '--cs-accent': theme?.accentColor ?? 'var(--mantine-color-emerald-6)',
    '--cs-fg': theme?.accentColor ? contrastOn(theme.accentColor) : '#ffffff',
    '--cs-width': `${width ?? 100}%`,
    ...(radius !== undefined ? { '--cs-radius': `${radius}px` } : {}),
  } as React.CSSProperties;

  return (
    <div className={classes.submitRow} data-align={align ?? 'center'}>
      <div
        className={classes.submit}
        data-style={theme?.buttonStyle ?? 'solid'}
        data-size={size ?? 'medium'}
        style={vars}
      >
        <InlineText
          value={label}
          onChange={onChange}
          placeholder="Submit"
          ariaLabel="Submit button text"
          className={classes.submitText}
        />
      </div>
    </div>
  );
}
