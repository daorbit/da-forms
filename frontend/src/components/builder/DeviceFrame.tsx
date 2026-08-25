import classes from './DeviceFrame.module.css';

export type DeviceId = 'macbook' | 'ipad' | 'iphone';

export interface DeviceSpec {
  id: DeviceId;
  label: string;
  /** The device's real CSS viewport width — what the page inside actually reflows against. */
  width: number;
}

export const DEVICE_SPECS: Record<DeviceId, DeviceSpec> = {
  macbook: { id: 'macbook', label: 'MacBook Air', width: 1280 },
  ipad: { id: 'ipad', label: 'iPad Pro 11"', width: 834 },
  iphone: { id: 'iphone', label: 'iPhone 17', width: 402 },
};

export const DEVICE_ORDER: DeviceId[] = ['macbook', 'ipad', 'iphone'];

/** Each frame's rendered height including its chassis — what a fit-to-stage scale is measured against. */
export const FRAME_HEIGHTS: Record<DeviceId, number> = {
  macbook: 590,
  ipad: 750,
  iphone: 812,
};

interface Props {
  device: DeviceId;
  /** Shrinks the whole frame to fit the available space; the page inside still renders at full width. */
  scale: number;
  children: React.ReactNode;
}

/**
 * A hardware mock around the previewed page.
 *
 * The screen renders at the device's true CSS width and is then scaled down
 * to fit — scaling the frame rather than narrowing it is what keeps the
 * preview honest: a 402px-wide phone layout stays a phone layout, whatever
 * room the modal has.
 */
export function DeviceFrame({ device, scale, children }: Props) {
  const spec = DEVICE_SPECS[device];
  const wrapperStyle = { transform: `scale(${scale})`, transformOrigin: 'top center' };

  if (device === 'macbook') {
    return (
      <div className={classes.frame} style={{ ...wrapperStyle, width: spec.width + 24 }}>
        <div className={classes.macbook}>
          <div className={classes.macbookLid}>
            <div className={classes.macbookCamera} />
            <div
              className={`${classes.screen} ${classes.macbookScreen}`}
              style={{ width: spec.width }}
            >
              {children}
            </div>
          </div>
          <div className={classes.macbookBase} />
        </div>
      </div>
    );
  }

  if (device === 'ipad') {
    return (
      <div className={classes.frame} style={{ ...wrapperStyle, width: spec.width + 32 }}>
        <div className={classes.ipad}>
          <div className={classes.ipadCamera} />
          <div className={`${classes.screen} ${classes.ipadScreen}`} style={{ width: spec.width }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.frame} style={{ ...wrapperStyle, width: spec.width + 22 }}>
      <div className={classes.iphone}>
        <span className={`${classes.buttonLeft} ${classes.silenceSwitch}`} />
        <span className={`${classes.buttonLeft} ${classes.volumeUp}`} />
        <span className={`${classes.buttonLeft} ${classes.volumeDown}`} />
        <span className={classes.buttonRight} />
        <div className={classes.island} />
        <div className={`${classes.screen} ${classes.iphoneScreen}`} style={{ width: spec.width }}>
          {children}
        </div>
        <div className={classes.homeIndicator} />
      </div>
    </div>
  );
}
