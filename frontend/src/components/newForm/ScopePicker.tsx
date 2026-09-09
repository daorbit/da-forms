import { Group, Text, UnstyledButton, useComputedColorScheme } from '@mantine/core';
import type { FormTheme } from '@/types';
import { formTemplates } from '@/lib/templates';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { useFitScale } from '@/hooks/useFitScale';
import classes from './ScopePicker.module.css';

 
const PREVIEW_WIDTH = 900;
const PREVIEW_HEIGHT = 580;

 
const PREVIEW_TEMPLATES: Record<'light' | 'dark', Record<NonNullable<FormTheme['scope']>, string>> =
  {
    light: { page: 'contact', card: 'embedContact' },
    dark: { page: 'newsletter', card: 'embedLeadCapture' },
  };

function templateById(id: string) {
  return formTemplates.find((t) => t.id === id);
}

 
function ScopePreview({ templateId, host }: { templateId: string; host?: boolean }) {
  const template = templateById(templateId);
  const { ref, scale, measured } = useFitScale({
    contentWidth: PREVIEW_WIDTH,
    contentHeight: PREVIEW_HEIGHT,
    padding: { x: 0, y: 0 },
  });

  const form = template && (
    <FormRenderer
      title={template.title}
      description={template.formDescription}
      fields={template.fields}
      theme={template.theme}
      submitLabel={template.submitLabel}
      hideHeader={template.hideHeader}
    />
  );

  return (
    <div className={classes.stage} ref={ref}>
      {template && (
        <div
          className={classes.scaler}
          style={{
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
            transform: `scale(${scale})`,
 
            visibility: measured ? 'visible' : 'hidden',
          }}
        >
          {host ? (
 
            <div className={classes.hostPage}>
              <div className={classes.hostBar}>
                <div className={classes.hostLogo} />
                <div className={classes.hostNav}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className={classes.hostBody}>
                <div className={classes.hostCopy}>
                  <div className={classes.hostHeading} />
                  <div className={classes.hostLine} />
                  <div className={classes.hostLine} />
                  <div className={classes.hostLineShort} />
                </div>
                <div className={classes.hostSlot}>
                  <FormPage theme={template.theme} minHeight="auto">
                    {form}
                  </FormPage>
                </div>
              </div>
            </div>
          ) : (
            <FormPage theme={template.theme} minHeight="100%">
              {form}
            </FormPage>
          )}
        </div>
      )}
    </div>
  );
}

const CHOICES: {
  value: NonNullable<FormTheme['scope']>;
  label: string;
  host?: boolean;
}[] = [
 
  { value: 'page', label: 'Standalone link' },
  { value: 'card', label: 'Embedded on a site', host: true },
];

interface Props {
  value: NonNullable<FormTheme['scope']>;
  onChange: (scope: NonNullable<FormTheme['scope']>) => void;
}
 
export function ScopePicker({ value, onChange }: Props) {
 
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: false });

  return (
    <Group grow align="stretch" gap="sm" wrap="nowrap">
      {CHOICES.map((choice) => (
        <UnstyledButton
          key={choice.value}
          onClick={() => onChange(choice.value)}
          className={`${classes.card} ${value === choice.value ? classes.cardActive : ''}`}
          aria-pressed={value === choice.value}
        >
          <ScopePreview
            templateId={PREVIEW_TEMPLATES[scheme][choice.value]}
            host={choice.host}
          />
          <Text fw={600} size="sm" mt={10}>
            {choice.label}
          </Text>
        </UnstyledButton>
      ))}
    </Group>
  );
}
