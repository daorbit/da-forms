let installed = false;

export function installProcessGuards(): void {
  if (installed) return;
  installed = true;

  process.on('unhandledRejection', (reason) => {
    console.error('[process] unhandled rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[process] uncaught exception:', err);
  });
}
