import { Group, Loader, Text, UnstyledButton } from '@mantine/core';
import { IconLayoutGrid, IconPlus } from '@tabler/icons-react';
import { formTemplates } from '@/lib/templates';
import { OrbitMark } from '@/components/OrbitMark';
import classes from './StartMethodCards.module.css';

interface Props {
  creating: boolean;
  creatingBlank: boolean;
  onBlank: () => void;
  onTemplate: () => void;
  onOrbit: () => void;
}
 
export function StartMethodCards({
  creating,
  creatingBlank,
  onBlank,
  onTemplate,
  onOrbit,
}: Props) {
  return (
    <Group grow align="stretch" gap="md" wrap="nowrap">
      <UnstyledButton className={classes.methodCard} onClick={onBlank} disabled={creating}>
        {creatingBlank ? (
          <Loader size={26} color="emerald" />
        ) : (
          <IconPlus size={26} className={classes.methodIcon} />
        )}
        <Text fw={600} size="sm" mt={10}>
          Start from scratch
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          An empty form with nothing on it. Add the fields you want, in the order you want them.
        </Text>
      </UnstyledButton>

      <UnstyledButton className={classes.methodCard} onClick={onTemplate} disabled={creating}>
        <IconLayoutGrid size={26} className={classes.methodIcon} />
        <Text fw={600} size="sm" mt={10}>
          Start from a template
        </Text>
        <Text size="xs" c="dimmed" mt={4}>

          {formTemplates.length - 1} ready-made forms — contact, feedback, RSVP, intake and more.
          Preview each before you pick.
        </Text>
      </UnstyledButton>

      <UnstyledButton className={classes.methodCard} onClick={onOrbit} disabled={creating}>
        <OrbitMark size={26} />
        <Text fw={600} size="sm" mt={10}>
          Build with Orbit
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          Describe what you need and Orbit drafts the fields, wording and colours. Refine it by
          asking for changes.
        </Text>
      </UnstyledButton>
    </Group>
  );
}
