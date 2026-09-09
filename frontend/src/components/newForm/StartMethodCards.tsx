import { Badge, Group, Loader, Text, UnstyledButton } from '@mantine/core';
import { IconArrowRight, IconLayoutGrid, IconPlus } from '@tabler/icons-react';
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
  const methods = [
    {
      key: 'blank',
      icon: creatingBlank ? <Loader size={20} color="emerald" /> : <IconPlus size={20} />,
      title: 'Start from scratch',
      body: 'An empty form. Add the fields you want, in the order you want them.',
      action: 'Create form',
      onClick: onBlank,
    },
    {
      key: 'template',
      icon: <IconLayoutGrid size={20} />,
      title: 'Start from a template',
      body: `${formTemplates.length - 1} ready-made forms — contact, feedback, RSVP, intake and more.`,
      action: 'Browse templates',
      onClick: onTemplate,
    },
    {
      key: 'orbit',
      icon: <OrbitMark size={20} />,
      title: 'Build with Orbit',
      body: 'Describe what you need and Orbit drafts the fields, wording and colours.',
      action: 'Describe your form',
      badge: 'Fastest',
      onClick: onOrbit,
    },
  ];

  return (
    <Group grow align="stretch" gap="md" wrap="nowrap">
      {methods.map((method) => (
        <UnstyledButton
          key={method.key}
          className={classes.methodCard}
          onClick={method.onClick}
          disabled={creating}
        >
          <div className={classes.cardHead}>
 
            <span className={classes.iconTile}>{method.icon}</span>
            {method.badge && (
              <Badge size="xs" variant="light" color="emerald" radius="sm">
                {method.badge}
              </Badge>
            )}
          </div>

          <Text fw={600} size="sm" mt={12}>
            {method.title}
          </Text>
          <Text size="xs" c="dimmed" mt={4} className={classes.cardBody}>
            {method.body}
          </Text>

   
          <span className={classes.cardAction}>
            {method.action}
            <IconArrowRight size={13} className={classes.cardArrow} />
          </span>
        </UnstyledButton>
      ))}
    </Group>
  );
}
