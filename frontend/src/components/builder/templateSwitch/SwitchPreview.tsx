import { memo, type ComponentProps } from 'react';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { studioClasses } from '@/components/studio/StudioModal';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { useFitScale } from '@/hooks/useFitScale';
import classes from './templateSwitch.module.css';

export type FormView = ComponentProps<typeof FormRenderer>;
export type CompareSide = 'before' | 'after';

interface Props {
  views: Record<CompareSide, FormView>;
  side: CompareSide;
  device: DeviceId;
  revision: string;
  templateName: string;
  pending: boolean;
}

const Layer = memo(function Layer({ view, shown }: { view: FormView; shown: boolean }) {
  return (
    <div className={classes.layer} hidden={!shown}>
      <FormPage theme={view.theme} minHeight="100%">
        <FormRenderer {...view} />
      </FormPage>
    </div>
  );
});

export function SwitchPreview({ views, side, device, revision, templateName, pending }: Props) {
  const size = frameSize(device);
  const { ref, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 56, y: 96 },
  });

  return (
    <div className={studioClasses.stage} ref={ref}>
      <DeviceFrame device={device} scale={scale} hidden={!measured}>
        <div className={classes.layers} data-pending={pending || undefined}>
          <Layer key={`before-${device}`} view={views.before} shown={side === 'before'} />
          <Layer key={`after-${device}-${revision}`} view={views.after} shown={side === 'after'} />
        </div>
      </DeviceFrame>
      <span className={classes.sideTag} data-side={side}>
        {side === 'before' ? 'Your form now' : `With ${templateName}`}
      </span>
    </div>
  );
}
