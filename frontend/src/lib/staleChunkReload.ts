const KEY = 'da-forms:stale-chunk-reload';
const RETRY_AFTER_MS = 60_000;

function recentlyReloaded(): boolean {
  try {
    const at = Number(sessionStorage.getItem(KEY));
    return Number.isFinite(at) && Date.now() - at < RETRY_AFTER_MS;
  } catch {
    return true;
  }
}

export function installStaleChunkReload() {
  window.addEventListener('vite:preloadError', (event) => {
    if (recentlyReloaded()) return;
    event.preventDefault();
    try {
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
  });
}
