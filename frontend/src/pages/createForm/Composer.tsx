import { ActionIcon, Button, Text, Textarea, Tooltip } from '@mantine/core';
import { IconArrowUp } from '@tabler/icons-react';
import classes from './createForm.module.css';

interface Props {
  compact: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  busy: boolean;
  editing: boolean;
}

export function Composer({ compact, value, onChange, onSend, busy, editing }: Props) {
  const empty = !value.trim();

  return (
    <div className={compact ? classes.composerCompact : classes.composer}>
      <Textarea
        id={compact ? undefined : 'create-prompt'}
        placeholder={
          editing ? 'Ask for a change — “add a phone field”' : 'Describe the form you need'
        }
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        variant="unstyled"
        autosize
        minRows={compact ? 1 : 3}
        maxRows={compact ? 4 : 8}
        px={compact ? 'sm' : 'md'}
        pt={compact ? 6 : 'sm'}
        disabled={busy}
        data-autofocus={compact ? undefined : true}
        styles={{ input: { fontSize: compact ? 13 : 15, lineHeight: 1.55 } }}
      />

      <div className={classes.composerFoot}>
        <Text size="xs" c="dimmed">
          {busy ? 'Orbit is working…' : 'Enter to send'}
        </Text>

        {compact ? (
          <Tooltip label="Apply change" withArrow>
            <ActionIcon
              variant={empty ? 'subtle' : 'filled'}
              color={empty ? 'gray' : 'emerald'}
              radius="xl"
              size="sm"
              disabled={empty || busy}
              onClick={onSend}
              aria-label="Apply change"
            >
              <IconArrowUp size={13} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            color="emerald"
            radius="xl"
            size="sm"
            leftSection={<IconArrowUp size={15} />}
            disabled={empty || busy}
            loading={busy}
            onClick={onSend}
          >
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
