import { Center, Loader, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { FormPage } from '@/components/FormPage';
import { FormRenderer } from '@/components/FormRenderer';
import { OrbitMark } from '@/components/OrbitMark';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import type { Draft } from './types';
import classes from './createForm.module.css';

interface Props {
  template: Draft | null;
  shown: number;
  done: boolean;
  generating: boolean;
  device: DeviceId;
  onDeviceChange: (device: DeviceId) => void;
}

export function PreviewPane({
  template,
  shown,
  done,
  generating,
  device,
  onDeviceChange,
}: Props) {
  const size = frameSize(device);
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 48, y: 40 },
  });

  const visibleFields = template ? template.fields.slice(0, shown) : [];

  return (
    <section className={`${classes.previewPane} ${classes.paneEnterRight}`}>
      <div className={classes.previewBar}>
        <div className={`${classes.status} ${!generating && done ? classes.statusReady : ''}`}>
          {generating ? (
            <>
              <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
              <Text size="xs" fw={600} className={classes.thinking}>
                Revising
              </Text>
            </>
          ) : done ? (
            <>
              <span className={classes.statusTick}>
                <IconCheck size={11} stroke={3} />
              </span>
              <Text size="xs" fw={600}>
                Your form is ready
              </Text>
            </>
          ) : (
            <>
              <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
              <Text size="xs" fw={600} className={classes.thinking}>
                Building your form
              </Text>
            </>
          )}
        </div>

        <DeviceSwitch device={device} onChange={onDeviceChange} />
      </div>

      <div className={classes.stage} ref={stageRef}>
        {template ? (
          <DeviceFrame device={device} scale={scale} hidden={!measured}>
            <FormPage theme={template.theme} minHeight="100%">
              <div className={classes.revealed}>
                <FormRenderer
                  key={`${shown}-${template.fields.length}-${device}`}
                  title={template.title}
                  description={template.formDescription}
                  fields={visibleFields}
                  theme={template.theme}
                  submitLabel={template.submitLabel}
                />

                {!done && (
                  <div className={classes.ghostField} aria-hidden>
                    <span className={`${classes.ghostBar} ${classes.ghostLabel}`} />
                    <span className={`${classes.ghostBar} ${classes.ghostInput}`} />
                  </div>
                )}
              </div>
            </FormPage>
          </DeviceFrame>
        ) : (
          <Center h="100%">
            <div className={classes.emptyStage}>
              <OrbitMark size={40} />
              <Text size="sm" c="dimmed">
                Drafting your form…
              </Text>
            </div>
          </Center>
        )}
      </div>
    </section>
  );
}
