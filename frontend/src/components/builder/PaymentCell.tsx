import { useState } from 'react';
import {
  Badge,
  Group,
  Text,
  Stack,
  Modal,
  UnstyledButton,
  Divider,
  CopyButton,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Box,
} from '@mantine/core';
import { IconCreditCard, IconCopy, IconCheck } from '@tabler/icons-react';
import type { SubmissionPayment } from '@/types';
import { formatAmount } from '@/lib/payment';

interface Props {
  payment?: SubmissionPayment;
}

/** One label/value row in the details dialog. */
function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Group gap={4} wrap="nowrap">
        <Text size="sm" style={{ wordBreak: 'break-all' }}>
          {value}
        </Text>
        <CopyButton value={value}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={copy}>
                {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Group>
  );
}

/**
 * A submission's payment, for the entries table.
 *
 * Reads from `submission.payment` rather than `data`, because a payment is not
 * an answer the respondent typed — it is written by the webhook once Razorpay
 * confirms the money arrived.
 *
 * The cell shows the amount and status; everything else — transaction id, who
 * paid, how — goes in a dialog, so the column stays scannable without losing
 * the detail someone needs when reconciling against Razorpay.
 */
export function PaymentCell({ payment }: Props) {
  const [open, setOpen] = useState(false);

  // A response with no payment at all: the field was added after this one came
  // in, or its condition was not met so nothing was charged.
  if (!payment) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  const amount = formatAmount(payment.amount, payment.currency);

  if (payment.status !== 'paid') {
    return (
      <Badge size="sm" variant="light" color={payment.status === 'failed' ? 'red' : 'gray'}>
        {payment.status === 'failed' ? 'Failed' : 'Pending'}
      </Badge>
    );
  }

  return (
    <>
      <UnstyledButton
        onClick={(e) => {
          // The row itself marks the submission read on click; opening the
          // payment dialog should not also do that.
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Group gap={6} wrap="nowrap">
          <Text size="sm" fw={600}>
            {amount}
          </Text>
          <Badge size="xs" variant="filled" color="emerald">
            Paid
          </Badge>
        </Group>
      </UnstyledButton>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Payment"
        size="md"
        radius="md"
        onClick={(e) => e.stopPropagation()}
      >
        <Stack gap="md">
          <Group gap="sm">
            <ThemeIcon variant="light" color="gray" size="lg" radius="md">
              <IconCreditCard size={18} />
            </ThemeIcon>
            <Box>
              <Group gap={8}>
                <Text fw={700} size="xl">
                  {amount}
                </Text>
                <Badge size="sm" variant="filled" color="emerald">
                  Paid
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'Razorpay'}
              </Text>
            </Box>
          </Group>

          <Divider />

          <Stack gap="xs">
            <Row label="Payment ID" value={payment.paymentId} />
            <Row label="Order ID" value={payment.orderId} />
            <Row label="Method" value={payment.method?.toUpperCase()} />
            <Row label="Email" value={payment.payerEmail} />
            <Row label="Phone" value={payment.payerContact} />
          </Stack>

          <Text size="xs" c="dimmed">
            Look this up in your Razorpay dashboard by the payment ID.
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
