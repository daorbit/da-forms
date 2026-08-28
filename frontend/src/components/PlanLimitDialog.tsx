import { useEffect, useState } from 'react';
import { Modal, Button, Group, Stack, Text, Badge } from '@mantine/core';
import { IconArrowUpCircle, IconLock } from '@tabler/icons-react';
import { onPlanLimit, requestUpgrade, type PlanLimitEvent } from '@/lib/planLimit';
import './PlanLimitDialog.css';

/**
 * The one dialog every plan limit in this app ends at.
 *
 * A toast is the wrong shape for hitting a cap: it is a decision the reader has
 * to stop and make, not a status update that can vanish in five seconds while
 * they wonder why the thing they clicked did nothing. Mounted once at the root,
 * so no screen has to build its own — and drawn to match the host dashboard's
 * upgrade dialog, since from inside the iframe they are one product.
 */
export function PlanLimitDialog() {
  const [event, setEvent] = useState<PlanLimitEvent | null>(null);

  useEffect(() => onPlanLimit(setEvent), []);

  const limit = event?.limit;
  const heading = limit?.label
    ? `You've reached your ${limit.label} limit`
    : 'Upgrade to unlock this';
  const showMeter = typeof limit?.used === 'number' && typeof limit?.quota === 'number';

  const close = () => setEvent(null);

  return (
    <Modal
      opened={event !== null}
      onClose={close}
      centered
      radius="lg"
      size="sm"
      withCloseButton={false}
      padding={0}
      styles={{ content: { overflow: 'hidden' } }}
    >
      <div className="plan-limit">
        <div className="plan-limit__aurora" />
        <Stack className="plan-limit__body" align="center" gap="lg">
          <div className="plan-limit__seal">
            <IconLock size={24} stroke={1.8} />
          </div>

          <Stack align="center" gap={10}>
            {limit?.plan && (
              <Badge size="sm" radius="sm" variant="light" color="emerald">
                {limit.plan} plan
              </Badge>
            )}
            <Text fw={680} size="lg" ta="center" lh={1.25}>
              {heading}
            </Text>
          </Stack>

          <Text size="sm" c="dimmed" ta="center" maw={320} lh={1.5}>
            {event?.message}
          </Text>

          {showMeter && (
            <Stack gap={10} w="100%" maw={300}>
              <div className="plan-limit__meter">
                <div className="plan-limit__meter-fill" />
              </div>
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">
                  {limit.used} of {limit.quota} used
                </Text>
                <Text size="xs" c="emerald" fw={600}>
                  Limit reached
                </Text>
              </Group>
            </Stack>
          )}

          <Group mt={4} gap="sm">
            <Button variant="subtle" color="gray" onClick={close}>
              Not now
            </Button>
            <Button
              color="emerald"
              leftSection={<IconArrowUpCircle size={16} />}
              onClick={() => {
                close();
                requestUpgrade();
              }}
            >
              Upgrade plan
            </Button>
          </Group>
        </Stack>
      </div>
    </Modal>
  );
}
