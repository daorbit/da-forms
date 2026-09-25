import { useEffect, useState } from 'react';
import { Button, Group, Skeleton, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import QRCode from 'qrcode';
import classes from './ShareModal.module.css';

/** A QR code for the form's link, with a PNG download for print. */
export function QrCard({ url, name }: { url: string; name: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: 512, color: { dark: '#0b0c0e', light: '#ffffff' } })
      .then((d) => {
        if (!cancelled) setDataUrl(d);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const fileName = `${name.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'form'}-qr.png`;

  return (
    <Group gap="md" wrap="nowrap" align="center">
      <div className={classes.qr}>
        {dataUrl ? <img src={dataUrl} alt="QR code for the form link" /> : <Skeleton w={96} h={96} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <Text size="xs" c="dimmed" mb={8}>
          Scanning it opens the form on a phone.
        </Text>
        <Button
          component="a"
          href={dataUrl ?? undefined}
          download={fileName}
          variant="default"
          size="xs"
          leftSection={<IconDownload size={14} />}
          disabled={!dataUrl}
        >
          Download PNG
        </Button>
      </div>
    </Group>
  );
}
