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
  Tooltip,
} from '@mantine/core';
import {
  IconX,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconLink,
  IconCode,
  IconDeviceIpad,
  IconDeviceLaptop,
  IconDeviceMobile,
  IconInfoCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { updateForm, publicFormUrl } from '@/lib/api';
import type { Form } from '@/types';
import { useFitScale } from '@/hooks/useFitScale';
import { DeviceFrame, DEVICE_ORDER, DEVICE_SPECS, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import classes from './ShareModal.module.css';

const DEVICE_ICONS: Record<DeviceId, typeof IconDeviceLaptop> = {
  macbook: IconDeviceLaptop,
  ipad: IconDeviceIpad,
  iphone: IconDeviceMobile,
};

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

type EmbedLang = 'html' | 'react' | 'vue';

const EMBED_LANG_LABEL: Record<EmbedLang, string> = { html: 'HTML', react: 'React', vue: 'Vue' };

/** A form's title, made into a valid PascalCase component name for the React snippet. */
function componentNameFor(title: string): string {
  const words = (title || 'Embedded Form').match(/[a-zA-Z0-9]+/g) ?? ['Embedded', 'Form'];
  const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return /^[0-9]/.test(name) ? `Form${name}` : name;
}

export function ShareModal({ opened, onClose, form, onStatusChange }: Props) {
  const [tab, setTab] = useState<TabId>('link');
  const [device, setDevice] = useState<DeviceId>('macbook');
  const [published, setPublished] = useState(form.status === 'published');
  const [height, setHeight] = useState<number | string>(600);
  const stageRef = useRef<HTMLDivElement>(null);

  const shareUrl = publicFormUrl(form._id);

  const frameDims = frameSize(device);
  const scale = useFitScale(stageRef, {
    enabled: opened,
    contentWidth: frameDims.width,
    contentHeight: frameDims.height,
    padding: { x: 48, y: 48 },
  });

  // A unique id per copy of the snippet — if someone embeds the same form
  // twice on one page, each iframe still resizes independently.
  const frameId = useMemo(() => `da-form-${form._id}`, [form._id]);

  const htmlEmbedCode = useMemo(
    () =>
      `<iframe\n  id="${frameId}"\n  src="${shareUrl}"\n  width="100%"\n  height="${height}"\n  frameborder="0"\n  style="border:0;max-width:100%"\n></iframe>\n<script>\n  window.addEventListener('message', function (e) {\n    if (e.data && e.data.type === 'da-forms:height') {\n      var frame = document.getElementById('${frameId}');\n      if (frame) frame.style.height = e.data.height + 'px';\n    }\n  });\n</script>`,
    [shareUrl, height, frameId]
  );

  const reactEmbedCode = useMemo(
    () =>
      `import { useEffect, useRef } from 'react';\n\nfunction ${componentNameFor(form.title)}() {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    function onMessage(e) {\n      if (e.data?.type !== 'da-forms:height') return;\n      if (ref.current) ref.current.style.height = e.data.height + 'px';\n    }\n    window.addEventListener('message', onMessage);\n    return () => window.removeEventListener('message', onMessage);\n  }, []);\n\n  return (\n    <iframe\n      ref={ref}\n      src="${shareUrl}"\n      title="${(form.title || 'Form').replace(/"/g, '\\"')}"\n      style={{ width: '100%', height: ${typeof height === 'number' ? height : 600}, border: 0 }}\n    />\n  );\n}`,
    [shareUrl, height, form.title]
  );

  const vueEmbedCode = useMemo(
    () =>
      `<template>\n  <iframe\n    ref="frame"\n    src="${shareUrl}"\n    :style="{ width: '100%', height: height + 'px', border: 0 }"\n  />\n</template>\n\n<script setup>\nimport { ref, onMounted, onUnmounted } from 'vue';\n\nconst height = ref(${typeof height === 'number' ? height : 600});\nfunction onMessage(e) {\n  if (e.data?.type === 'da-forms:height') height.value = e.data.height;\n}\nonMounted(() => window.addEventListener('message', onMessage));\nonUnmounted(() => window.removeEventListener('message', onMessage));\n</script>`,
    [shareUrl, height]
  );

  const embedSnippets: { id: EmbedLang; label: string; code: string }[] = [
    { id: 'html', label: 'HTML', code: htmlEmbedCode },
    { id: 'react', label: 'React', code: reactEmbedCode },
    { id: 'vue', label: 'Vue', code: vueEmbedCode },
  ];
  const [embedLang, setEmbedLang] = useState<EmbedLang>('html');
  const embedCode = embedSnippets.find((s) => s.id === embedLang)?.code ?? htmlEmbedCode;

  // Reset when it closes, so reopening starts on the tab people expect.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !opened) {
      setTab('link');
      setDevice('macbook');
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
      <Group gap={0} align="stretch" wrap="nowrap" className={classes.shell}>
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
              <Paper withBorder radius="md" p="sm" mb="lg" bg="var(--mantine-color-yellow-light)">
                <Text size="sm" c="var(--mantine-color-yellow-light-color)">
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
                <Paper withBorder radius="md" p="sm" className={classes.infoBox}>
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <IconInfoCircle size={16} className={classes.infoIcon} />
                    <Text size="xs" className={classes.infoText}>
                      The snippet below auto-resizes the iframe to fit the form — no need to tune a
                      fixed height, and it keeps working as fields, pages, or conditional logic
                      change how tall the form is. The height below is only the size shown for a
                      moment before the first resize message arrives.
                    </Text>
                  </Group>
                </Paper>

                <Group justify="space-between" align="flex-end">
                  <Text size="sm" fw={600}>
                    Embed code
                  </Text>
                  <NumberInput
                    label="Starting height (px)"
                    size="xs"
                    w={140}
                    value={height}
                    onChange={(value) => setHeight(value === '' ? 600 : value)}
                  />
                </Group>

                <Group gap={4} className={classes.langTabs}>
                  {embedSnippets.map((snippet) => (
                    <Box
                      key={snippet.id}
                      component="button"
                      type="button"
                      onClick={() => setEmbedLang(snippet.id)}
                      className={classes.langTab}
                      aria-current={embedLang === snippet.id}
                      style={{
                        fontWeight: embedLang === snippet.id ? 600 : 500,
                        color: embedLang === snippet.id ? 'var(--mantine-color-emerald-7)' : 'var(--mantine-color-dimmed)',
                        borderColor: embedLang === snippet.id ? 'var(--mantine-color-emerald-6)' : 'transparent',
                      }}
                    >
                      {EMBED_LANG_LABEL[snippet.id]}
                    </Box>
                  ))}
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
                  {embedLang === 'html' &&
                    'Paste this into any page of your site — the HTML and the resize script go together.'}
                  {embedLang === 'react' &&
                    'Drop this component into your app and render it wherever the form should appear.'}
                  {embedLang === 'vue' &&
                    'Drop this single-file component into your app and use it as a regular component.'}
                  {' '}The iframe scales to its container width and its height auto-fits the form.
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
            <Group gap={2} className={classes.deviceToggle}>
              {DEVICE_ORDER.map((id) => {
                const Icon = DEVICE_ICONS[id];
                return (
                  <Tooltip key={id} label={DEVICE_SPECS[id].label} withArrow>
                    <button
                      type="button"
                      className={`${classes.deviceButton} ${device === id ? classes.deviceButtonActive : ''}`}
                      onClick={() => setDevice(id)}
                      aria-label={DEVICE_SPECS[id].label}
                      aria-pressed={device === id}
                    >
                      <Icon size={17} stroke={1.6} />
                    </button>
                  </Tooltip>
                );
              })}
            </Group>
          </Group>

          {/* The stage always renders — it is what gets measured. The frame
              inside waits for that measurement, so it is never painted at full
              size before being scaled down to fit. */}
          <Box className={classes.previewStage} ref={stageRef}>
            {scale !== null && (
              <DeviceFrame device={device} scale={scale}>
                <iframe
                  key={device}
                  src={`${shareUrl}?preview=1`}
                  title="Form preview"
                  className={classes.frame}
                />
              </DeviceFrame>
            )}
          </Box>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            Live preview of the {active.label.toLowerCase()} destination.
          </Text>
        </Box>
      </Group>
    </Modal>
  );
}
