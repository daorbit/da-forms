import { NumberInput, SegmentedControl, TextInput } from '@mantine/core';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import type {
  LabelPlacement,
  SubmitButtonSize,
  SubmitButtonWidth,
  SubmitButtonAlign,
  FormSchedule,
} from '@/types';
import { SettingsDrawer } from './settings/SettingsDrawer';
import { SettingsGroup, SettingRow, SwitchRow } from './settings/SettingsGroup';
import { SubmitButtonPreview } from './settings/SubmitButtonPreview';
import { toIso, toLocalInput } from './settings/dateInput';
import classes from './settings/settings.module.css';

export interface QuickSettings {
  hideHeader: boolean;
  labelPlacement: LabelPlacement;
  submitLabel: string;
  submitButtonSize: SubmitButtonSize;
  submitButtonWidth: SubmitButtonWidth;
  submitButtonAlign: SubmitButtonAlign;
  collectIp: boolean;
  requireCaptcha: boolean;
  collectPartials: boolean;
  allowEdit: boolean;
  schedule?: FormSchedule;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  settings: QuickSettings;
  onChange: (patch: Partial<QuickSettings>) => void;
  accentColor?: string;
}

export function QuickSettingsDrawer({ opened, onClose, settings, onChange, accentColor }: Props) {
  const schedule = settings.schedule ?? {};
  const setSchedule = (patch: Partial<FormSchedule>) => onChange({ schedule: { ...schedule, ...patch } });

  return (
    <SettingsDrawer
      opened={opened}
      onClose={onClose}
      title="Quick settings"
      subtitle="Changes apply to the form as you make them."
      icon={<IconAdjustmentsHorizontal size={18} stroke={1.7} />}
    >
      <SettingsGroup title="Layout">
        <SwitchRow
          label="Show form header"
          hint="The title and description above the first question."
          checked={!settings.hideHeader}
          onChange={(show) => onChange({ hideHeader: !show })}
        />
        <SettingRow label="Label position" hint="Where each question's label sits.">
          <SegmentedControl
            size="xs"
            value={settings.labelPlacement}
            onChange={(value) => onChange({ labelPlacement: value as LabelPlacement })}
            data={[
              { value: 'top', label: 'Top' },
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Submit button">
        <SettingRow stacked>
          <SubmitButtonPreview
            label={settings.submitLabel}
            size={settings.submitButtonSize}
            width={settings.submitButtonWidth}
            align={settings.submitButtonAlign}
            color={accentColor}
          />
        </SettingRow>
        <SettingRow label="Text">
          <TextInput
            size="xs"
            w={180}
            value={settings.submitLabel}
            placeholder="Submit"
            onChange={(e) => onChange({ submitLabel: e.target.value })}
            aria-label="Submit button text"
          />
        </SettingRow>
        <SettingRow label="Size">
          <SegmentedControl
            size="xs"
            value={settings.submitButtonSize}
            onChange={(value) => onChange({ submitButtonSize: value as SubmitButtonSize })}
            data={[
              { value: 'small', label: 'S' },
              { value: 'medium', label: 'M' },
              { value: 'large', label: 'L' },
            ]}
          />
        </SettingRow>
        <SettingRow label="Width">
          <SegmentedControl
            size="xs"
            value={String(settings.submitButtonWidth)}
            onChange={(value) => onChange({ submitButtonWidth: Number(value) as SubmitButtonWidth })}
            data={['25', '50', '75', '100'].map((v) => ({ value: v, label: `${v}%` }))}
          />
        </SettingRow>
        <SettingRow label="Alignment">
          <SegmentedControl
            size="xs"
            value={settings.submitButtonAlign}
            onChange={(value) => onChange({ submitButtonAlign: value as SubmitButtonAlign })}
            data={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Responses">
        <SwitchRow
          label="Save partial responses"
          hint="See where people drop off. Drafts are deleted after 30 days."
          checked={settings.collectPartials}
          onChange={(value) => onChange({ collectPartials: value })}
        />
        <SwitchRow
          label="Allow respondents to edit"
          hint="Adds an edit link to the confirmation email, valid for 7 days. Not available on paid forms."
          checked={settings.allowEdit}
          onChange={(value) => onChange({ allowEdit: value })}
        />
        <SwitchRow
          label="Record IP address"
          hint="Personal data in most regions. Mention it in your privacy notice."
          checked={settings.collectIp}
          onChange={(value) => onChange({ collectIp: value })}
        />
      </SettingsGroup>

      <SettingsGroup title="Spam protection">
        <SwitchRow
          label="Require captcha"
          hint="An invisible Cloudflare check before a response is accepted. Recommended for public or paid forms."
          checked={settings.requireCaptcha}
          onChange={(value) => onChange({ requireCaptcha: value })}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Availability"
        hint="Leave any field empty for no limit. Outside these limits, people see your closed message."
      >
        <SettingRow stacked>
          <div className={classes.fieldGrid}>
            <TextInput
              type="datetime-local"
              label="Opens"
              size="xs"
              value={toLocalInput(schedule.opensAt)}
              onChange={(e) => setSchedule({ opensAt: toIso(e.target.value) })}
            />
            <TextInput
              type="datetime-local"
              label="Closes"
              size="xs"
              value={toLocalInput(schedule.closesAt)}
              onChange={(e) => setSchedule({ closesAt: toIso(e.target.value) })}
            />
            <NumberInput
              className={classes.fieldFull}
              label="Response limit"
              size="xs"
              min={1}
              placeholder="No limit"
              value={schedule.maxSubmissions ?? ''}
              onChange={(value) => setSchedule({ maxSubmissions: typeof value === 'number' ? value : undefined })}
            />
            <TextInput
              className={classes.fieldFull}
              label="Closed message"
              size="xs"
              placeholder="This form is no longer accepting responses"
              value={schedule.closedMessage ?? ''}
              onChange={(e) => setSchedule({ closedMessage: e.target.value || undefined })}
            />
          </div>
        </SettingRow>
      </SettingsGroup>
    </SettingsDrawer>
  );
}
