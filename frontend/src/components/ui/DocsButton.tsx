import { ActionIcon, Tooltip } from '@mantine/core';
import { BookOpen } from 'lucide-react';
import { docsUrl } from '@/lib/docs';

interface Props {
  path: string;
  visibleFrom?: string;
}

export function DocsButton({ path, visibleFrom }: Props) {
  return (
    <Tooltip label="Docs" withArrow>
      <ActionIcon
        component="a"
        href={docsUrl(path)}
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
