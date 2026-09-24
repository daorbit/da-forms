import { Box } from '@mantine/core';
import type { SubmitButtonAlign, SubmitButtonSize, SubmitButtonWidth } from '@/types';
import classes from './settings.module.css';

interface Props {
  label: string;
  size: SubmitButtonSize;
  width: SubmitButtonWidth;
  align: SubmitButtonAlign;
  color?: string;
}

export function SubmitButtonPreview({ label, size, width, align, color }: Props) {
  return (
    <div className={classes.preview}>
      <div className={classes.previewLabel}>Preview</div>
      <Box className={classes.previewTrack} data-align={align}>
        <Box
          className={classes.previewButton}
          data-size={size}
          __vars={{ '--btn-width': `${width}%`, ...(color ? { '--btn-color': color } : {}) }}
        >
          {label || 'Submit'}
        </Box>
      </Box>
    </div>
  );
}
