import { useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { SquarePenIcon } from 'lucide-react';
import { OrbitMark } from '@/components/OrbitMark';
import { PanelDrawer } from '@/components/ui/PanelDrawer';
import panel from '@/components/ui/PanelDrawer.module.css';
import { requestFormEdit } from '@/lib/api';
import type { EditOp, EditSnapshot } from '@/lib/editOps';
import { isPlanLimit } from '@/lib/planLimit';
import { notify } from '@/lib/notify';
import { OrbitEditIntro } from './orbitEdit/OrbitEditIntro';
import { OrbitEditThread } from './orbitEdit/OrbitEditThread';
import { OrbitEditComposer } from './orbitEdit/OrbitEditComposer';
import { themeColorsOf, type OrbitEditTurn } from './orbitEdit/turns';

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  snapshot: EditSnapshot;
  onApply: (ops: EditOp[]) => number;
  disabled?: boolean;
}

export function AiEditDrawer({ opened, onClose, workspaceId, snapshot, onApply, disabled }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<OrbitEditTurn[]>([]);

  async function run(text?: string) {
    const asked = (text ?? prompt).trim();
    if (!asked || busy || disabled) return;

    setBusy(true);
    setPrompt('');
    setTurns((t) => [...t, { prompt: asked }]);
    try {
      const { ops, summary } = await requestFormEdit(asked, snapshot, workspaceId);
      const changes = onApply(ops);
      const themeColors = themeColorsOf(ops);
      setTurns((t) => [...t.slice(0, -1), { prompt: asked, changes, summary, themeColors }]);
    } catch (err) {
      setTurns((t) => t.slice(0, -1));
      setPrompt(asked);
      if (isPlanLimit(err)) {
        onClose();
        return;
      }
      notify.error(err instanceof Error ? err.message : 'Could not revise the form');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelDrawer
      opened={opened}
      onClose={onClose}
      size={440}
      bare
      title="Orbit"
      ariaLabel="Edit with Orbit"
      icon={<OrbitMark size={24} />}
      iconVariant="plain"
      headerActions={
        turns.length > 0 && (
          <Tooltip label="New chat" withArrow>
            <ActionIcon
              variant="subtle"
              size={30}
              radius="xl"
              className={panel.headerButton}
              onClick={() => setTurns([])}
              disabled={busy}
              aria-label="New chat"
            >
              <SquarePenIcon size={15} />
            </ActionIcon>
          </Tooltip>
        )
      }
    >
      {turns.length === 0 ? (
        <OrbitEditIntro disabled={disabled} onPick={run} />
      ) : (
        <OrbitEditThread turns={turns} busy={busy} />
      )}

      <OrbitEditComposer value={prompt} onChange={setPrompt} onSubmit={() => run()} busy={busy} disabled={disabled} />
    </PanelDrawer>
  );
}
