import { Button } from '@mantine/core';
import { LayoutTemplateIcon, PaletteIcon } from 'lucide-react';
import type { FormTemplate } from '@/lib/templates';
import type { SwitchMode, TemplateDiff } from '@/lib/templateSwitch';
import { StudioPanel } from '@/components/studio/StudioPanel';
import { DocsLink } from '@/components/ui/DocsLink';
import { DOCS } from '@/lib/docs';
import { ModeOption } from './ModeOption';
import { ChangeSummary } from './ChangeSummary';
import classes from './templateSwitch.module.css';

interface Props {
  template: FormTemplate;
  diff: TemplateDiff;
  mode: SwitchMode;
  onModeChange: (mode: SwitchMode) => void;
  keepExtra: boolean;
  onKeepExtraChange: (value: boolean) => void;
  onApply: () => void;
}

export function SwitchPanel({ template, diff, mode, onModeChange, keepExtra, onKeepExtraChange, onApply }: Props) {
  return (
    <StudioPanel
      title={template.name}
      subtitle={template.description}
      footer={
        <div className={classes.footer}>
          <Button fullWidth radius="xl" size="md" onClick={onApply}>
            {mode === 'design' ? 'Apply design' : 'Switch template'}
          </Button>
          <span className={classes.footerHint}>Undo any time with Ctrl+Z</span>
          <DocsLink path={DOCS.switchTemplate} label="How switching works" />
        </div>
      }
    >
      <p className={classes.sectionLabel}>What to use</p>
      <div className={classes.modes} role="radiogroup" aria-label="What to use from the template">
        <ModeOption
          icon={<PaletteIcon size={16} />}
          title="Design only"
          body={
            diff.empty
              ? 'Your form has no fields yet, so there is nothing to keep.'
              : 'Colours, fonts and background. Your fields, wording and settings stay exactly as they are.'
          }
          selected={mode === 'design'}
          disabled={diff.empty}
          onSelect={() => onModeChange('design')}
        />
        <ModeOption
          icon={<LayoutTemplateIcon size={16} />}
          title="Design and fields"
          body={
            diff.same
              ? 'Your fields already match, so only the wording and design change.'
              : 'Use the template’s questions too. Fields that match keep their answers.'
          }
          selected={mode === 'full'}
          onSelect={() => onModeChange('full')}
        />
      </div>

      {mode === 'full' ? (
        <ChangeSummary diff={diff} keepExtra={keepExtra} onKeepExtraChange={onKeepExtraChange} />
      ) : (
        <p className={classes.note}>Logic, notifications, payments and every other setting are untouched.</p>
      )}
    </StudioPanel>
  );
}
