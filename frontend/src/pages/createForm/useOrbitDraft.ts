import { useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { applyEditOps } from '@/lib/editOps';
import { generateFormDraft, requestFormEdit } from '@/lib/api';
import { isPlanLimit } from '@/lib/planLimit';
import { fromGenerated, toSnapshot, withEdit } from './draft';
import type { Draft, Turn } from './types';

const HANDOVER_MS = 620;

export function useOrbitDraft(workspaceId: string) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);

  const template = useMemo(
    () => [...turns].reverse().find((t) => t.draft)?.draft ?? null,
    [turns]
  );

  const firstDraft = turns.filter((t) => t.draft).length <= 1;

  async function run(text?: string) {
    const asked = (typeof text === 'string' ? text : prompt).trim();
    if (!asked || generating) return;

    const first = turns.length === 0;
    if (first) setDrafting(asked);

    setGenerating(true);
    setTurns((t) => [...t, { prompt: asked, draft: null }]);
    setPrompt('');

    try {
      let next: Draft;

      if (template) {
        const { ops } = await requestFormEdit(asked, toSnapshot(template), workspaceId);
        const result = applyEditOps(ops, template.fields);

        if (!result.applied) {
          setTurns((t) => t.slice(0, -1));
          notifications.show({
            message: 'Orbit did not find anything to change',
            color: 'yellow',
          });
          return;
        }

        next = withEdit(template, result);
      } else {
        next = fromGenerated(await generateFormDraft(asked, workspaceId));
      }

      setTurns((t) => [...t.slice(0, -1), { prompt: asked, draft: next }]);
    } catch (err) {
      setTurns((t) => t.slice(0, -1));
      setDrafting(null);
      if (isPlanLimit(err)) return;
      notifications.show({
        message: err instanceof Error ? err.message : 'Could not generate a form',
        color: 'red',
      });
      return;
    } finally {
      setGenerating(false);
    }

    if (first) {
      await new Promise((resolve) => setTimeout(resolve, HANDOVER_MS));
      setDrafting(null);
    }
  }

  function reset() {
    setTurns([]);
    setPrompt('');
    setDrafting(null);
  }

  return {
    turns,
    template,
    firstDraft,
    prompt,
    setPrompt,
    generating,
    drafting,
    run,
    reset,
  };
}
