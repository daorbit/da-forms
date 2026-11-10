export type RespondentDevice = 'mobile' | 'tablet' | 'desktop';

export function respondentDevice(): RespondentDevice {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const width = Math.min(window.screen?.width ?? window.innerWidth, window.screen?.height ?? window.innerHeight);
  if (coarse && width < 600) return 'mobile';
  if (coarse) return 'tablet';
  return 'desktop';
}
