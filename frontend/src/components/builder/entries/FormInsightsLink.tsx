import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ActionIcon, Tooltip } from '@mantine/core';
import { ChartColumnIcon } from 'lucide-react';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { hostInsightsUrl, openHostInsights } from '@/lib/hostConnections';
import { rememberParam } from '@/hooks/useRememberedParams';

const LABEL = 'Insights';

export function FormInsightsLink({ workspaceId, formId }: { workspaceId: string; formId: string }) {
  if (IS_EMBEDDED) {
    const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      rememberParam('form', formId);
      openHostInsights(formId);
    };
    return (
      <Tooltip label={LABEL} withArrow>
        <ActionIcon
          component="a"
          href={hostInsightsUrl(formId)}
          target="_top"
          onClick={onClick}
          variant="default"
          size={36}
          radius="md"
          aria-label={LABEL}
        >
          <ChartColumnIcon size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={LABEL} withArrow>
      <ActionIcon
        component={Link}
        to={`/${workspaceId}/forms/analytics?form=${encodeURIComponent(formId)}`}
        variant="default"
        size={36}
        radius="md"
        aria-label={LABEL}
      >
        <ChartColumnIcon size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
