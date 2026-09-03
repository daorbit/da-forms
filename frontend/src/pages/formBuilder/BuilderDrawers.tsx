import { Modal, Button, Group, Text } from '@mantine/core';
import type { FormField, FormTheme, PaymentSettings } from '@/types';
import type { RailPanel } from '@/components/builder/IconRail';
import type { CurrentFormSnapshot } from '@/components/builder/AiEditDrawer';
import type { GeneratedForm } from '@/lib/generatedForm';
import { PropertiesDrawer } from '@/components/builder/PropertiesDrawer';
import { FormSettings } from '@/components/builder/FormSettings';
import { AiEditDrawer } from '@/components/builder/AiEditDrawer';
import { QuickSettingsDrawer } from '@/components/builder/QuickSettingsDrawer';
import { ThemeDrawer } from '@/components/builder/ThemeDrawer';
import { StepsDrawer } from '@/components/builder/StepsDrawer';
import { ThankYouDrawer } from '@/components/builder/ThankYouDrawer';
import { NotificationsModal } from '@/components/builder/NotificationsModal';
import { PaymentsModal } from '@/components/builder/PaymentsModal';
import { PreviewModal } from '@/components/builder/PreviewModal';
import { ShareModal } from '@/components/share/ShareModal';
import type { FormBuilderState } from './useFormBuilderState';

interface Props {
  state: FormBuilderState;
  workspaceId: string;
  isDemo: boolean;
  editingField: FormField | null;
  paymentSettings: PaymentSettings | null;
  railPanel: RailPanel | null;
  setRailPanel: React.Dispatch<React.SetStateAction<RailPanel | null>>;
  formSettingsOpen: boolean;
  setFormSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shareOpen: boolean;
  setShareOpen: React.Dispatch<React.SetStateAction<boolean>>;
  previewOpen: boolean;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pendingLeave: boolean;
  setPendingLeave: React.Dispatch<React.SetStateAction<boolean>>;
  onLeave: () => void;
  updateField: (id: string, patch: Partial<FormField>) => void;
  aiSnapshot: CurrentFormSnapshot;
  applyAiRevision: (form: GeneratedForm) => void;
}

/**
 * Every drawer and modal that hangs off the builder: field properties, form
 * settings, the icon-rail panels (AI, quick settings, theme, steps, thank-you,
 * notifications, payments), preview, share, and the leave-without-saving
 * prompt. Kept together so the page component reads as structure, not a wall of
 * props.
 */
export function BuilderDrawers({
  state,
  workspaceId,
  isDemo,
  editingField,
  paymentSettings,
  railPanel,
  setRailPanel,
  formSettingsOpen,
  setFormSettingsOpen,
  shareOpen,
  setShareOpen,
  previewOpen,
  setPreviewOpen,
  pendingLeave,
  setPendingLeave,
  onLeave,
  updateField,
  aiSnapshot,
  applyAiRevision,
}: Props) {
  const setTheme = (patch: Partial<FormTheme>) =>
    state.setTheme((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <PropertiesDrawer
        field={editingField}
        allFields={state.fields}
        onClose={() => state.setEditingId(null)}
        onChange={updateField}
        paymentSettings={paymentSettings}
        onOpenPaymentSettings={() => {
          state.setEditingId(null);
          setRailPanel('payments');
        }}
      />

      <FormSettings
        opened={formSettingsOpen}
        onClose={() => setFormSettingsOpen(false)}
        title={state.title}
        description={state.description}
        hideHeader={state.hideHeader}
        headerAlign={state.headerAlign}
        onTitleChange={state.setTitle}
        onDescriptionChange={state.setDescription}
        onHideHeaderChange={state.setHideHeader}
        onHeaderAlignChange={state.setHeaderAlign}
      />

      <AiEditDrawer
        opened={railPanel === 'ai'}
        onClose={() => setRailPanel(null)}
        workspaceId={workspaceId}
        snapshot={aiSnapshot}
        onApply={applyAiRevision}
        disabled={isDemo}
      />

      <QuickSettingsDrawer
        opened={railPanel === 'quickSettings'}
        onClose={() => setRailPanel(null)}
        settings={{
          hideHeader: state.hideHeader,
          labelPlacement: state.labelPlacement,
          submitLabel: state.submitLabel,
          submitButtonSize: state.submitButtonSize,
          submitButtonWidth: state.submitButtonWidth,
          submitButtonAlign: state.submitButtonAlign,
          collectIp: state.collectIp,
          requireCaptcha: state.requireCaptcha,
          collectPartials: state.collectPartials,
          allowEdit: state.allowEdit,
          schedule: state.schedule,
        }}
        onChange={(patch) => {
          if (patch.hideHeader !== undefined) state.setHideHeader(patch.hideHeader);
          if (patch.labelPlacement) state.setLabelPlacement(patch.labelPlacement);
          if (patch.submitLabel !== undefined) state.setSubmitLabel(patch.submitLabel);
          if (patch.submitButtonSize) state.setSubmitButtonSize(patch.submitButtonSize);
          if (patch.submitButtonWidth) state.setSubmitButtonWidth(patch.submitButtonWidth);
          if (patch.submitButtonAlign) state.setSubmitButtonAlign(patch.submitButtonAlign);
          if (patch.collectIp !== undefined) state.setCollectIp(patch.collectIp);
          if (patch.requireCaptcha !== undefined) state.setRequireCaptcha(patch.requireCaptcha);
          if (patch.collectPartials !== undefined) state.setCollectPartials(patch.collectPartials);
          if (patch.allowEdit !== undefined) state.setAllowEdit(patch.allowEdit);
          // Not guarded on `undefined`: clearing every date is a real edit, and
          // the drawer sends the whole schedule object each time.
          if ('schedule' in patch) state.setSchedule(patch.schedule);
        }}
      />

      <ThemeDrawer
        opened={railPanel === 'theme'}
        onClose={() => setRailPanel(null)}
        theme={state.theme}
        onChange={setTheme}
      />

      <StepsDrawer
        opened={railPanel === 'steps'}
        onClose={() => setRailPanel(null)}
        fields={state.fields}
        settings={{
          steps: state.steps,
          stepIndicator: state.stepIndicator,
          showStepHeadings: state.showStepHeadings,
        }}
        accent={state.theme.accentColor}
        onChange={(patch) => {
          if (patch.steps) state.setSteps(patch.steps);
          if (patch.stepIndicator) state.setStepIndicator(patch.stepIndicator);
          if (patch.showStepHeadings !== undefined)
            state.setShowStepHeadings(patch.showStepHeadings);
        }}
      />

      <ThankYouDrawer
        opened={railPanel === 'thankYou'}
        onClose={() => setRailPanel(null)}
        thankYouMessage={state.thankYouMessage}
        redirectUrl={state.redirectUrl}
        onThankYouChange={state.setThankYouMessage}
        onRedirectChange={state.setRedirectUrl}
      />

      <NotificationsModal
        opened={railPanel === 'notifications'}
        onClose={() => setRailPanel(null)}
        formTitle={state.title}
        fields={state.fields}
        theme={state.theme}
        notifications={state.emailNotifications}
        onChange={(patch) => state.setEmailNotifications((prev) => ({ ...prev, ...patch }))}
      />

      <PaymentsModal
        opened={railPanel === 'payments'}
        onClose={() => setRailPanel(null)}
        workspaceId={workspaceId}
        // One URL for the whole workspace — registered once in Razorpay,
        // covering every paid form. Available before the form is even saved.
        webhookUrl={`${
          import.meta.env.VITE_API_URL ?? `${window.location.origin}/api`
        }/public/workspaces/${workspaceId}/payments/webhook`}
      />

      <PreviewModal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
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
        onApplyTheme={setTheme}
      />

      {state.savedForm && (
        <ShareModal
          opened={shareOpen}
          onClose={() => setShareOpen(false)}
          form={state.savedForm}
          onStatusChange={(status) =>
            state.savedForm && state.setSavedForm({ ...state.savedForm, status })
          }
        />
      )}

      <Modal
        opened={pendingLeave}
        onClose={() => setPendingLeave(false)}
        title="Leave without saving?"
        centered
        radius="lg"
      >
        <Text size="sm">You have unsaved changes. If you leave now, they'll be lost.</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setPendingLeave(false)}>
            Stay
          </Button>
          <Button color="red" onClick={onLeave}>
            Leave without saving
          </Button>
        </Group>
      </Modal>
    </>
  );
}
