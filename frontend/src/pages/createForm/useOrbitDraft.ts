import { useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { applyEditOps } from '@/lib/editOps';
import { generateFormDraft, requestFormEdit } from '@/lib/api';
import { isPlanLimit } from '@/lib/planLimit';
import type { GeneratedForm } from '@/lib/generatedForm';
import { fromGenerated, toSnapshot, withEdit } from './draft';
import type { Draft, Turn } from './types';

const FIELD_MS = 180;
const HANDOVER_TAIL_MS = 700;

export function useOrbitDraft(workspaceId: string) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  /** A photo of a form staged for the next run, as a data URL. */
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const template = useMemo(
    () => [...turns].reverse().find((t) => t.draft)?.draft ?? null,
    [turns]
  );

  const firstDraft = turns.filter((t) => t.draft).length <= 1;

  async function run(text?: string) {
    const asked = (typeof text === 'string' ? text : prompt).trim();
    const image = pendingImage;
    if ((!asked && !image) || generating) return;

    const first = turns.length === 0;
    if (first) setDrafting(asked || 'Reading the image…');

    setGenerating(true);
    setTurns((t) => [...t, { prompt: asked, draft: null }]);
    setPrompt('');
    setPendingImage(null);

    let next: Draft | null = null;

    try {
      if (image) {
        // An attached photo always goes through the generator, even on a
        // follow-up turn — the vision model reads the image once and, given
        // the current draft as JSON, edits it the same way a typed follow-up
        // would. The edit-ops path has no way to take an image at all.
        next = fromGenerated(
          await generateFormDraft(
            asked,
            workspaceId,
            template ? (toSnapshot(template) as unknown as GeneratedForm) : undefined,
            image
          )
        );
      } else if (template) {
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
      const streamed = (next?.fields.length ?? 0) * FIELD_MS;
      await new Promise((resolve) => setTimeout(resolve, streamed + HANDOVER_TAIL_MS));
      setDrafting(null);
    }
  }

  function reset() {
    setTurns([]);
    setPrompt('');
    setPendingImage(null);
    setDrafting(null);
  }

  return {
    turns,
    template,
    firstDraft,
    prompt,
    setPrompt,
    pendingImage,
    attachImage: setPendingImage,
    generating,
    drafting,
    run,
    reset,
  };
}
