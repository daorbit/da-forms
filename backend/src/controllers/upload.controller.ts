import type { RequestHandler } from 'express';
import { cloudinary } from '../config/cloudinary.js';

/**
 * The client sends `accept` (image/*, audio/*,video/*, etc, taken from the
 * `FileInput`'s own `accept` prop) so this can enforce the same restriction —
 * a respondent editing the request by hand shouldn't bypass what the field type
 * promises.
 */
function isAllowed(mimeType: string, accept: string | undefined): boolean {
  if (!accept) return true;
  return accept.split(',').some((pattern) => {
    const [type, subtype] = pattern.trim().split('/');
    const [actualType, actualSubtype] = mimeType.split('/');
    if (type !== actualType) return false;
    return subtype === '*' || subtype === actualSubtype;
  });
}

/** Uploads a respondent's file (from a `file`/`imageUpload`/`mediaUpload` field) to Cloudinary and returns its URL. */
export const uploadFormFile: RequestHandler = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'no_file', message: 'No file provided' });

  const accept = typeof req.body.accept === 'string' ? req.body.accept : undefined;
  if (!isAllowed(file.mimetype, accept)) {
    return res.status(400).json({ error: 'invalid_type', message: `File type ${file.mimetype} is not accepted here` });
  }

  const result = await new Promise<{ secure_url: string } | null>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `da-forms/${req.params.id}`, resource_type: 'auto' },
      (error, uploaded) => (error ? reject(error) : resolve(uploaded ?? null))
    );
    stream.end(file.buffer);
  });

  if (!result) return res.status(502).json({ error: 'upload_failed', message: 'Upload failed' });
  res.status(201).json({ url: result.secure_url, name: file.originalname });
};

/**
 * Uploads a form's background image. Unlike `uploadFormFile` this is a
 * workspace-scoped, editor-facing route — the asset belongs to the form's
 * design, not to a respondent's answer, so it lives in its own folder and is
 * never reachable from the public router.
 */
export const uploadBackgroundImage: RequestHandler = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'no_file', message: 'No file provided' });
  if (!isAllowed(file.mimetype, 'image/*')) {
    return res.status(400).json({ error: 'invalid_type', message: 'Background must be an image' });
  }

  const result = await new Promise<{ secure_url: string } | null>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `da-forms/backgrounds/${req.params.workspaceId}`, resource_type: 'image' },
      (error, uploaded) => (error ? reject(error) : resolve(uploaded ?? null))
    );
    stream.end(file.buffer);
  });

  if (!result) return res.status(502).json({ error: 'upload_failed', message: 'Upload failed' });
  res.status(201).json({ url: result.secure_url, name: file.originalname });
};
