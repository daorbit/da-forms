import { useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  Group,
  Select,
  SegmentedControl,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import type { BackgroundLayer, BackgroundPosition, BackgroundSize } from '@/types';
import { GRADIENT_PRESETS } from '@/lib/formBackground';
import { uploadBackgroundImage } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

interface Props {
  layer: BackgroundLayer;
  onChange: (patch: Partial<BackgroundLayer>) => void;
  /** `fixed` only makes sense for the full-page layer, not for the card. */
  allowFixed?: boolean;
}

type Mode = 'none' | 'gradient' | 'image';

const POSITIONS: { value: BackgroundPosition; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top left', label: 'Top left' },
  { value: 'top right', label: 'Top right' },
  { value: 'bottom left', label: 'Bottom left' },
  { value: 'bottom right', label: 'Bottom right' },
];

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function modeOf(layer: BackgroundLayer): Mode {
  if (layer.image) return 'image';
  if (layer.gradient) return 'gradient';
  return 'none';
}

/**
 * Edits one background layer — the page behind the card, or the card itself.
 * Switching mode clears the other mode's value, so the stored layer never
 * carries a gradient the form isn't showing.
 */
export function BackgroundEditor({ layer, onChange, allowFixed }: Props) {
  const workspaceId = useWorkspaceId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Tracked separately from the layer so switching to Image shows the upload
  // controls before a URL exists to store.
  const [mode, setMode] = useState<Mode>(() => modeOf(layer));

  function selectMode(next: Mode) {
    setMode(next);
    if (next === 'none') onChange({ image: undefined, gradient: undefined });
    if (next === 'gradient') onChange({ image: undefined });
    if (next === 'image') onChange({ gradient: undefined });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      notifications.show({ message: 'Background image must be under 15MB', color: 'red' });
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadBackgroundImage(file, workspaceId);
      onChange({ image: url, gradient: undefined, size: layer.size ?? 'cover' });
    } catch {
      notifications.show({ message: 'Could not upload the image', color: 'red' });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <Stack gap="md">
      <SegmentedControl
        fullWidth
        value={mode}
        onChange={(value) => selectMode(value as Mode)}
        data={[
          { value: 'none', label: 'Color only' },
          { value: 'gradient', label: 'Gradient' },
          { value: 'image', label: 'Image' },
        ]}
      />

      {mode === 'gradient' && (
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            Pick a preset, or paste any CSS gradient below.
          </Text>
          <Group gap={8}>
            {GRADIENT_PRESETS.map((preset) => (
              <Tooltip key={preset.id} label={preset.name} withArrow>
                <Box
                  component="button"
                  type="button"
                  onClick={() => onChange({ gradient: preset.value, image: undefined })}
                  aria-label={preset.name}
                  style={{
                    width: 42,
                    height: 30,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: preset.value,
                    border:
                      layer.gradient === preset.value
                        ? '2px solid var(--mantine-color-emerald-6)'
                        : '1px solid var(--mantine-color-gray-4)',
                  }}
                />
              </Tooltip>
            ))}
          </Group>
          <TextInput
            label="Custom gradient"
            placeholder="linear-gradient(135deg, #4c6ef5, #15aabf)"
            value={layer.gradient ?? ''}
            onChange={(e) => onChange({ gradient: e.currentTarget.value, image: undefined })}
          />
        </Stack>
      )}

      {mode === 'image' && (
        <Stack gap="sm">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.currentTarget.files?.[0])}
          />
          <Group gap="xs" wrap="nowrap">
            <Button
              variant="light"
              leftSection={<IconUpload size={16} />}
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              Upload image
            </Button>
            {layer.image && (
              <Tooltip label="Remove image" withArrow>
                <ActionIcon variant="subtle" color="red" onClick={() => onChange({ image: undefined })}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

          <TextInput
            label="Or paste an image URL"
            placeholder="https://…/photo.jpg"
            value={layer.image ?? ''}
            onChange={(e) => onChange({ image: e.currentTarget.value, gradient: undefined })}
          />

          {layer.image && (
            <Box
              style={{
                height: 90,
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-3)',
                backgroundImage: `url("${layer.image}")`,
                backgroundSize: layer.size === 'repeat' ? 'auto' : (layer.size ?? 'cover'),
                backgroundPosition: layer.position ?? 'center',
                backgroundRepeat: layer.size === 'repeat' ? 'repeat' : 'no-repeat',
              }}
            />
          )}

          <Group grow>
            <Select
              label="Fit"
              value={layer.size ?? 'cover'}
              onChange={(value) => onChange({ size: (value ?? 'cover') as BackgroundSize })}
              data={[
                { value: 'cover', label: 'Fill' },
                { value: 'contain', label: 'Fit' },
                { value: 'repeat', label: 'Tile' },
              ]}
              allowDeselect={false}
            />
            <Select
              label="Position"
              value={layer.position ?? 'center'}
              onChange={(value) => onChange({ position: (value ?? 'center') as BackgroundPosition })}
              data={POSITIONS}
              allowDeselect={false}
            />
          </Group>

          {allowFixed && (
            <Switch
              label="Keep still while scrolling"
              checked={layer.fixed ?? false}
              onChange={(e) => onChange({ fixed: e.currentTarget.checked })}
            />
          )}
        </Stack>
      )}

      {mode !== 'none' && (
        <Stack gap={6}>
          <ColorInput
            label="Readability overlay"
            description="A tint laid over the background so text stays legible"
            value={layer.overlay ?? ''}
            onChange={(value) => onChange({ overlay: value })}
            placeholder="#000000"
          />
          <Text size="xs" c="dimmed">
            Overlay strength — {layer.overlayOpacity ?? 0}%
          </Text>
          <Slider
            value={layer.overlayOpacity ?? 0}
            onChange={(value) => onChange({ overlayOpacity: value })}
            min={0}
            max={100}
            step={5}
            disabled={!layer.overlay}
          />
        </Stack>
      )}
    </Stack>
  );
}
