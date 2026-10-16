import { ActionIcon, Button, FileButton, Tooltip } from '@mantine/core';
import { ImagePlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import classes from './ImagePicker.module.css';

interface Props {
  value?: string;
  onChange: (url: string | undefined) => void;
  compact?: boolean;
  label?: string;
}

export function ImagePicker({ value, onChange, compact, label = 'Add image' }: Props) {
  const { upload, uploading } = useImageUpload();

  const pick = async (file: File | null) => {
    const url = await upload(file);
    if (url) onChange(url);
  };

  if (!value) {
    return (
      <FileButton onChange={(file) => void pick(file)} accept="image/*">
        {(props) =>
          compact ? (
            <Tooltip label={label} withArrow>
              <ActionIcon {...props} variant="default" size="lg" loading={uploading} aria-label={label}>
                <ImagePlusIcon size={16} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button {...props} variant="default" leftSection={<ImagePlusIcon size={15} />} loading={uploading} fullWidth>
              {label}
            </Button>
          )
        }
      </FileButton>
    );
  }

  return (
    <div className={classes.picked} data-compact={compact || undefined}>
      <img src={value} alt="" className={classes.thumb} />
      <FileButton onChange={(file) => void pick(file)} accept="image/*">
        {(props) => (
          <Tooltip label="Replace" withArrow>
            <ActionIcon {...props} variant="subtle" color="gray" loading={uploading} aria-label="Replace image">
              <RefreshCwIcon size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </FileButton>
      <Tooltip label="Remove" withArrow>
        <ActionIcon variant="subtle" color="gray" onClick={() => onChange(undefined)} aria-label="Remove image">
          <Trash2Icon size={14} />
        </ActionIcon>
      </Tooltip>
    </div>
  );
}
