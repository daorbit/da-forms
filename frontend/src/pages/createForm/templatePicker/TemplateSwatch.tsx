import type { FormTemplate } from '@/lib/templates';
import { templateScope } from '@/lib/templates/search';
import { swatchVars } from './templateMeta';
import classes from './TemplatePicker.module.css';

export function TemplateSwatch({ template }: { template: FormTemplate }) {
  return (
    <span
      className={classes.swatch}
      style={swatchVars(template)}
      data-embedded={templateScope(template) === 'card' || undefined}
      aria-hidden
    >
      <span className={classes.swatchCard}>
        <span className={classes.swatchTitle} />
        <span className={classes.swatchInput} />
        <span className={classes.swatchInput} />
        <span className={classes.swatchButton} />
      </span>
    </span>
  );
}
