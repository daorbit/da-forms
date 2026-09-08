import {
  DeviceFrame as FrameSet,
  frameSize as frameSetSize,
} from 'da-frame-set';
import { DEVICE_ORDER, DEVICES, frameId, frameSpec, type DeviceId } from './devices';

export type { DeviceId };
export { DEVICE_ORDER };

/** Kept for the device switch: the three labels the picker shows. */
export const DEVICE_SPECS: Record<DeviceId, { id: DeviceId; label: string }> = {
  macbook: { id: 'macbook', label: DEVICES.macbook.label },
  ipad: { id: 'ipad', label: DEVICES.ipad.label },
  iphone: { id: 'iphone', label: DEVICES.iphone.label },
};

/** Outer size of the mock for the given device, chassis included. */
export function frameSize(device: DeviceId): { width: number; height: number } {
  return frameSetSize(frameSpec(device));
}

interface Props {
  device: DeviceId;
  scale: number;
  hidden?: boolean;
  children: React.ReactNode;
}

/** A hardware mock around the previewed page, drawn by da-frame-set. */
export function DeviceFrame({ device, scale, hidden, children }: Props) {
  return (
    <FrameSet device={frameId(device)} scale={scale} hidden={hidden}>
      {children}
    </FrameSet>
  );
}
