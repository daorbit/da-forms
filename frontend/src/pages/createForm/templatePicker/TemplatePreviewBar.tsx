import { Button, Text } from '@mantine/core';
import { ArrowRightIcon } from 'lucide-react';
import type { FormTemplate } from '@/lib/templates';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import type { DeviceId } from '@/components/builder/DeviceFrame';
import { scopeLabel, templateMetaLine } from './templateMeta';
import classes from './TemplatePicker.module.css';

interface Props {
  template: FormTemplate;
  device: DeviceId;
  onDeviceChange: (device: DeviceId) => void;
  creating: boolean;
  onUse: () => void;
}

export function TemplatePreviewBar({ template, device, onDeviceChange, creating, onUse }: Props) {
  return (
    <div className={classes.previewBar}>
      <div className={classes.previewInfo}>
        <Text fw={600} size="md" truncate>
          {template.name}
        </Text>
        <div className={classes.previewMeta}>
          <span className={classes.badge}>{template.category}</span>
          <span className={classes.badge}>{scopeLabel(template)}</span>
          {templateMetaLine(template).map((part) => (
            <span key={part} className={classes.metaText}>
              {part}
            </span>
          ))}
        </div>
      </div>

      <div className={classes.previewActions}>
        <DeviceSwitch device={device} onChange={onDeviceChange} />
        <Button
          color="emerald"
          radius="xl"
          rightSection={<ArrowRightIcon size={15} />}
          onClick={onUse}
          loading={creating}
        >
          Use template
        </Button>
      </div>
    </div>
  );
}
