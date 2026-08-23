import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Button, Group, Stack, Text, SegmentedControl, Box, ScrollArea, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { FormTheme } from '@/types';
import { formTemplates } from '@/lib/formTemplates';
import { FormRenderer } from '@/components/FormRenderer';
import classes from './NewFormModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function NewFormModal({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<NonNullable<FormTheme['scope']>>('page');
  const [templateId, setTemplateId] = useState(formTemplates[0].id);

  const activeTemplate = formTemplates.find((t) => t.id === templateId) ?? formTemplates[0];

  function reset() {
    setStep(1);
    setName('');
    setScope('page');
    setTemplateId(formTemplates[0].id);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  }

  function handleCreate() {
    const title = name.trim();
    if (!title) return;
    navigate(`/${workspaceId}/forms/new`, {
      state: {
        title,
        themeScope: activeTemplate.theme?.scope ?? scope,
        templateFields: activeTemplate.fields,
        templateDescription: activeTemplate.formDescription,
        templateTheme: activeTemplate.theme,
        templateSubmitLabel: activeTemplate.submitLabel,
        templateHideHeader: activeTemplate.hideHeader,
      },
    });
    reset();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={step === 1 ? 'Create a new form' : 'Choose a starting point'}
      centered
      size={step === 2 ? 960 : 'md'}
      radius="lg"
      styles={step === 2 ? { body: { overflow: 'hidden' } } : undefined}
    >
      {step === 1 ? (
        <form onSubmit={handleContinue}>
          <Stack gap="md">
            <TextInput
              label="Form name"
              placeholder="Client Details"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-autofocus
              required
            />

            <div>
              <Text size="sm" fw={500} mb={4}>
                Where will this form live?
              </Text>
              <Text size="xs" c="dimmed" mb={8}>
                Changes what theming applies to later — the page background only matters for a
                standalone share link.
              </Text>
              <SegmentedControl
                fullWidth
                value={scope}
                onChange={(value) => setScope(value as NonNullable<FormTheme['scope']>)}
                data={[
                  { value: 'page', label: 'Standalone link' },
                  { value: 'card', label: 'Embedded on a site' },
                ]}
              />
            </div>

            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" color="emerald" disabled={!name.trim()}>
                Continue
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Stack gap="md">
          <Box className={classes.stepBody}>
            <div className={classes.templateList}>
              {formTemplates.map((tpl) =>
                tpl.id === 'blank' ? (
                  <UnstyledButton
                    key={tpl.id}
                    onClick={() => setTemplateId(tpl.id)}
                    className={`${classes.templateItem} ${classes.blankItem} ${tpl.id === templateId ? classes.templateItemActive : ''}`}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <IconPlus size={20} color="var(--mantine-color-emerald-6)" />
                    <Text size="sm" fw={600}>
                      {tpl.name}
                    </Text>
                  </UnstyledButton>
                ) : (
                  <UnstyledButton
                    key={tpl.id}
                    onClick={() => setTemplateId(tpl.id)}
                    className={`${classes.templateItem} ${tpl.id === templateId ? classes.templateItemActive : ''}`}
                    style={{ display: 'block', width: '100%', textAlign: 'left', boxSizing: 'border-box' }}
                  >
                    <Text size="sm" fw={600}>
                      {tpl.name}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {tpl.description}
                    </Text>
                  </UnstyledButton>
                )
              )}
            </div>

            <ScrollArea className={classes.previewPane} type="auto">
              <Box
                className={`da-forms-light-surface ${classes.previewInner}`}
                data-mantine-color-scheme="light"
                style={{ backgroundColor: activeTemplate.theme?.pageBg ?? 'var(--mantine-color-gray-1)' }}
              >
                <Box className={classes.previewCard}>
                  <FormRenderer
                    key={activeTemplate.id}
                    title={activeTemplate.title}
                    description={activeTemplate.formDescription}
                    fields={activeTemplate.fields}
                    theme={activeTemplate.theme}
                    submitLabel={activeTemplate.submitLabel}
                    hideHeader={activeTemplate.hideHeader}
                  />
                </Box>
              </Box>
            </ScrollArea>
          </Box>

          <Group justify="space-between">
            <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Group>
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button color="emerald" onClick={handleCreate}>
                Create form
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
