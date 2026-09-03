import type {
  FormField,
  FormStep,
  StepIndicator,
  LabelPlacement,
  SubmitButtonSize,
  SubmitButtonWidth,
  SubmitButtonAlign,
  FormTheme,
  NotificationSettings,
  FormSchedule,
} from '@/types';

/**
 * Every editable field of a form, gathered into one object.
 *
 * This is the shape the undo history snapshots and restores, and the shape the
 * save payload is built from — keeping it in one place is what stops the two
 * drifting apart.
 */
export interface EditableState {
  name: string;
  title: string;
  description: string;
  fields: FormField[];
  redirectUrl: string;
  thankYouMessage: string;
  hideHeader: boolean;
  headerAlign: SubmitButtonAlign;
  labelPlacement: LabelPlacement;
  submitLabel: string;
  submitButtonSize: SubmitButtonSize;
  submitButtonWidth: SubmitButtonWidth;
  submitButtonAlign: SubmitButtonAlign;
  theme: FormTheme;
  steps: FormStep[];
  stepIndicator: StepIndicator;
  showStepHeadings: boolean;
  collectIp: boolean;
  requireCaptcha: boolean;
  collectPartials: boolean;
  allowEdit: boolean;
  schedule?: FormSchedule;
  notifications: NotificationSettings;
}
