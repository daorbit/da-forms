import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Title, Text, Button, Stack, Center, Loader } from '@mantine/core';
import { getForm, submitForm } from '@/lib/api';
import type { Form } from '@/types';
import { FieldControl } from '@/components/FieldControl';

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getForm(id)
      .then((loaded) => {
        setForm(loaded);
        const initial: Record<string, string> = {};
        for (const field of loaded.fields) {
          if (field.initialValue) initial[field.id] = field.initialValue;
        }
        setValues(initial);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <Paper withBorder radius="md" p="xl">
        {submitted ? (
          <Text ta="center" py="xl">
            {form.thankYouMessage || 'Thanks! Your response has been recorded.'}
          </Text>
        ) : (
          <form onSubmit={handleSubmit}>
            <Title order={3} ta="center" mb={4}>
              {form.title}
            </Title>
            {form.description && (
              <Text c="dimmed" size="sm" ta="center" mb="lg">
                {form.description}
              </Text>
            )}
            <Stack gap="md">
              {form.fields.map((field) => (
                <FieldControl
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? ''}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                />
              ))}
              <Button type="submit" loading={submitting} fullWidth mt="sm" color="emerald">
                Submit
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Container>
  );
}
