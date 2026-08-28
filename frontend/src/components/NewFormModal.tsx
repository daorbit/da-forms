import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Button, Group, Stack, Text, SegmentedControl, Box, UnstyledButton, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { FormTheme } from '@/types';
import { formTemplates } from '@/lib/templates';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import { createForm } from '@/lib/api';
import { isPlanLimit } from '@/lib/planLimit';
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
  const defaultTemplateId = formTemplates.find((t) => t.id !== 'blank')?.id ?? formTemplates[0].id;
  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [creating, setCreating] = useState(false);

  const [device, setDevice] = useState<DeviceId>('macbook');

  const activeTemplate = formTemplates.find((t) => t.id === templateId) ?? formTemplates[0];

  // The frame renders at the device's true CSS width and is scaled down to
  // whatever room the modal leaves, so the layout inside is the real one.
  const size = frameSize(device);
  // Generous padding because the laptop's base sticks out past its lid on both
  // sides and its foot sits below the chassis: a fit that leaves no margin puts
  // those against the stage's edge, where `overflow: hidden` shears them off.
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 96, y: 72 },
  });

  function reset() {
    setStep(1);
    setName('');
    setScope('page');
    setTemplateId(defaultTemplateId);
    setDevice('macbook');
    setCreating(false);
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

  async function handleCreate(template: (typeof formTemplates)[number] = activeTemplate) {
    const title = name.trim();
    if (!title) return;
    setCreating(true);
    try {
      const form = await createForm(
        {
          name: title,
          title,
          description: template.formDescription,
          fields: template.fields,
          hideHeader: template.hideHeader,
          submitLabel: template.submitLabel,
          theme: template.theme ?? { scope },
          steps: template.steps,
          stepIndicator: template.stepIndicator,
          showStepHeadings: template.showStepHeadings,
        },
        workspaceId
      );
      reset();
      onClose();
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setCreating(false);
      // A plan cap already opened the upgrade dialog on its way out of the API
      // layer. A red toast under it would read as a second, separate failure.
      if (isPlanLimit(err)) {
        handleClose();
        return;
      }
      notifications.show({ message: 'Could not create form', color: 'red' });
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={step === 1 ? 'Create a new form' : 'Choose a starting point'}
      centered
      // A fixed 960 left the preview cramped on a large screen and overflowing
      // on a small one. The picker step tracks the viewport with a ceiling, so
      // a long template (RSVP, feedback survey) is readable without scrolling
      // the modal itself.
      size={step === 2 ? 'min(1180px, 94vw)' : 'md'}
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
                    onClick={() => {
                      setTemplateId(tpl.id);
                      handleCreate(tpl);
                    }}
                    disabled={creating}
                    className={`${classes.templateItem} ${classes.blankItem} ${tpl.id === templateId ? classes.templateItemActive : ''}`}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {creating && templateId === tpl.id ? (
                      <Loader size="sm" color="emerald" />
                    ) : (
                      <IconPlus size={20} color="var(--mantine-color-emerald-6)" />
                    )}
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

            {activeTemplate.id !== 'blank' && (
              <Box className={classes.previewPane}>
                {/* A thin bar of its own rather than floating over the stage,
                    where it collided with the modal's close button and its
                    tooltip opened off the top edge. */}
                <Box className={classes.previewBar}>
                  <DeviceSwitch device={device} onChange={setDevice} />
                </Box>

                <Box className={classes.stage} ref={stageRef}>
                  <DeviceFrame device={device} scale={scale} hidden={!measured}>
                    <FormPage theme={activeTemplate.theme} minHeight="100%">
                      {/* Remounted per device so each preview starts from page
                          one at that device's layout. */}
                      <FormRenderer
                        key={`${activeTemplate.id}-${device}`}
                        title={activeTemplate.title}
                        description={activeTemplate.formDescription}
                        fields={activeTemplate.fields}
                        theme={activeTemplate.theme}
                        submitLabel={activeTemplate.submitLabel}
                        hideHeader={activeTemplate.hideHeader}
                      />
                    </FormPage>
                  </DeviceFrame>
                </Box>
              </Box>
            )}
          </Box>

          <Group justify="space-between">
            <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Group>
              <Button variant="default" onClick={handleClose} disabled={creating}>
                Cancel
              </Button>
              <Button color="emerald" onClick={() => handleCreate()} loading={creating}>
                Create form
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
