import { useEffect, useState } from 'react';
import { Alert, Button, Group, Stack, Text, Textarea } from '@mantine/core';
import { IconClipboard } from '@tabler/icons-react';
import classes from './createForm.module.css';

interface Props {
  importing: boolean;
  error: string | null;
  onErrorChange: (error: string | null) => void;
  onImport: (parsed: unknown) => void;
}

/**
 * Paste a config copied from another form.
 *
 * A single column rather than the two-pane shape the other ways in use: there
 * is nothing to preview until the config has been parsed, and a paste area is
 * the one thing on screen worth giving the width to.
 */
export function ImportPane({ importing, error, onErrorChange, onImport }: Props) {
  const [text, setText] = useState('');

  /**
   * Most people arrive here having just copied a config, so the clipboard is
   * read once on open. A refusal is not worth reporting — they can paste into
   * the field themselves, which is what the field is for.
   */
  useEffect(() => {
    navigator.clipboard
      ?.readText()
      .then((clip) => {
        if (clip.trim()) setText(clip);
      })
      .catch(() => {});
  }, []);

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) {
        setText(clip);
        onErrorChange(null);
      }
    } catch {
      /* No clipboard permission — they can paste into the field themselves. */
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      onErrorChange('That is not valid JSON — paste the whole config, including the braces.');
      return;
    }
    onImport(parsed);
  }

  return (
    <div className={classes.importPane}>
      <Stack gap="md" className={classes.importInner}>
        <Textarea
          label="Form config"
          description="The JSON copied from another form. Fields, layout, theme and settings travel; uploaded background images and webhook secrets do not."
          placeholder='{"kind":"da-forms/form-config", …}'
          value={text}
          onChange={(e) => {
            setText(e.currentTarget.value);
            onErrorChange(null);
          }}
          error={error}
          autosize
          minRows={10}
          maxRows={20}
          spellCheck={false}
          styles={{
            input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 },
          }}
          data-autofocus
          disabled={importing}
        />

        <Group gap="xs">
          <Button
            variant="light"
            color="gray"
            size="xs"
            leftSection={<IconClipboard size={14} />}
            onClick={pasteFromClipboard}
            disabled={importing}
          >
            Paste from clipboard
          </Button>
          {text && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => {
                setText('');
                onErrorChange(null);
              }}
              disabled={importing}
            >
              Clear
            </Button>
          )}
        </Group>

        {/* Payment fields keep the gateway they name, but the keys are the
            importing workspace's — worth saying before someone publishes a
            pasted checkout and wonders whose account it charges. */}
        <Alert color="gray" variant="light" radius="md">
          <Text size="xs">
            The form is imported as a draft. Payment fields keep their gateway, but charge
            through this workspace&apos;s own keys — connect it under Integrations before
            publishing.
          </Text>
        </Alert>

        <Group justify="flex-end">
          <Button
            color="emerald"
            onClick={submit}
            loading={importing}
            disabled={!text.trim()}
          >
            Import form
          </Button>
        </Group>
      </Stack>
    </div>
  );
}
