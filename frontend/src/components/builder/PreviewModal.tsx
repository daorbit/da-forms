import { useEffect, useState } from 'react';
import { Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { PaletteIcon } from 'lucide-react';
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
import { StudioModal, studioClasses } from '@/components/studio/StudioModal';
import { StudioTopbar } from '@/components/studio/StudioTopbar';
import { THEME_PRESETS, matchesPreset, presetPatch } from '@/lib/themes';
import { useFitScale } from '@/hooks/useFitScale';
import { DeviceFrame, frameSize, type DeviceId } from './DeviceFrame';
import { DeviceSwitch } from './DeviceSwitch';
import { PreviewThemePanel } from './PreviewThemePanel';
import { PreviewApplyBar } from './PreviewApplyBar';

const PHONE_QUERY = '(max-width: 48em)';

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
  onApplyTheme?: (patch: Partial<FormTheme>) => void;
}

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
  const phone = useMediaQuery(PHONE_QUERY) ?? false;
  const [device, setDevice] = useState<DeviceId>('macbook');
  const [panelOpen, setPanelOpen] = useState(() => !window.matchMedia?.(PHONE_QUERY).matches);
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) setPickedId(null);
  }, [opened]);

  const size = frameSize(device);
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 80, y: 88 },
  });

  const currentPreset = THEME_PRESETS.find((p) => matchesPreset(theme, p));

  const picked = THEME_PRESETS.find((p) => p.id === pickedId);
  const shownTheme: FormTheme | undefined = picked
    ? { ...theme, ...presetPatch(picked), scope: theme?.scope ?? 'page' }
    : theme;
  const showThemes = Boolean(onApplyTheme) && panelOpen;

  const applyBar = picked && onApplyTheme && (
    <PreviewApplyBar
      preset={picked}
      onReset={() => setPickedId(null)}
      onApply={() => {
        onApplyTheme(presetPatch(picked));
        setPickedId(null);
      }}
    />
  );

  const page = (
    <FormPage theme={shownTheme} minHeight="100%">
      <FormRenderer
        key={`${phone ? 'phone' : device}-${opened}`}
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
  );

  return (
    <StudioModal opened={opened} onClose={onClose}>
      <StudioTopbar
        title={title || 'Untitled form'}
        subtitle="Preview"
        onClose={onClose}
        center={<DeviceSwitch device={device} onChange={setDevice} />}
        actions={
          onApplyTheme && (
            <Button
              variant="transparent"
              className={studioClasses.pillButton}
              data-active={panelOpen || undefined}
              leftSection={<PaletteIcon size={15} />}
              onClick={() => setPanelOpen((v) => !v)}
            >
              Themes
            </Button>
          )
        }
      />

      <div className={studioClasses.body}>
        {phone ? (
          <div className={studioClasses.stageScroll}>
            {page}
            {applyBar}
          </div>
        ) : (
          <div className={studioClasses.stage} ref={stageRef}>
            <DeviceFrame device={device} scale={scale} hidden={!measured}>
              {page}
            </DeviceFrame>
            {applyBar}
          </div>
        )}

        {showThemes && (
          <PreviewThemePanel
            selectedId={pickedId ?? currentPreset?.id}
            onSelect={(id) => setPickedId(id === pickedId ? null : id)}
          />
        )}
      </div>
    </StudioModal>
  );
}
