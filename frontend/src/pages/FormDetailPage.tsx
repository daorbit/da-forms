import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Title,
  Badge,
  Button,
  Group,
  TextInput,
  Textarea,
  Card,
  Stack,
  Text,
  CopyButton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { getForm, listSubmissions, updateForm } from '@/lib/api';
import type { Form, Submission } from '@/types';

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="sm" fw={500} mb={4}>
        {label}
      </Text>
      <Group gap="xs" wrap="nowrap">
        <TextInput readOnly value={value} style={{ flex: 1 }} onFocus={(e) => e.target.select()} />
        <CopyButton value={value}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy'}>
              <ActionIcon variant="light" onClick={copy} color={copied ? 'teal' : 'blue'}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </div>
  );
}

export function FormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!id) return;
    getForm(id).then(setForm);
    listSubmissions(id).then(setSubmissions);
  }, [id]);

  if (!form || !id) return null;

  const shareUrl = `${window.location.origin}/f/${id}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  async function publish() {
    const updated = await updateForm(id!, { status: 'published' });
    setForm(updated);
  }

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{form.title}</Title>
          <Badge color={form.status === 'published' ? 'green' : 'gray'} variant="light" mt={4}>
            {form.status}
          </Badge>
        </div>
        <Group gap="xs">
          <Button component={Link} to={`/forms/${id}/edit`} variant="default" radius="md">
            Edit
          </Button>
          {form.status === 'draft' && (
            <Button color="teal" radius="md" onClick={publish}>
              Publish
            </Button>
          )}
        </Group>
      </Group>

      <Stack gap="md">
        <Card withBorder radius="md" padding="md">
          <CopyField label="Share link" value={shareUrl} />
        </Card>

        <Card withBorder radius="md" padding="md">
          <Text size="sm" fw={500} mb={4}>
            Embed code
          </Text>
          <Textarea readOnly value={embedCode} autosize minRows={2} onFocus={(e) => e.target.select()} />
        </Card>

        <Card withBorder radius="md" padding="md">
          <Text size="sm" fw={500} mb="sm">
            Submissions ({submissions.length})
          </Text>
          <Stack gap="xs">
            {submissions.map((s) => (
              <Text key={s._id} size="sm" c="dimmed">
                {JSON.stringify(s.data)}
              </Text>
            ))}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
