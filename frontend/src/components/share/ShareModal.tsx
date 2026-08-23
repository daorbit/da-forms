import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Group,
  Box,
  Text,
  Button,
  ActionIcon,
  Divider,
  CopyButton,
  Textarea,
  NumberInput,
  Switch,
  Paper,
  Stack,
} from '@mantine/core';
import {
  IconX,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconLink,
  IconCode,
  IconDeviceDesktop,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { updateForm, publicFormUrl } from '@/lib/api';
import type { Form } from '@/types';
import classes from './ShareModal.module.css';

type TabId = 'link' | 'embed';

const TABS: { id: TabId; label: string; icon: typeof IconLink; color: string }[] = [
  { id: 'link', label: 'Public link', icon: IconLink, color: '#0ca678' },
  { id: 'embed', label: 'Embed', icon: IconCode, color: '#7048e8' },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  form: Form;
  onStatusChange?: (status: Form['status']) => void;
}

export function ShareModal({ opened, onClose, form, onStatusChange }: Props) {
  const [tab, setTab] = useState<TabId>('link');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [published, setPublished] = useState(form.status === 'published');
  const [height, setHeight] = useState<number | string>(600);

  const shareUrl = publicFormUrl(form._id);

  // A unique id per copy of the snippet — if someone embeds the same form
  // twice on one page, each iframe still resizes independently.
  const frameId = useMemo(() => `da-form-${form._id}`, [form._id]);

  const embedCode = useMemo(
    () =>
      `<iframe\n  id="${frameId}"\n  src="${shareUrl}"\n  width="100%"\n  height="${height}"\n  frameborder="0"\n  style="border:0;max-width:100%"\n></iframe>\n<script>\n  window.addEventListener('message', function (e) {\n    if (e.data && e.data.type === 'da-forms:height') {\n      var frame = document.getElementById('${frameId}');\n      if (frame) frame.style.height = e.data.height + 'px';\n    }\n  });\n</script>`,
    [shareUrl, height, frameId]
  );

  // Reset when it closes, so reopening starts on the tab people expect.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !opened) {
      setTab('link');
      setDevice('desktop');
    }
    wasOpen.current = opened;
  }, [opened]);

  useEffect(() => {
    setPublished(form.status === 'published');
  }, [form.status]);

  async function togglePublished(next: boolean) {
    setPublished(next);
    const updated = await updateForm(form._id, { status: next ? 'published' : 'draft' });
    onStatusChange?.(updated.status);
    notifications.show({
      message: next ? 'Form is now public' : 'Form unpublished',
      color: next ? 'emerald' : 'gray',
    });
  }

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 150 }}
      styles={{
        content: { display: 'flex', flexDirection: 'column', border: 'none' },
        body: { flex: 1, minHeight: 0, overflow: 'hidden' },
      }}
    >
      <Group h="100%" gap={0} align="stretch" wrap="nowrap" className={classes.shell}>
        {/* ---- Panel ---- */}
        <Box className={classes.panel}>
          <Group gap="sm" px={20} py="md" wrap="nowrap" className={classes.panelHeader}>
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
              <IconX size={18} />
            </ActionIcon>
            <Divider orientation="vertical" my={6} />
            <Text fw={600}>Share "{form.title}"</Text>
          </Group>

          <Group gap={0} wrap="nowrap" className={classes.tabs}>
            {TABS.map((item) => {
              const on = item.id === tab;
              return (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={on}
                  className={classes.tab}
                  style={{
                    color: on ? item.color : 'var(--mantine-color-dimmed)',
                    borderBottomColor: on ? item.color : 'transparent',
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </Box>
              );
            })}
          </Group>

          <Box className={classes.panelBody}>
            {!published && (
              <Paper withBorder radius="md" p="sm" mb="lg" bg="var(--mantine-color-yellow-0)">
                <Text size="sm">
                  This form is a draft. Turn on <strong>Share publicly</strong> below before sending
                  the link out.
                </Text>
              </Paper>
            )}

            <Group justify="space-between" align="center" mb="lg" wrap="nowrap">
              <div>
                <Text size="sm" fw={600}>
                  Share publicly
                </Text>
                <Text size="xs" c="dimmed">
                  Anyone with the link can open and submit this form.
                </Text>
              </div>
              <Switch
                checked={published}
                onChange={(e) => togglePublished(e.target.checked)}
                color="emerald"
                size="md"
              />
            </Group>

            <Divider mb="lg" />

            {tab === 'link' && (
              <Stack gap="sm">
                <Text size="sm" fw={600}>
                  Form link
                </Text>
                <Box className={classes.codeBox}>
                  <Text size="sm" className={classes.mono}>
                    {shareUrl}
                  </Text>
                </Box>
                <Group gap="sm">
                  <CopyButton value={shareUrl}>
                    {({ copied, copy }) => (
                      <Button
                        variant={copied ? 'light' : 'filled'}
                        color={copied ? 'emerald' : 'emerald'}
                        onClick={copy}
                        leftSection={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                      >
                        {copied ? 'Copied' : 'Copy link'}
                      </Button>
                    )}
                  </CopyButton>
                  <Button
                    variant="default"
                    leftSection={<IconExternalLink size={15} />}
                    onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Open form
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">
                  Append query parameters to prefill fields, e.g. <code>?{form.fields[0]?.id ?? 'fieldId'}=value</code>.
                </Text>
              </Stack>
            )}

            {tab === 'embed' && (
              <Stack gap="sm">
                <Group justify="space-between" align="flex-end">
                  <Text size="sm" fw={600}>
                    Embed code
                  </Text>
                  <NumberInput
                    label="Height (px)"
                    size="xs"
                    w={120}
                    value={height}
                    onChange={(value) => setHeight(value === '' ? 600 : value)}
                  />
                </Group>
                <Textarea
                  readOnly
                  value={embedCode}
                  autosize
                  minRows={6}
                  onFocus={(e) => e.target.select()}
                  classNames={{ input: classes.mono }}
                />
                <CopyButton value={embedCode}>
                  {({ copied, copy }) => (
                    <Button
                      variant={copied ? 'light' : 'filled'}
                      color="emerald"
                      onClick={copy}
                      leftSection={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                    >
                      {copied ? 'Copied' : 'Copy embed code'}
                    </Button>
                  )}
                </CopyButton>
                <Text size="xs" c="dimmed">
                  Paste this into any page of your site. The iframe scales to its container width.
                </Text>
              </Stack>
            )}

          </Box>

          <Group justify="space-between" px={20} py="md" wrap="nowrap" className={classes.actionBar}>
            <CopyButton value={shareUrl}>
              {({ copied, copy }) => (
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={copy}
                  leftSection={copied ? <IconCheck size={15} /> : <IconLink size={15} />}
                >
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              )}
            </CopyButton>
            <Button variant="default" onClick={onClose}>
              Done
            </Button>
          </Group>
        </Box>

        {/* ---- Preview ---- */}
        <Box className={classes.preview}>
          <Group justify="space-between" align="center" mb="xl" wrap="nowrap">
            <Text fw={700} size="lg">
              Preview
            </Text>
            <Group gap={4} p={4} className={classes.deviceToggle}>
              {(
                [
                  { id: 'desktop' as const, Icon: IconDeviceDesktop },
                  { id: 'mobile' as const, Icon: IconDeviceMobile },
                ]
              ).map(({ id, Icon }) => (
                <ActionIcon
                  key={id}
                  variant={device === id ? 'white' : 'subtle'}
                  color={device === id ? 'dark' : 'gray'}
                  size="lg"
                  radius="sm"
                  onClick={() => setDevice(id)}
                  aria-label={id}
                  aria-pressed={device === id}
                >
                  <Icon size={17} />
                </ActionIcon>
              ))}
            </Group>
          </Group>

          <Box className={classes.previewStage}>
            <Paper
              withBorder
              radius="md"
              className={device === 'mobile' ? classes.frameMobile : classes.frameDesktop}
            >
              <Box className={classes.browserBar}>
                <span className={classes.dot} />
                <span className={classes.dot} />
                <span className={classes.dot} />
                <Text size="xs" c="dimmed" className={classes.browserUrl}>
                  {shareUrl}
                </Text>
              </Box>
              <iframe src={`${shareUrl}?preview=1`} title="Form preview" className={classes.frame} />
            </Paper>
          </Box>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            Live preview of the {active.label.toLowerCase()} destination.
          </Text>
        </Box>
      </Group>
    </Modal>
  );
}
