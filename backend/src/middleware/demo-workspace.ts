import type { RequestHandler } from 'express';

/**
 * The workspace a standalone visitor lands on when no host product supplies
 * one. It is a showcase, not storage: the forms it lists are built into the
 * frontend from the shipped templates.
 */
export const DEMO_WORKSPACE = 'default';

export function isDemoWorkspace(workspaceId: string | undefined) {
  return workspaceId === DEMO_WORKSPACE;
}

/**
 * Keeps the demo workspace read-only.
 *
 * Hiding the write buttons in the UI is not enough — the public URL is
 * reachable by anyone, and without this every visitor could POST straight to
 * the API and fill the collection with throwaway forms.
 */
export const blockDemoWorkspaceWrites: RequestHandler = (req, res, next) => {
  if (req.method === 'GET' || !isDemoWorkspace(req.params.workspaceId)) return next();
  res.status(403).json({
    error: 'demo_workspace',
    message: 'This is a read-only demo workspace. Forms cannot be created or changed here.',
  });
};
