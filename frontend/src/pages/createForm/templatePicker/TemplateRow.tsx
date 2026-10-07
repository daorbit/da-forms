import { Text, UnstyledButton } from '@mantine/core';
import type { FormTemplate } from '@/lib/templates';
import { TemplateSwatch } from './TemplateSwatch';
import { templateMetaLine } from './templateMeta';
import classes from './TemplatePicker.module.css';

interface Props {
  template: FormTemplate;
  active: boolean;
  onSelect: (id: string) => void;
}

export function TemplateRow({ template, active, onSelect }: Props) {
  return (
    <UnstyledButton
      className={classes.row}
      data-active={active || undefined}
      aria-pressed={active}
      onClick={() => onSelect(template.id)}
    >
      <TemplateSwatch template={template} />
      <span className={classes.rowBody}>
        <Text size="sm" fw={600} truncate>
          {template.name}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {template.description}
        </Text>
        <span className={classes.rowMeta}>
          {templateMetaLine(template).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </span>
      </span>
    </UnstyledButton>
  );
}
