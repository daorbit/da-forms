import type { Request, Response } from 'express';
import { recordAuditEvent, type AuditEvent } from './quantalog.js';

export type FormAuditAction =
  | 'form.created'
  | 'form.duplicated'
  | 'form.imported'
  | 'form.published'
  | 'form.unpublished'
  | 'form.deleted'
  | 'form.submission_deleted'
  | 'form.submissions_deleted'
  | 'form.payments_updated'
  | 'form.payments_disconnected'
  | 'form.app_connected'
  | 'form.app_disconnected'
  | 'form.webhook_updated';

export function audit(
  req: Request,
  res: Response,
  action: FormAuditAction,
  target?: AuditEvent['target'],
  meta?: AuditEvent['meta']
): Promise<void> {
  return recordAuditEvent(req.params.workspaceId, {
    action,
    actorId: typeof res.locals.actorId === 'string' ? res.locals.actorId : undefined,
    target,
    meta,
    ip: (req.ip ?? '').replace(/^::ffff:/, ''),
    userAgent: req.get('user-agent') ?? '',
  });
}

export function formTarget(form: { _id?: unknown; id?: unknown; name?: unknown; title?: unknown }) {
  return {
    kind: 'form',
    id: String(form._id ?? form.id ?? ''),
    label: String(form.name || form.title || 'Untitled form'),
  };
}
