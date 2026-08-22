import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Text, Center, Loader, Stack, Button, ThemeIcon } from '@mantine/core';
import { IconCheck, IconClockPause } from '@tabler/icons-react';
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
    try {
      await submitForm(id, values);
    } catch {
      setSubmitting(false);
      // The form was unpublished after this page loaded — refetch so the
      // "not accepting responses" screen takes over instead of a dead end.
      getPublicForm(id).then(setForm);
      return;
    }
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

  if (form.status !== 'published')
    return (
      <Center h="100vh" className="da-forms-light-surface" data-mantine-color-scheme="light" style={{ background: '#fff' }}>
        <Container size="xs" px="md" style={{ width: '100%', textAlign: 'center' }}>
          <Center>
            <ThemeIcon size={64} radius="xl" color="gray" variant="light">
              <IconClockPause size={30} stroke={1.8} />
            </ThemeIcon>
          </Center>
          <Text ta="center" size="28px" fw={800} mt="xl" style={{ lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            This form isn't accepting responses yet
          </Text>
          <Text size="sm" c="dimmed" mt="md">
            The owner hasn't published it. Check back later or contact whoever shared this link.
          </Text>
        </Container>
      </Center>
    );

  if (submitted)
    return (
      // Respondents see the form's own colours, never a host app's theme — the
      // share link and the embed are public pages, not part of anyone's dashboard.
      <Center h="100vh" className="da-forms-light-surface" data-mantine-color-scheme="light" style={{ background: '#fff' }}>
        <Container size="xs" px="md" style={{ width: '100%', textAlign: 'center' }}>
          <Center>
            <ThemeIcon size={64} radius="xl" color="emerald" variant="light">
              <IconCheck size={30} stroke={3} />
            </ThemeIcon>
          </Center>
          <Text ta="center" size="34px" fw={800} mt="xl" style={{ lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {form.thankYouMessage || 'Thanks — that reached us.'}
          </Text>
          <Stack align="center" gap={2} mt="md">
            <Text size="sm" c="dimmed">
              Your response has been recorded.
            </Text>
            <Text size="sm" c="dimmed">
              You can safely close this page now.
            </Text>
          </Stack>
          <Button color="emerald" radius="md" mt="xl" onClick={() => setSubmitted(false)}>
            Submit another response
          </Button>
        </Container>
      </Center>
    );

  return (
    <Container size="sm" py="xl" className="da-forms-light-surface" data-mantine-color-scheme="light">
      <FormRenderer
        title={form.title}
        description={form.description}
        fields={form.fields}
        hideHeader={form.hideHeader}
        labelPlacement={form.labelPlacement}
        submitLabel={form.submitLabel}
        submitButtonSize={form.submitButtonSize}
        submitButtonColor={form.submitButtonColor}
        submitButtonWidth={form.submitButtonWidth}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Container>
  );
}
