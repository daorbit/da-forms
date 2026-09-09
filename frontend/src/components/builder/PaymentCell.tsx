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
  Box,
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import type { PaymentProvider, SubmissionPayment } from '@/types';
import { formatAmount } from '@/lib/payment';
import { GatewayLogo } from './GatewayLogos';

interface Props {
  payment?: SubmissionPayment;
}

 
const GATEWAY_NAME: Record<PaymentProvider, string> = {
  razorpay: 'Razorpay',
  cashfree: 'Cashfree',
  payu: 'PayU',
};

function gatewayOf(payment: SubmissionPayment): PaymentProvider {
  return payment.provider ?? 'razorpay';
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
 
export function PaymentCell({ payment }: Props) {
  const [open, setOpen] = useState(false);
 
  if (!payment) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  const amount = formatAmount(payment.amount, payment.currency);
  const gateway = gatewayOf(payment);

  if (payment.status !== 'paid') {
    return (
      <Tooltip label={`${amount} through ${GATEWAY_NAME[gateway]}`} withArrow>
        <Badge size="sm" variant="light" color={payment.status === 'failed' ? 'red' : 'gray'}>
          {payment.status === 'failed' ? 'Failed' : 'Pending'}
        </Badge>
      </Tooltip>
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

          <Tooltip label={`Received through ${GATEWAY_NAME[gateway]}`} withArrow>
            <Box style={{ display: 'flex', alignItems: 'center', opacity: 0.75 }}>
              <GatewayLogo provider={gateway} height={11} />
            </Box>
          </Tooltip>
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
          <Group gap="sm" justify="space-between" wrap="nowrap" align="flex-start">
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
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleString()
                  : `Received through ${GATEWAY_NAME[gateway]}`}
              </Text>
            </Box>
            <Box
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 'var(--mantine-radius-md)',
                border: '1px solid var(--mantine-color-default-border)',
              }}
            >
              <GatewayLogo provider={gateway} height={16} />
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
            Look this up in your {GATEWAY_NAME[gateway]} dashboard by the payment ID.
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
