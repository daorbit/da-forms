import { useMediaQuery } from '@mantine/hooks';
import { Box, Button, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconDeviceDesktop, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

/**
 * The form editor is a drag-and-drop canvas with a palette, a properties panel
 * and an aside rail — three columns that do not fold down to a usable phone
 * layout. Rather than ship a broken editor on small screens, this stands in
 * front of it: everything else in the app (the form list, entries, the public
 * form) works on mobile, only the builder asks for a bigger screen.
 *
 * The cut-off is 900px so a portrait tablet still gets the editor; anything
 * narrower gets the message.
 */
export function SmallScreenGate({ children }: { children: React.ReactNode }) {
  const tooSmall = useMediaQuery('(max-width: 900px)');
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();

  // `useMediaQuery` returns undefined on the first render before it has
  // measured — treat that as "not small" so the editor is not flashed away on
  // a desktop.
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
          <IconDeviceDesktop size={26} />
        </ThemeIcon>
        <Title order={3}>Open the editor on a bigger screen</Title>
        <Text size="sm" c="dimmed">
          Building a form needs the drag-and-drop canvas and its side panels,
          which don't fit a phone. Everything else — your forms, their entries,
          sharing — works fine here.
        </Text>
        <Button
          leftSection={<IconArrowLeft size={15} />}
          onClick={() => navigate(`/${workspaceId}/forms`)}
        >
          Back to forms
        </Button>
      </Stack>
    </Box>
  );
}
