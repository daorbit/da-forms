import { useState } from 'react';
import {
  Text,
  Textarea,
  Group,
  Stack,
  NumberInput,
  Button,
  CopyButton,
  Divider,
  Paper,
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

interface Props {
  shareUrl: string;
  variant: 'standard' | 'popup';
}

export function EmbedPanel({ shareUrl, variant }: Props) {
  const [width, setWidth] = useState<string | number>('100%');
  const [height, setHeight] = useState<number | string>(600);

  const iframeCode = `<iframe
  src="${shareUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border:0;max-width:100%"
></iframe>`;

  const popupCode = `<button onclick="daFormsOpen()">Open form</button>

<script>
  function daFormsOpen() {
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;' +
      'align-items:center;justify-content:center;z-index:9999';
    overlay.onclick = function (event) {
      if (event.target === overlay) overlay.remove();
    };

    var frame = document.createElement('iframe');
    frame.src = '${shareUrl}';
    frame.style.cssText =
      'width:min(680px,92vw);height:min(${height}px,90vh);border:0;border-radius:8px;background:#fff';

    overlay.appendChild(frame);
    document.body.appendChild(overlay);
  }
</script>`;

  const code = variant === 'popup' ? popupCode : iframeCode;

  return (
    <Stack gap="lg">
      <div>
        <Text fw={600} size="lg">
          {variant === 'popup' ? 'Popup Embed' : 'Standard Embed'}
        </Text>
        <Text size="sm" c="dimmed">
          {variant === 'popup'
            ? 'Open the form in a modal over your page when a button is clicked.'
            : 'Place the form inline on any page of your website.'}
        </Text>
      </div>

      <Group gap="md">
        {variant === 'standard' && (
          <NumberInput
            label="Width"
            w={140}
            value={typeof width === 'number' ? width : ''}
            placeholder="100%"
            onChange={(value) => setWidth(value === '' ? '100%' : value)}
          />
        )}
        <NumberInput
          label="Height (px)"
          w={140}
          value={height}
          onChange={(value) => setHeight(value === '' ? 600 : value)}
        />
      </Group>

      <div>
        <Group justify="space-between" mb={6}>
          <Text size="sm" fw={500}>
            Embed code
          </Text>
          <CopyButton value={code}>
            {({ copied, copy }) => (
              <Button
                size="compact-sm"
                variant="light"
                color={copied ? 'teal' : 'blue'}
                leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                onClick={copy}
              >
                {copied ? 'Copied' : 'Copy code'}
              </Button>
            )}
          </CopyButton>
        </Group>
        <Textarea readOnly value={code} autosize minRows={6} onFocus={(e) => e.target.select()} />
      </div>

      <Divider />

      <div>
        <Text size="sm" fw={500} mb={8}>
          Preview
        </Text>
        <Paper withBorder radius="md" p="xs">
          <iframe
            src={shareUrl}
            title="Form preview"
            width="100%"
            height={Number(height) || 600}
            style={{ border: 0, display: 'block' }}
          />
        </Paper>
      </div>
    </Stack>
  );
}
