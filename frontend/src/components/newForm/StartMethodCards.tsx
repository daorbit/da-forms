import { Badge, Group, Loader, Text, UnstyledButton } from '@mantine/core';
import { IconLayoutGrid, IconPlus } from '@tabler/icons-react';
import { formTemplates } from '@/lib/templates';
import { OrbitMark } from '@/components/OrbitMark';
import classes from './StartMethodCards.module.css';

interface Props {
  /** True while the blank form is being created, which disables all three. */
  creating: boolean;
  /** True for the card whose action is running, so only it shows a spinner. */
  creatingBlank: boolean;
  onBlank: () => void;
  onTemplate: () => void;
  onOrbit: () => void;
}

/**
 * The three ways to start, on the step between naming a form and building it.
 *
 * Each card is a tall panel with its own tinted head: the head carries the icon
 * and gives the three distinct colour, so they are told apart at a glance
 * rather than by reading three near-identical grey boxes. Below it the title
 * and one line of explanation, and the whole card is the click target.
 *
 * Ordered by how much each does for you. Orbit leads and carries the badge — it
 * is the one most people want and the least likely to be found on its own.
 *
 * "From scratch" creates the form on the spot; the other two open another step,
 * so only the first can be mid-flight and only it has a loading state.
 */
export function StartMethodCards({
  creating,
  creatingBlank,
  onBlank,
  onTemplate,
  onOrbit,
}: Props) {
  const methods = [
    {
      key: 'orbit',
      tone: classes.toneOrbit,
      icon: <OrbitMark size={24} />,
      title: 'Build with Orbit',
      body: 'Describe what you need. Orbit drafts the fields, wording and colours.',
      badge: 'Fastest',
      onClick: onOrbit,
    },
    {
      key: 'template',
      tone: classes.toneTemplate,
      icon: <IconLayoutGrid size={24} />,
      title: 'Start from a template',
      // Less the blank entry, which is its own card rather than one of the
      // templates on offer.
      body: `${formTemplates.length - 1} ready-made forms, previewed before you pick.`,
      onClick: onTemplate,
    },
    {
      key: 'blank',
      tone: classes.toneBlank,
      icon: creatingBlank ? <Loader size={24} color="emerald" /> : <IconPlus size={24} />,
      title: 'Start from scratch',
      body: 'An empty form. Add the fields you want, in the order you want them.',
      onClick: onBlank,
    },
  ];

  return (
    <Group grow align="stretch" gap="sm" wrap="nowrap">
      {methods.map((method) => (
        <UnstyledButton
          key={method.key}
          className={classes.methodCard}
          onClick={method.onClick}
          disabled={creating}
        >
          {/* The tinted head. Its colour is what separates the three on sight,
              and it holds the badge so the body below stays one clean block. */}
          <span className={`${classes.cardHead} ${method.tone}`}>
            <span className={classes.headIcon}>{method.icon}</span>
            {method.badge && (
              <Badge size="xs" variant="filled" color="emerald" radius="sm">
                {method.badge}
              </Badge>
            )}
          </span>

          <span className={classes.cardBody}>
            <Text fw={600} size="sm">
              {method.title}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {method.body}
            </Text>
          </span>
        </UnstyledButton>
      ))}
    </Group>
  );
}
