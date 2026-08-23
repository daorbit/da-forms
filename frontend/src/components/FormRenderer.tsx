import { useState } from 'react';
import { Paper, Title, Text, Button, Stack, SimpleGrid } from '@mantine/core';
import type { FormField, LabelPlacement, SubmitButtonSize, SubmitButtonWidth, FormTheme } from '@/types';
import { FieldControl } from '@/components/FieldControl';
import { valueFields } from '@/lib/fieldTree';
import { resolveTextColor } from '@/lib/formTheme';
import { isFieldVisible } from '@/utils/conditionalLogic';

interface Props {
  title: string;
  description?: string;
  fields: FormField[];
  hideHeader?: boolean;
  labelPlacement?: LabelPlacement;
  submitLabel?: string;
  submitButtonSize?: SubmitButtonSize;
  submitButtonWidth?: SubmitButtonWidth;
  theme?: FormTheme;
  submitting?: boolean;
  /** Omitted in preview, where nothing is recorded and there is no spam to guard against. */
  onSubmit?: (values: Record<string, string>) => void;
}

const buttonSize: Record<SubmitButtonSize, string> = {
  small: 'xs',
  medium: 'sm',
  large: 'md',
};

function initialValues(fields: FormField[]) {
  const values: Record<string, string> = {};
  // Walks into grids: a prefilled field inside a column is still prefilled.
  for (const field of valueFields(fields)) {
    if (field.initialValue) values[field.id] = field.initialValue;
  }
  return values;
}


/**
 * The respondent-facing form. Shared by the public page and the builder's
 * preview so the two can never drift apart.
 */
export function FormRenderer({
  title,
  description,
  fields,
  hideHeader,
  labelPlacement,
  submitLabel,
  submitButtonSize,
  submitButtonWidth,
  theme,
  submitting,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields));
  const [honeypot, setHoneypot] = useState('');
  const textColor = resolveTextColor(theme);
  const accent = theme?.accentColor;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Drop answers behind a hidden condition so a since-hidden value can't submit.
    const visibleIds = new Set(valueFields(fields).filter((f) => isFieldVisible(f, values)).map((f) => f.id));
    const submitValues: Record<string, string> = {};
    for (const [id, v] of Object.entries(values)) {
      if (visibleIds.has(id)) submitValues[id] = v;
    }
    onSubmit?.(honeypot ? { ...submitValues, _hp: honeypot } : submitValues);
  }

  /** Grids lay their columns out; everything else is a control. */
  function renderField(field: FormField): React.ReactNode {
    if (!isFieldVisible(field, values)) return null;

    if (field.type === 'grid') {
      return (
        <SimpleGrid key={field.id} cols={{ base: 1, sm: field.columns?.length ?? 1 }} spacing="md">
          {(field.columns ?? []).map((column, index) => (
            <Stack key={index} gap="md">
              {column.map(renderField)}
            </Stack>
          ))}
        </SimpleGrid>
      );
    }

    return (
      <FieldControl
        key={field.id}
        field={field}
        value={values[field.id] ?? ''}
        onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
        labelPlacement={labelPlacement}
        labelColor={theme?.labelColor ?? textColor}
        inputBg={theme?.inputBg}
        inputBorder={theme?.inputBorder}
        inputTextColor={theme?.inputTextColor}
      />
    );
  }

  return (
    <Paper
      withBorder
      radius="md"
      p="xl"
      style={{
        backgroundColor: theme?.cardBg,
        borderColor: theme?.cardBorder,
        color: textColor,
        // Lets field labels/links pick up the accent without threading a prop
        // through every FieldControl case.
        ...(accent ? ({ '--mantine-color-emerald-6': accent } as React.CSSProperties) : {}),
      }}
    >
      <form onSubmit={handleSubmit}>
        {!hideHeader && (
          <>
            <Title order={3} ta="center" mb={4} c={textColor}>
              {title || 'Untitled form'}
            </Title>
            {description && (
              <Text size="sm" ta="center" mb="lg" c={textColor ? undefined : 'dimmed'} style={textColor ? { color: textColor, opacity: 0.75 } : undefined}>
                {description}
              </Text>
            )}
          </>
        )}

        <Stack gap="md" mt="lg">
          {fields.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              This form has no fields yet.
            </Text>
          ) : (
            <>
              {fields.map(renderField)}

              {/* Invisible to a real respondent (off-screen, no tab stop) —
                  a bot's form-filler script still finds and fills it. */}
              <input
                type="text"
                name="_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />

              <Button
                type="submit"
                loading={submitting}
                mt="sm"
                size={buttonSize[submitButtonSize ?? 'medium']}
                color={accent ? undefined : 'emerald'}
                style={{
                  width: `${submitButtonWidth ?? 100}%`,
                  alignSelf: 'center',
                  backgroundColor: accent,
                }}
              >
                {submitLabel || 'Submit'}
              </Button>
            </>
          )}
        </Stack>
      </form>
    </Paper>
  );
}
