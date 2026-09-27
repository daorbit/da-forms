import { ActionIcon, Tooltip } from '@mantine/core';
import { BookOpen } from 'lucide-react';

const DOCS_BASE = 'https://quantalog.daorbit.in/docs';

interface Props {
  path: string;
  visibleFrom?: string;
}

export function DocsButton({ path, visibleFrom }: Props) {
  return (
    <Tooltip label="Docs" withArrow>
      <ActionIcon
        component="a"
        href={`${DOCS_BASE}${path}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="default"
        size="lg"
        radius="md"
        aria-label="Docs"
        visibleFrom={visibleFrom}
      >
        <BookOpen size={17} />
      </ActionIcon>
    </Tooltip>
  );
}
