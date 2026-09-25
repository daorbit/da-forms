import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Group,
  Box,
  Text,
  Button,
  ActionIcon,
  CopyButton,
  NumberInput,
  SegmentedControl,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  IconX,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconLink,
  IconCode,
  IconShare2,
} from '@tabler/icons-react';
import {
  SettingsGroup,
  SettingsStack,
  SettingRow,
  SwitchRow,
} from '@/components/builder/settings/SettingsGroup';
import { QrCard } from './QrCard';
import { notifications } from '@mantine/notifications';
import { updateForm, publicFormUrl } from '@/lib/api';
import type { Form } from '@/types';
import { useFitScale } from '@/hooks/useFitScale';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import {
  WhatsAppIcon, XIcon, FacebookIcon, LinkedInIcon, TelegramIcon, MailIcon,
  RedditIcon, PinterestIcon,
} from './SocialIcons';
import classes from './ShareModal.module.css';

type TabId = 'link' | 'embed';

/** Each platform's own share-intent URL — opening one hands off to that
 * site's native share flow rather than us reimplementing posting. */
function socialTargets(url: string, title: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon, bg: '#25D366', fg: '#fff', href: `https://wa.me/?text=${t}%20${u}` },
    { id: 'x', label: 'X', Icon: XIcon, bg: '#000000', fg: '#fff', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { id: 'facebook', label: 'Facebook', Icon: FacebookIcon, bg: '#1877F2', fg: '#fff', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { id: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon, bg: '#0A66C2', fg: '#fff', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { id: 'telegram', label: 'Telegram', Icon: TelegramIcon, bg: '#26A5E4', fg: '#fff', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { id: 'reddit', label: 'Reddit', Icon: RedditIcon, bg: '#FF4500', fg: '#fff', href: `https://reddit.com/submit?url=${u}&title=${t}` },
    { id: 'pinterest', label: 'Pinterest', Icon: PinterestIcon, bg: '#E60023', fg: '#fff', href: `https://pinterest.com/pin/create/button/?url=${u}&description=${t}` },
    { id: 'email', label: 'Email', Icon: MailIcon, bg: '#6b7280', fg: '#fff', href: `mailto:?subject=${t}&body=${u}` },
  ] as const;
}

const TABS: { id: TabId; label: string; icon: typeof IconLink }[] = [
  { id: 'link', label: 'Public link', icon: IconLink },
  { id: 'embed', label: 'Embed', icon: IconCode },
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

  const shareUrl = publicFormUrl(form._id);
  const socials = useMemo(() => socialTargets(shareUrl, form.title || 'Fill out this form'), [shareUrl, form.title]);

  const frameDims = frameSize(device);
  const { ref: stageRef, scale, measured } = useFitScale({
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
          <div className={classes.panelHeader}>
            <span className={classes.headIcon}>
              <IconShare2 size={17} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Group gap={8} wrap="nowrap">
                <Text fw={600} size="md">
                  Share form
                </Text>
                <span className={classes.statusPill} data-live={published || undefined}>
                  <span className={classes.statusDot} />
                  {published ? 'Live' : 'Draft'}
                </span>
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {form.name || form.title}
              </Text>
            </div>
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
              <IconX size={18} />
            </ActionIcon>
          </div>

          <Box px={20} pt="md">
            <SegmentedControl
              fullWidth
              value={tab}
              onChange={(v) => setTab(v as TabId)}
              data={TABS.map((item) => ({
                value: item.id,
                label: (
                  <span className={classes.tabLabel}>
                    <item.icon size={15} />
                    {item.label}
                  </span>
                ),
              }))}
            />
          </Box>

          <Box className={classes.panelBody}>
            <SettingsStack>
              <SettingsGroup title="Visibility">
                <SwitchRow
                  label="Share publicly"
                  hint={
                    published
                      ? 'Anyone with the link can open and submit this form.'
                      : 'This form is a draft — nobody can open the link until you turn this on.'
                  }
                  checked={published}
                  onChange={togglePublished}
                />
              </SettingsGroup>

              {tab === 'link' && (
                <>
                  <SettingsGroup title="Form link" hint="Add ?fieldId=value to the link to prefill an answer.">
                    <SettingRow stacked>
                      <TextInput
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        classNames={{ input: classes.mono }}
                        rightSectionWidth={36}
                        rightSection={
                          <Tooltip label="Open form" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
                              aria-label="Open form"
                            >
                              <IconExternalLink size={15} />
                            </ActionIcon>
                          </Tooltip>
                        }
                      />
                      <CopyButton value={shareUrl}>
                        {({ copied, copy }) => (
                          <Button
                            fullWidth
                            mt={10}
                            variant={copied ? 'light' : 'filled'}
                            onClick={copy}
                            leftSection={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                          >
                            {copied ? 'Link copied' : 'Copy link'}
                          </Button>
                        )}
                      </CopyButton>
                    </SettingRow>
                  </SettingsGroup>

                  <SettingsGroup title="Share to" hint="Opens each app's own share screen with the link filled in.">
                    <SettingRow stacked>
                      <div className={classes.socialGrid}>
                        {socials.map(({ id, label, Icon, bg, fg, href }) => (
                          <a
                            key={id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={classes.social}
                            aria-label={`Share on ${label}`}
                          >
                            <span className={classes.socialIcon} style={{ backgroundColor: bg, color: fg }}>
                              <Icon size={18} />
                            </span>
                            <span className={classes.socialLabel}>{label}</span>
                          </a>
                        ))}
                      </div>
                    </SettingRow>
                  </SettingsGroup>

                  <SettingsGroup title="QR code" hint="For print, posters and slides — it opens the same link.">
                    <SettingRow stacked>
                      <QrCard url={shareUrl} name={form.name || form.title || 'form'} />
                    </SettingRow>
                  </SettingsGroup>
                </>
              )}

              {tab === 'embed' && (
                <SettingsGroup
                  title="Embed code"
                  hint="The iframe fits its container's width and resizes its own height to the form."
                >
                  <SettingRow stacked>
                    <SegmentedControl
                      size="xs"
                      value={embedLang}
                      onChange={(v) => setEmbedLang(v as EmbedLang)}
                      data={embedSnippets.map((snippet) => ({ value: snippet.id, label: EMBED_LANG_LABEL[snippet.id] }))}
                      style={{ alignSelf: 'flex-start' }}
                    />
                    <div className={classes.codeWrap}>
                      <pre className={classes.code}>{embedCode}</pre>
                      <CopyButton value={embedCode}>
                        {({ copied, copy }) => (
                          <div className={classes.codeCopy}>
                            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow>
                              <ActionIcon variant="default" onClick={copy} aria-label="Copy embed code">
                                {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                              </ActionIcon>
                            </Tooltip>
                          </div>
                        )}
                      </CopyButton>
                    </div>
                  </SettingRow>
                  <SettingRow label="Starting height" hint="Shown for a moment, before the first resize arrives.">
                    <NumberInput
                      size="xs"
                      w={110}
                      suffix=" px"
                      value={height}
                      onChange={(value) => setHeight(value === '' ? 600 : value)}
                    />
                  </SettingRow>
                  <SettingRow stacked>
                    <CopyButton value={embedCode}>
                      {({ copied, copy }) => (
                        <Button
                          fullWidth
                          variant={copied ? 'light' : 'filled'}
                          onClick={copy}
                          leftSection={copied ? <IconCheck size={15} /> : <IconCode size={15} />}
                        >
                          {copied ? 'Embed code copied' : `Copy ${EMBED_LANG_LABEL[embedLang]} code`}
                        </Button>
                      )}
                    </CopyButton>
                  </SettingRow>
                </SettingsGroup>
              )}
            </SettingsStack>
          </Box>

          <Group justify="flex-end" px={20} py="md" wrap="nowrap" className={classes.actionBar}>
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
            <DeviceSwitch device={device} onChange={setDevice} />
          </Group>

          {/* The frame is laid out from the first render so the stage has
              something to size against, and stays unpainted until that fit has
              been measured. */}
          <Box className={classes.previewStage} ref={stageRef}>
            <DeviceFrame device={device} scale={scale} hidden={!measured}>
              <iframe
                key={device}
                src={`${shareUrl}?preview=1`}
                title="Form preview"
                className={classes.frame}
              />
            </DeviceFrame>
          </Box>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            Live preview of the {active.label.toLowerCase()} destination.
          </Text>
        </Box>
      </Group>
    </Modal>
  );
}
