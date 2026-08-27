import { useEffect, useRef, useState } from 'react';
import { Modal, Box } from '@mantine/core';
import type {
  FormField,
  FormStep,
  LabelPlacement,
  StepIndicator,
  SubmitButtonSize,
  SubmitButtonWidth,
  SubmitButtonAlign,
  FormTheme,
} from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { THEME_PRESETS } from '@/lib/themes';
import { useFitScale } from '@/hooks/useFitScale';
import { DeviceFrame, frameSize, type DeviceId } from './DeviceFrame';
import { PreviewTopbar } from './PreviewTopbar';
import { PreviewThemePanel } from './PreviewThemePanel';
import classes from './PreviewModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: FormField[];
  hideHeader?: boolean;
  headerAlign?: SubmitButtonAlign;
  labelPlacement?: LabelPlacement;
  submitLabel?: string;
  submitButtonSize?: SubmitButtonSize;
  submitButtonWidth?: SubmitButtonWidth;
  submitButtonAlign?: SubmitButtonAlign;
  theme?: FormTheme;
  steps?: FormStep[];
  stepIndicator?: StepIndicator;
  showStepHeadings?: boolean;
  /** Applies a preset's colors straight to the builder's theme state. */
  onApplyTheme?: (patch: Partial<FormTheme>) => void;
}

/**
 * Shows exactly what respondents see, rendered from the editor's current
 * state — so unsaved changes are previewable without a round trip.
 *
 * The page renders inside a hardware frame at the device's true CSS width and
 * is then scaled to fit the stage, rather than being squeezed into whatever
 * width the modal has: a phone layout has to stay a phone layout for the
 * preview to be worth trusting.
 */
export function PreviewModal({
  opened,
  onClose,
  title,
  description,
  fields,
  hideHeader,
  headerAlign,
  labelPlacement,
  submitLabel,
  submitButtonSize,
  submitButtonWidth,
  submitButtonAlign,
  theme,
  steps,
  stepIndicator,
  showStepHeadings,
  onApplyTheme,
}: Props) {
  const [device, setDevice] = useState<DeviceId>('macbook');
  const [panelOpen, setPanelOpen] = useState(true);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // A picked preset is previewed here only; Apply is what reaches the builder.
  useEffect(() => {
    if (!opened) setPickedId(null);
  }, [opened]);

  const size = frameSize(device);
  const scale = useFitScale(stageRef, {
    enabled: opened,
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 64, y: 64 },
  });

  // A preset is "current" when the theme still matches every color it sets.
  const currentPreset = THEME_PRESETS.find((p) =>
    (Object.keys(p.theme) as (keyof typeof p.theme)[]).every((k) => theme?.[k] === p.theme[k])
  );

  const picked = THEME_PRESETS.find((p) => p.id === pickedId);
  const shownTheme: FormTheme | undefined = picked
    ? { ...theme, ...picked.theme, scope: theme?.scope ?? 'page' }
    : theme;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 150 }}
      classNames={{ content: classes.content, inner: classes.inner }}
      styles={{
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <PreviewTopbar
        title={title}
        device={device}
        onDeviceChange={setDevice}
        pickedName={picked?.name}
        onApply={
          picked && onApplyTheme
            ? () => {
                onApplyTheme(picked.theme);
                setPickedId(null);
              }
            : undefined
        }
        onClose={onClose}
      />

      <Box className={classes.body}>
        {/* The stage always renders — it is what gets measured. The frame
            inside waits for that measurement, so it is never painted at full
            size before being scaled down to fit. */}
        <Box className={classes.stage} ref={stageRef}>
          {scale !== null && (
          <DeviceFrame device={device} scale={scale}>
            <FormPage theme={shownTheme} minHeight="100%">
              {/* Remounted per device so each preview starts from page one
                  with the initial values, at that device's layout. */}
              <FormRenderer
                key={`${device}-${opened}`}
                title={title}
                description={description}
                fields={fields}
                hideHeader={hideHeader}
                headerAlign={headerAlign}
                labelPlacement={labelPlacement}
                submitLabel={submitLabel}
                submitButtonSize={submitButtonSize}
                submitButtonWidth={submitButtonWidth}
                submitButtonAlign={submitButtonAlign}
                theme={shownTheme}
                steps={steps}
                stepIndicator={stepIndicator}
                showStepHeadings={showStepHeadings}
              />
            </FormPage>
          </DeviceFrame>
          )}
        </Box>

        {onApplyTheme && (
          <PreviewThemePanel
            open={panelOpen}
            onToggle={() => setPanelOpen((v) => !v)}
            selectedId={pickedId ?? currentPreset?.id}
            onSelect={(id) => setPickedId(id === pickedId ? null : id)}
          />
        )}
      </Box>
    </Modal>
  );
}
