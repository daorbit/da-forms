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
      icon: creatingBlank ? <Loader size={24} color="emerald" /> : <IconPlus size={24} />,
      title: 'Start from scratch',
      body: 'An empty form. Add the fields you want, in the order you want them.',
      onClick: onBlank,
    },
    {
      key: 'orbit',
      art: '/build-with-ai.png',
      icon: <OrbitMark size={24} />,
      title: 'Build with Orbit',
      body: 'Describe what you need. Orbit drafts the fields, wording and colours.',
      badge: 'Fastest',
      onClick: onOrbit,
    },
    {
      key: 'template',
      art: '/build-with-tempalte.png',
      icon: <IconLayoutGrid size={24} />,
      title: 'Start from a template',
      body: `${formTemplates.length - 1} ready-made forms, previewed before you pick.`,
      onClick: onTemplate,
    },
    {
      key: 'import',
      art: '/build-with-config.png',
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
        
          <span className={`${classes.cardHead} ${method.art ? classes.cardHeadArt : classes.toneBlank}`}>
            {/* Decorative only — the title below already names the option, so an
                alt string here would just repeat it to a screen reader. */}
            {method.art && <img src={method.art} alt="" className={classes.headArt} aria-hidden />}
            <span className={classes.headOverlay}>
              <span className={classes.headIcon}>{method.icon}</span>
              {method.badge && (
                <Badge size="xs" variant="filled" color="emerald" radius="sm">
                  {method.badge}
                </Badge>
              )}
            </span>
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
