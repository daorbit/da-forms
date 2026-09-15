import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react';
import { ActionIcon, Button, Text, Textarea, Tooltip } from '@mantine/core';
import { IconArrowUp, IconPhotoPlus, IconX } from '@tabler/icons-react';
import classes from './createForm.module.css';

interface Props {
  compact: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  busy: boolean;
  editing: boolean;
  /** A form photo staged for the next send, as a data URL. */
  pendingImage: string | null;
  /** Stage or clear the photo for the next send. */
  onAttachImage: (dataUrl: string | null) => void;
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

export function Composer({
  compact,
  value,
  onChange,
  onSend,
  busy,
  editing,
  pendingImage,
  onAttachImage,
}: Props) {
  const empty = !value.trim() && !pendingImage;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  /**
   * Read a dropped, pasted or picked file into the data URL the composer
   * stages. A courtesy check, not the guard — the server rejects anything
   * past its own size and type ceiling regardless of what got this far.
   */
  const acceptImage = (file: File | undefined | null) => {
    if (!file) return;
    setImageError(null);

    if (!file.type.startsWith('image/')) {
      setImageError("That isn't an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('That image is too large — 6MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onAttachImage(reader.result);
    };
    reader.onerror = () => setImageError("Couldn't read that image.");
    reader.readAsDataURL(file);
  };

  const onFilePicked = (e: ChangeEvent<HTMLInputElement>) => {
    acceptImage(e.currentTarget.files?.[0]);
    e.currentTarget.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    acceptImage(e.dataTransfer.files?.[0]);
  };

  const onPaste = (e: ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'));
    if (file) acceptImage(file);
  };

  return (
    <div
      className={compact ? classes.composerCompact : classes.composer}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {pendingImage && (
        <div className={classes.imageChip}>
          <img src={pendingImage} alt="Attached form" />
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xs"
            radius="xl"
            onClick={() => onAttachImage(null)}
            aria-label="Remove attached image"
          >
            <IconX size={12} />
          </ActionIcon>
        </div>
      )}
      <Textarea
        id={compact ? undefined : 'create-prompt'}
        placeholder={
          editing
            ? 'Ask for a change — “add a phone field”'
            : pendingImage
              ? 'Add an instruction, or just send the photo as-is'
              : 'Describe the form you need'
        }
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        onPaste={onPaste}
        variant="unstyled"
        autosize
        minRows={compact ? 1 : 3}
        maxRows={compact ? 4 : 8}
        px={compact ? 'sm' : 'md'}
        pt={compact ? 6 : 'sm'}
        disabled={busy}
        data-autofocus={compact ? undefined : true}
        styles={{ input: { fontSize: compact ? 13 : 15, lineHeight: 1.55 } }}
      />

      {imageError && (
        <Text size="10px" c="orange.5" px={compact ? 'sm' : 'md'} pb={4}>
          {imageError}
        </Text>
      )}

      <div className={classes.composerFoot}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onFilePicked}
        />
        <Tooltip label="Attach a photo of a form" withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            size={compact ? 'sm' : 'md'}
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a photo of a form"
          >
            <IconPhotoPlus size={compact ? 13 : 15} />
          </ActionIcon>
        </Tooltip>

        <Text size="xs" c="dimmed" style={{ flex: 1 }}>
          {busy ? 'Orbit is working…' : ''}
        </Text>

        {compact ? (
          <Tooltip label="Apply change" withArrow>
            <ActionIcon
              variant={empty ? 'subtle' : 'filled'}
              color={empty ? 'gray' : 'emerald'}
              radius="xl"
              size="sm"
              disabled={empty || busy}
              onClick={onSend}
              aria-label="Apply change"
            >
              <IconArrowUp size={13} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            color="emerald"
            radius="xl"
            size="sm"
            leftSection={<IconArrowUp size={15} />}
            disabled={empty || busy}
            loading={busy}
            onClick={onSend}
          >
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
