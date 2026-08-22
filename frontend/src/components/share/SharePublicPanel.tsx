import { useEffect, useState } from 'react';
import { Text, Textarea, Button, Group, Stack, Switch, Divider, Alert, ActionIcon } from '@mantine/core';
import { IconInfoCircle, IconBrandFacebook, IconBrandX, IconBrandLinkedin } from '@tabler/icons-react';
import QRCode from 'qrcode';
import { updateForm } from '@/lib/api';
import type { Form } from '@/types';
import classes from './SharePanels.module.css';

interface Props {
  form: Form;
  shareUrl: string;
}

export function SharePublicPanel({ form, shareUrl }: Props) {
  const [published, setPublished] = useState(form.status === 'published');
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 260, margin: 1 }).then(setQr);
  }, [shareUrl]);

  async function togglePublished(next: boolean) {
    setPublished(next);
    await updateForm(form._id, { status: next ? 'published' : 'draft' });
  }

  const encoded = encodeURIComponent(shareUrl);
  const socials = [
    { icon: IconBrandFacebook, color: '#1877f2', url: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { icon: IconBrandX, color: '#000', url: `https://twitter.com/intent/tweet?url=${encoded}` },
    { icon: IconBrandLinkedin, color: '#0a66c2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={600} size="lg">
            Share Publicly
          </Text>
          <Text size="sm" c="dimmed">
            Share your form as a public link.
          </Text>
        </div>
        <Switch
          checked={published}
          onChange={(e) => togglePublished(e.target.checked)}
          label={published ? 'Enabled' : 'Disabled'}
          labelPosition="left"
          color="teal"
        />
      </Group>

      <div>
        <Text size="sm" fw={500} mb={6}>
          Form Permalink (URL)
        </Text>
        <Textarea readOnly value={shareUrl} autosize minRows={3} onFocus={(e) => e.target.select()} />
      </div>

      <Divider />

      <div>
        <Text size="sm" fw={500} mb={10}>
          QR Code
        </Text>
        <Group align="center" gap="xl" className={classes.qrRow}>
          {qr && <img src={qr} alt="Form QR code" width={130} height={130} />}
          <div>
            <Text size="sm" mb="sm">
              Share this QR code with your audience to let them access the form directly on their devices.
            </Text>
            <Button component="a" href={qr} download={`${form.title}-qr.png`} color="teal" radius="md">
              Download
            </Button>
          </div>
        </Group>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light" title="Note">
        <Text size="sm">
          Append query parameters to the form URL to prefill fields — for example{' '}
          <code>?fieldId=value</code>.
        </Text>
      </Alert>

      <div>
        <Text size="sm" fw={500}>
          Share on social media
        </Text>
        <Text size="xs" c="dimmed" mb="sm">
          Share this form on your social networks.
        </Text>
        <Group gap="sm">
          {socials.map((social, index) => (
            <ActionIcon
              key={index}
              component="a"
              href={social.url}
              target="_blank"
              rel="noreferrer"
              variant="subtle"
              size="lg"
              radius="xl"
            >
              <social.icon size={24} color={social.color} />
            </ActionIcon>
          ))}
        </Group>
      </div>
    </Stack>
  );
}
