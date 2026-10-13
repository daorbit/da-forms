import { useBuilderTooSmall } from '@/hooks/useBuilderTooSmall';
import { Box, Button, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { ArrowLeftIcon, MonitorIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

export function SmallScreenGate({ children }: { children: React.ReactNode }) {
  const tooSmall = useBuilderTooSmall();
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();

  if (!tooSmall) return <>{children}</>;

  return (
    <Box
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <Stack align="center" gap="md" maw={360} ta="center">
        <ThemeIcon size={56} radius="xl" variant="light">
          <MonitorIcon size={26} />
        </ThemeIcon>
        <Title order={3}>Create forms on a bigger screen</Title>
        <Text size="sm" c="dimmed">
          Picking a template and drafting with Orbit need more room than a
          phone has. You can still edit, preview and publish your forms here.
        </Text>
        <Button
          leftSection={<ArrowLeftIcon size={15} />}
          onClick={() => navigate(`/${workspaceId}/forms`)}
        >
          Back to forms
        </Button>
      </Stack>
    </Box>
  );
}
