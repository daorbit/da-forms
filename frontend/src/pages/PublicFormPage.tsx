import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Text, Center, Loader } from '@mantine/core';
import { getForm, submitForm } from '@/lib/api';
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
    getForm(id)
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
    <Container size="sm" py="xl">
      {submitted ? (
        <Paper withBorder radius="md" p="xl">
          <Text ta="center" py="xl">
            {form.thankYouMessage || 'Thanks! Your response has been recorded.'}
          </Text>
        </Paper>
      ) : (
        <FormRenderer
          title={form.title}
          description={form.description}
          fields={form.fields}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}
    </Container>
  );
}
