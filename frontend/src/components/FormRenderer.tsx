import { useState } from 'react';
import { Paper, Title, Text, Button, Stack } from '@mantine/core';
import type { FormField } from '@/types';
import { FieldControl } from '@/components/FieldControl';

interface Props {
  title: string;
  description?: string;
  fields: FormField[];
  hideHeader?: boolean;
  submitting?: boolean;
  /** Omitted in preview, where nothing is recorded. */
  onSubmit?: (values: Record<string, string>) => void;
}

function initialValues(fields: FormField[]) {
  const values: Record<string, string> = {};
  for (const field of fields) {
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
  submitting,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(values);
  }

  return (
    <Paper withBorder radius="md" p="xl">
      <form onSubmit={handleSubmit}>
        {!hideHeader && (
          <>
            <Title order={3} ta="center" mb={4}>
              {title || 'Untitled form'}
            </Title>
            {description && (
              <Text c="dimmed" size="sm" ta="center" mb="lg">
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
              {fields.map((field) => (
                <FieldControl
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? ''}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                />
              ))}
              <Button type="submit" loading={submitting} fullWidth mt="sm">
                Submit
              </Button>
            </>
          )}
        </Stack>
      </form>
    </Paper>
  );
}
