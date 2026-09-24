import { useEffect, useRef, useState } from 'react';
import { Textarea, TextInput } from '@mantine/core';
import { IconCheck, IconCircleCheck, IconLink } from '@tabler/icons-react';
import { SettingsDrawer } from './settings/SettingsDrawer';
import { SettingsGroup, SettingRow } from './settings/SettingsGroup';
import { ChoiceCards } from './settings/ChoiceCards';
import classes from './settings/settings.module.css';

type Mode = 'message' | 'redirect';

interface Props {
  opened: boolean;
  onClose: () => void;
  thankYouMessage: string;
  redirectUrl: string;
  onThankYouChange: (value: string) => void;
  onRedirectChange: (value: string) => void;
}

const MODES = [
  { value: 'message' as const, label: 'Show a message', hint: 'Keep people on the form with a confirmation.' },
  { value: 'redirect' as const, label: 'Redirect to a URL', hint: 'Send people to a page on your own site.' },
];

const DEFAULT_MESSAGE = 'Thanks — that reached us.';

export function ThankYouDrawer({
  opened,
  onClose,
  thankYouMessage,
  redirectUrl,
  onThankYouChange,
  onRedirectChange,
}: Props) {
  const [mode, setMode] = useState<Mode>(redirectUrl ? 'redirect' : 'message');
  const lastUrl = useRef(redirectUrl);

  useEffect(() => {
    if (opened) setMode(redirectUrl ? 'redirect' : 'message');
  }, [opened]);

  const changeMode = (next: Mode) => {
    setMode(next);
    if (next === 'message') {
      if (redirectUrl) lastUrl.current = redirectUrl;
      onRedirectChange('');
    } else if (!redirectUrl && lastUrl.current) {
      onRedirectChange(lastUrl.current);
    }
  };

  const urlInvalid = Boolean(redirectUrl) && !/^https?:\/\//i.test(redirectUrl);

  return (
    <SettingsDrawer
      opened={opened}
      onClose={onClose}
      title="After submission"
      subtitle="What people see once they send the form."
      icon={<IconCircleCheck size={18} stroke={1.7} />}
    >
      <ChoiceCards ariaLabel="After submission" value={mode} onChange={changeMode} choices={MODES} />

      {mode === 'message' ? (
        <SettingsGroup title="Confirmation message">
          <SettingRow stacked>
            <Textarea
              value={thankYouMessage}
              placeholder={DEFAULT_MESSAGE}
              onChange={(e) => onThankYouChange(e.target.value)}
              autosize
              minRows={3}
              aria-label="Confirmation message"
            />
          </SettingRow>
          <SettingRow stacked>
            <div className={classes.previewLabel}>Preview</div>
            <div className={classes.thanksCard}>
              <span className={classes.thanksIcon}>
                <IconCheck size={20} stroke={3} />
              </span>
              <div className={classes.thanksText}>{thankYouMessage || DEFAULT_MESSAGE}</div>
            </div>
          </SettingRow>
        </SettingsGroup>
      ) : (
        <SettingsGroup title="Redirect" hint="People are sent here right after their response is saved.">
          <SettingRow stacked>
            <TextInput
              value={redirectUrl}
              placeholder="https://example.com/thanks"
              leftSection={<IconLink size={15} />}
              onChange={(e) => onRedirectChange(e.target.value)}
              error={urlInvalid ? 'Start the address with https://' : undefined}
              aria-label="Redirect URL"
              data-autofocus
            />
          </SettingRow>
        </SettingsGroup>
      )}
    </SettingsDrawer>
  );
}
