import { useState } from 'react';
import { Button, SegmentedControl, Skeleton, Stack, Textarea, TextInput } from '@mantine/core';
import { PlusIcon } from 'lucide-react';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { OrbitMark } from '@/components/OrbitMark';
import type { FormBuilderState } from '@/pages/formBuilder/useFormBuilderState';
import { MobileHeader } from './MobileHeader';
import { MobileFieldCard, type FieldCardActions } from './MobileFieldCard';
import classes from './mobileBuilder.module.css';

type Tab = 'edit' | 'preview';

interface Props {
  state: FormBuilderState;
  actions: FieldCardActions;
  isDemo: boolean;
  saving: boolean;
  publishing: boolean;
  onBack: () => void;
  onSave: () => void;
  onTogglePublish: () => void;
  onAddField: () => void;
  onAskAi: () => void;
}

export function MobileBuilder({ state, actions, isDemo, saving, publishing, onBack, onSave, onTogglePublish, onAddField, onAskAi }: Props) {
  const [tab, setTab] = useState<Tab>('edit');
  const live = state.savedForm?.status === 'published';

  return (
    <div className={classes.shell}>
      <MobileHeader
        name={state.name}
        live={live}
        isDemo={isDemo}
        isDirty={state.isDirty}
        hasSaved={Boolean(state.savedForm)}
        saving={saving}
        publishing={publishing}
        onBack={onBack}
        onSave={onSave}
        onTogglePublish={onTogglePublish}
      />

      <div className={classes.tabs}>
        <SegmentedControl
          fullWidth
          radius="xl"
          value={tab}
          onChange={(value) => setTab(value as Tab)}
          data={[
            { value: 'edit', label: 'Edit' },
            { value: 'preview', label: 'Preview' },
          ]}
        />
      </div>

      {tab === 'edit' ? (
        <main className={classes.content}>
          <section className={classes.intro}>
            <TextInput
              variant="unstyled"
              className={classes.titleInput}
              value={state.title}
              onChange={(e) => state.setTitle(e.currentTarget.value)}
              placeholder="Form title"
              aria-label="Form title"
            />
            <Textarea
              variant="unstyled"
              autosize
              minRows={1}
              className={classes.descriptionInput}
              value={state.description}
              onChange={(e) => state.setDescription(e.currentTarget.value)}
              placeholder="Add a description"
              aria-label="Form description"
            />
          </section>

          {state.loadingForm ? (
            <Stack gap="sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height={96} radius="lg" />
              ))}
            </Stack>
          ) : state.fields.length === 0 ? (
            <div className={classes.empty}>
              <p className={classes.emptyTitle}>No questions yet</p>
              <p className={classes.emptyBody}>Add your first question, or let Orbit draft the form for you.</p>
            </div>
          ) : (
            <div className={classes.list}>
              {state.fields.map((field, i) => (
                <MobileFieldCard
                  key={field.id}
                  field={field}
                  first={i === 0}
                  last={i === state.fields.length - 1}
                  {...actions}
                />
              ))}
            </div>
          )}
        </main>
      ) : (
        <main className={classes.preview}>
          <FormPage theme={state.theme} minHeight="100%">
            <FormRenderer
              title={state.title}
              description={state.description}
              fields={state.fields}
              hideHeader={state.hideHeader}
              headerAlign={state.headerAlign}
              labelPlacement={state.labelPlacement}
              submitLabel={state.submitLabel}
              submitButtonSize={state.submitButtonSize}
              submitButtonWidth={state.submitButtonWidth}
              submitButtonAlign={state.submitButtonAlign}
              theme={state.theme}
              steps={state.steps}
              stepIndicator={state.stepIndicator}
              showStepHeadings={state.showStepHeadings}
              oneQuestionAtATime={state.oneQuestionAtATime}
            />
          </FormPage>
        </main>
      )}

      {tab === 'edit' && (
        <footer className={classes.dock}>
          <Button radius="xl" size="md" leftSection={<PlusIcon size={17} />} className={classes.dockAdd} onClick={onAddField}>
            Add question
          </Button>
          <Button radius="xl" size="md" variant="default" leftSection={<OrbitMark size={18} />} onClick={onAskAi}>
            Orbit
          </Button>
        </footer>
      )}
    </div>
  );
}
