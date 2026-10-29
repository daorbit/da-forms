import { useState } from 'react';
import { Anchor, Button, Group, Text } from '@mantine/core';
import { ExternalLinkIcon, ReceiptTextIcon } from 'lucide-react';
import type { Submission, SubmissionInvoice } from '@/types';
import { ApiError, createSubmissionInvoice } from '@/lib/api';
import { notify } from '@/lib/notify';

interface Props {
  submission: Submission;
  enabled: boolean;
}

export function PaymentInvoiceRow({ submission, enabled }: Props) {
  const [invoice, setInvoice] = useState<SubmissionInvoice | undefined>(submission.invoice);
  const [creating, setCreating] = useState(false);
  const created = invoice?.status === 'created' && invoice.shareUrl;

  if (!created && !enabled) return null;

  const create = async () => {
    setCreating(true);
    try {
      setInvoice(await createSubmissionInvoice(submission.formId, submission._id));
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : 'The invoice could not be created.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        Invoice
      </Text>
      {created ? (
        <Anchor href={invoice.shareUrl} target="_blank" rel="noreferrer" size="sm">
          <Group gap={4} wrap="nowrap">
            {invoice.number}
            <ExternalLinkIcon size={13} />
          </Group>
        </Anchor>
      ) : (
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<ReceiptTextIcon size={14} />}
          loading={creating}
          onClick={() => void create()}
        >
          {invoice?.status === 'failed' ? 'Retry invoice' : 'Create invoice'}
        </Button>
      )}
    </Group>
  );
}
