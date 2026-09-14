import { Badge, Loader, Text, UnstyledButton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { formTemplates } from '@/lib/templates';
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
  const artMethods = [
    {
      key: 'orbit',
      art: '/build-with-ai.webp',
      title: 'Build with Orbit',
      body: 'Describe what you need. Orbit drafts the fields, wording and colours.',
      badge: 'Fastest',
      onClick: onOrbit,
    },
    {
      key: 'template',
      art: '/build-with-tempalte.webp',
      title: 'Start from a template',
      body: `${formTemplates.length - 1} ready-made forms, previewed before you pick.`,
      onClick: onTemplate,
    },
    {
      key: 'import',
      art: '/build-with-config.webp',
      title: 'Import a config',
      body: 'Paste a config copied from another form — fields, theme and settings.',
      onClick: onImport,
    },
  ];

  return (
    <div className={classes.methodGrid}>
      {/* Blank option has no render — just a drop-zone: dotted border, plus,
          title, nothing else. It doesn't share the art cards' head/body split. */}
      <UnstyledButton
        className={classes.blankCard}
        onClick={onBlank}
        disabled={creating}
      >
        {creatingBlank ? <Loader size={22} color="emerald" /> : <IconPlus size={22} />}
        <Text fw={600} size="sm">
          Start from scratch
        </Text>
      </UnstyledButton>

      {artMethods.map((method) => (
        <UnstyledButton
          key={method.key}
          className={classes.methodCard}
          onClick={method.onClick}
          disabled={creating}
        >
          <span className={classes.cardHead}>
            <img src={method.art} alt="" className={classes.headArt} aria-hidden />
          </span>

          <span className={classes.cardBody}>
            <span className={classes.cardBodyTitle}>
              <Text fw={600} size="sm">
                {method.title}
              </Text>
              {method.badge && (
                <Badge size="xs" variant="filled" color="emerald" radius="sm">
                  {method.badge}
                </Badge>
              )}
              {method.key === 'import' && importing && <Loader size={14} color="emerald" />}
            </span>
            <Text size="xs" c="dimmed" mt={4}>
              {method.body}
            </Text>
          </span>
        </UnstyledButton>
      ))}
    </div>
  );
}
