import { useEffect, useState } from 'react';
import { Modal, Group, Text, ActionIcon, Box, Badge, Button } from '@mantine/core';
import {
  IconX,
  IconDeviceDesktop,
  IconDeviceTablet,
  IconDeviceMobile,
  IconChevronRight,
  IconChevronLeft,
} from '@tabler/icons-react';
import type { FormField, LabelPlacement, SubmitButtonSize, SubmitButtonWidth, SubmitButtonAlign, FormTheme } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { THEME_PRESETS } from '@/lib/themePresets';
import { PresetCard } from './PresetCard';
import classes from './PreviewModal.module.css';

type Device = 'desktop' | 'tablet' | 'mobile';

/** The width the form is given — the same widths the real page hits on each device. */
const DEVICES: { id: Device; label: string; icon: typeof IconDeviceDesktop; width: number }[] = [
  { id: 'desktop', label: 'Desktop', icon: IconDeviceDesktop, width: 900 },
  { id: 'tablet', label: 'Tablet', icon: IconDeviceTablet, width: 600 },
  { id: 'mobile', label: 'Mobile', icon: IconDeviceMobile, width: 390 },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: FormField[];
  hideHeader?: boolean;
  headerAlign?: SubmitButtonAlign;
  labelPlacement?: LabelPlacement;
  submitLabel?: string;
  submitButtonSize?: SubmitButtonSize;
  submitButtonWidth?: SubmitButtonWidth;
  submitButtonAlign?: SubmitButtonAlign;
  theme?: FormTheme;
  /** Applies a preset's colors straight to the builder's theme state. */
  onApplyTheme?: (patch: Partial<FormTheme>) => void;
}

/**
 * Shows exactly what respondents see, rendered from the editor's current
 * state — so unsaved changes are previewable without a round trip.
 */
export function PreviewModal({
  opened,
  onClose,
  title,
  description,
  fields,
  hideHeader,
  headerAlign,
  labelPlacement,
  submitLabel,
  submitButtonSize,
  submitButtonWidth,
  submitButtonAlign,
  theme,
  onApplyTheme,
}: Props) {
  const [device, setDevice] = useState<Device>('desktop');
  const [panelOpen, setPanelOpen] = useState(true);
  const [pickedId, setPickedId] = useState<string | null>(null);

  // A picked preset is previewed here only; Apply is what reaches the builder.
  useEffect(() => {
    if (!opened) setPickedId(null);
  }, [opened]);

  const active = DEVICES.find((d) => d.id === device) ?? DEVICES[0];

  // A preset is "current" when the theme still matches every color it sets.
  const currentPreset = THEME_PRESETS.find((p) =>
    (Object.keys(p.theme) as (keyof typeof p.theme)[]).every((k) => theme?.[k] === p.theme[k])
  );

  const picked = THEME_PRESETS.find((p) => p.id === pickedId);
  const shownTheme: FormTheme | undefined = picked
    ? { ...theme, ...picked.theme, scope: theme?.scope ?? 'page' }
    : theme;

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
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Group justify="space-between" px="md" className={classes.topbar} wrap="nowrap">
        <Group gap={10} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>
            {title || 'Untitled form'}
          </Text>
          <Badge variant="light" color="gray" size="sm">
            Preview
          </Badge>
          {picked && (
            <Badge variant="light" color="violet" size="sm">
              {picked.name}
            </Badge>
          )}
        </Group>

        <Group gap={2} wrap="nowrap" className={classes.deviceGroup}>
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${classes.deviceButton} ${device === item.id ? classes.deviceButtonActive : ''}`}
              onClick={() => setDevice(item.id)}
              aria-label={item.label}
              aria-pressed={device === item.id}
            >
              <item.icon size={18} stroke={1.6} />
            </button>
          ))}
        </Group>

        <Group justify="flex-end" gap="xs" style={{ flex: 1 }} wrap="nowrap">
          {picked && onApplyTheme && (
            <Button
              size="xs"
              color="emerald"
              onClick={() => {
                onApplyTheme(picked.theme);
                setPickedId(null);
              }}
            >
              Apply theme
            </Button>
          )}
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
            <IconX size={19} />
          </ActionIcon>
        </Group>
      </Group>

      <Box className={classes.body}>
        {/* Always the respondent's own colours, whatever theme the host passes. */}
        <Box
          className={`${classes.stage} da-forms-light-surface`}
          data-mantine-color-scheme="light"
          style={shownTheme?.scope !== 'card' ? { backgroundColor: shownTheme?.pageBg } : undefined}
        >
          <Box className={classes.viewport} style={{ width: active.width, maxWidth: '100%' }}>
            {/* Remount per open so each preview starts from the initial values. */}
            <FormRenderer
              key={opened ? 'open' : 'closed'}
              title={title}
              description={description}
              fields={fields}
              hideHeader={hideHeader}
              headerAlign={headerAlign}
              labelPlacement={labelPlacement}
              submitLabel={submitLabel}
              submitButtonSize={submitButtonSize}
              submitButtonWidth={submitButtonWidth}
              submitButtonAlign={submitButtonAlign}
              theme={shownTheme}
            />
            <Text size="xs" c="dimmed" ta="center" mt="md">
              Submissions are not recorded in preview.
            </Text>
          </Box>
        </Box>

        {onApplyTheme && (
          <>
            <button
              type="button"
              className={classes.panelToggle}
              onClick={() => setPanelOpen((v) => !v)}
              aria-label={panelOpen ? 'Hide themes' : 'Show themes'}
              data-open={panelOpen}
            >
              {panelOpen ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
            </button>

            {panelOpen && (
              <Box className={classes.panel}>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={10}>
                  Themes
                </Text>
                <Box className={classes.presetGrid}>
                  {THEME_PRESETS.map((item) => (
                    <PresetCard
                      key={item.id}
                      preset={item}
                      selected={item.id === (pickedId ?? currentPreset?.id)}
                      onSelect={() => setPickedId(item.id === pickedId ? null : item.id)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Modal>
  );
}
