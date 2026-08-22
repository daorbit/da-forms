import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Text, Center, Loader, Stack, Button, ThemeIcon } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { getPublicForm, submitForm } from '@/lib/api';
import type { Form } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicForm(id)
      .then(setForm)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  async function handleSubmit(values: Record<string, string>) {
    if (!id) return;
    setSubmitting(true);
    await submitForm(id, values);
    setSubmitting(false);
    if (form?.redirectUrl) {
      window.location.href = form.redirectUrl;
      return;
    }
    setSubmitted(true);
  }

  if (error)
    return (
      <Center h="100vh">
        <Text c="dimmed">Form not found.</Text>
      </Center>
    );

  if (!form)
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );

  return (
    // Respondents see the form's own colours, never a host app's theme — the
    // share link and the embed are public pages, not part of anyone's dashboard.
    <Container size="sm" py="xl" className="da-forms-light-surface" data-mantine-color-scheme="light">
      {submitted ? (
        <Paper withBorder radius="md" p="xl">
          <Stack align="center" gap="md" py="xl">
            <ThemeIcon size={56} radius="xl" color="emerald" variant="light">
              <IconCircleCheck size={32} />
            </ThemeIcon>
            <Text ta="center" size="lg" fw={600}>
              {form.thankYouMessage || 'Thanks! Your response has been recorded.'}
            </Text>
            <Button color="emerald" radius="md" onClick={() => setSubmitted(false)}>
              Submit another response
            </Button>
          </Stack>
        </Paper>
      ) : (
        <FormRenderer
          title={form.title}
          description={form.description}
          fields={form.fields}
          hideHeader={form.hideHeader}
          labelPlacement={form.labelPlacement}
          submitLabel={form.submitLabel}
          submitButtonSize={form.submitButtonSize}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}
    </Container>
  );
}
