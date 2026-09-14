import { Badge, Loader, Text, UnstyledButton } from '@mantine/core';
import { IconClipboardCheck, IconLayoutGrid, IconPlus } from '@tabler/icons-react';
import { formTemplates } from '@/lib/templates';
import { OrbitMark } from '@/components/OrbitMark';
import classes from './StartMethodCards.module.css';

interface Props {
  creating: boolean;
  creatingBlank: boolean;
  importing?: boolean;
  onBlank: () => void;
  onTemplate: () => void;
  onOrbit: () => void;
  onImport: () => void;
}

 
export function StartMethodCards({
  creating,
  creatingBlank,
  importing = false,
  onBlank,
  onTemplate,
  onOrbit,
  onImport,
}: Props) {
  const methods = [
    {
      key: 'blank',
      tone: classes.toneBlank,
      icon: creatingBlank ? <Loader size={24} color="emerald" /> : <IconPlus size={24} />,
      title: 'Start from scratch',
      body: 'An empty form. Add the fields you want, in the order you want them.',
      onClick: onBlank,
    },
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
      body: `${formTemplates.length - 1} ready-made forms, previewed before you pick.`,
      onClick: onTemplate,
    },
    {
      key: 'import',
      tone: classes.toneImport,
      icon: importing ? <Loader size={24} color="emerald" /> : <IconClipboardCheck size={24} />,
      title: 'Import a config',
      body: 'Paste a config copied from another form — fields, theme and settings.',
      onClick: onImport,
    },
  ];

  return (
    <div className={classes.methodGrid}>
      {methods.map((method) => (
        <UnstyledButton
          key={method.key}
          className={classes.methodCard}
          onClick={method.onClick}
          disabled={creating}
        >
        
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
    </div>
  );
}
