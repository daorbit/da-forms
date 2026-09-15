import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, CloseButton, Group, Modal, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { type DeviceId } from '@/components/builder/DeviceFrame';
import { formTemplates } from '@/lib/templates';
import { pickSuggestionChips } from '@/lib/formSuggestions';
import { Aurora } from './createForm/Aurora';
import { DraftingStage } from './createForm/DraftingStage';
import { HeroPane } from './createForm/HeroPane';
import { ImportPane } from './createForm/ImportPane';
import { OrbitThread } from './createForm/OrbitThread';
import { PreviewPane } from './createForm/PreviewPane';
import { TemplatePane } from './createForm/TemplatePane';
import { useFieldReveal } from './createForm/useFieldReveal';
import { useFormCreation } from './createForm/useFormCreation';
import { useOrbitDraft } from './createForm/useOrbitDraft';
import type { CreateMode, DeckCard, Scope } from './createForm/types';
import classes from './createForm/createForm.module.css';

export function CreateFormPage() {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [searchParams] = useSearchParams();

  const formName = searchParams.get('name')?.trim() || 'Untitled form';
  const scope: Scope = searchParams.get('scope') === 'card' ? 'card' : 'page';

  const [mode, setMode] = useState<CreateMode>('hero');
  const [device, setDevice] = useState<DeviceId>('macbook');
  const [pendingRestart, setPendingRestart] = useState(false);
  const [suggestions] = useState(() => pickSuggestionChips(3));

  const orbit = useOrbitDraft(workspaceId);
  const creation = useFormCreation({ workspaceId, formName, scope });

  const { shown, done } = useFieldReveal({
    total: orbit.template?.fields.length ?? 0,
    enabled: orbit.firstDraft,
  });

  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (orbit.template && done && !orbit.generating) setReady(true);
  }, [orbit.template, done, orbit.generating]);

  function backToList() {
    navigate(`/${workspaceId}/forms`);
  }

  function handleBack() {
    if (mode !== 'hero') {
      setMode('hero');
      return;
    }
    if (orbit.turns.length > 0) {
      setPendingRestart(true);
      return;
    }
    backToList();
  }

  const deck: DeckCard[] = [
    {
      key: 'blank',
      title: 'Start from scratch',
      body: 'A blank slate is all you need',
      onClick: creation.createBlank,
      busy: creation.creating,
    },
    {
      key: 'template',
      art: '/build-with-tempalte.webp',
      title: 'Use a template',
      body: `${formTemplates.length - 1} ready-made forms`,
      onClick: () => setMode('template'),
    },
    {
      key: 'import',
      art: '/build-with-config.webp',
      title: 'Import a config',
      body: 'Paste a config from another form',
      onClick: () => {
        creation.setImportError(null);
        setMode('import');
      },
    },
  ];

  const inWorkspace = orbit.turns.length > 0 && mode === 'hero' && !orbit.drafting;

  return (
    <>
      <Aurora
        building={orbit.generating || Boolean(orbit.drafting) || orbit.turns.length > 0}
      />

      <div className={classes.page}>
        <header className={classes.topbar}>
          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
            disabled={creation.creating || creation.importing || orbit.generating}
          >
            Back
          </Button>

          <Group gap={10}>
            {inWorkspace && (
              <Button
                color="emerald"
                radius="xl"
                onClick={() => orbit.template && creation.createFromDraft(orbit.template)}
                loading={creation.creating}
                disabled={!ready || orbit.generating}
                className={classes.createAction}
              >
                Create form
              </Button>
            )}
            <CloseButton size="lg" radius="xl" onClick={backToList} aria-label="Close" />
          </Group>
        </header>

        {mode === 'template' ? (
          <TemplatePane
            scope={scope}
            creating={creation.creating}
            onCreate={creation.createFromTemplate}
          />
        ) : mode === 'import' ? (
          <ImportPane
            importing={creation.importing}
            error={creation.importError}
            onErrorChange={creation.setImportError}
            onImport={creation.importConfig}
          />
        ) : orbit.drafting ? (
          <div className={classes.hero}>
            <DraftingStage prompt={orbit.drafting} draft={orbit.template} />
          </div>
        ) : orbit.turns.length > 0 ? (
          <div className={classes.build}>
            <OrbitThread
              turns={orbit.turns}
              generating={orbit.generating}
              prompt={orbit.prompt}
              onPromptChange={orbit.setPrompt}
              onSend={() => orbit.run()}
              pendingImage={orbit.pendingImage}
              onAttachImage={orbit.attachImage}
            />
            <PreviewPane
              template={orbit.template}
              shown={shown}
              done={done}
              generating={orbit.generating}
              device={device}
              onDeviceChange={setDevice}
            />
          </div>
        ) : (
          <HeroPane
            suggestions={suggestions}
            deck={deck}
            prompt={orbit.prompt}
            onPromptChange={orbit.setPrompt}
            onSend={() => orbit.run()}
            generating={orbit.generating}
            creating={creation.creating}
            pendingImage={orbit.pendingImage}
            onAttachImage={orbit.attachImage}
          />
        )}
      </div>

      <Modal
        opened={pendingRestart}
        onClose={() => setPendingRestart(false)}
        title="Start over?"
        centered
        radius="lg"
      >
        <Text size="sm">
          The form Orbit drafted will be discarded, and you&apos;ll go back to an empty
          prompt.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setPendingRestart(false)}>
            Keep it
          </Button>
          <Button
            color="red"
            onClick={() => {
              orbit.reset();
              setReady(false);
              setPendingRestart(false);
            }}
          >
            Discard and start over
          </Button>
        </Group>
      </Modal>
    </>
  );
}
