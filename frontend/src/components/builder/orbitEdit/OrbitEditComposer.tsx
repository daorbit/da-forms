import { ActionIcon, Textarea, Tooltip } from '@mantine/core';
import { ArrowUpIcon } from 'lucide-react';
import classes from './orbitEdit.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  disabled?: boolean;
}

export function OrbitEditComposer({ value, onChange, onSubmit, busy, disabled }: Props) {
  const empty = !value.trim();

  return (
    <div className={classes.composerWrap}>
      <div className={classes.composer}>
        <Textarea
          placeholder={disabled ? 'Read-only demo workspace' : 'Describe a change'}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          variant="unstyled"
          autosize
          minRows={1}
          maxRows={6}
          disabled={busy || disabled}
          data-autofocus
          classNames={{ input: classes.composerInput, wrapper: classes.composerInputWrapper }}
        />
        <div className={classes.composerFoot}>
          <span className={classes.composerHint}>Enter to send · Shift + Enter for a new line</span>
          <Tooltip label="Send" withArrow>
            <ActionIcon
              className={classes.send}
              radius="xl"
              size={30}
              disabled={empty || busy || disabled}
              onClick={onSubmit}
              aria-label="Send"
            >
              <ArrowUpIcon size={16} strokeWidth={2.4} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>
      <p className={classes.disclaimer}>Orbit edits the canvas directly — review before you publish.</p>
    </div>
  );
}
