import { ActionIcon, CopyButton, Tooltip } from '@mantine/core';
import { CheckIcon, CopyIcon } from 'lucide-react';

interface Props {
  value: string;
  label?: string;
  className?: string;
}

export function CopyAction({ value, label = 'Copy', className }: Props) {
  return (
    <CopyButton value={value} timeout={1400}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : label} withArrow openDelay={250}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={24}
            radius="md"
            className={className}
            onClick={(e) => {
              e.stopPropagation();
              copy();
            }}
            aria-label={label}
          >
            {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}
