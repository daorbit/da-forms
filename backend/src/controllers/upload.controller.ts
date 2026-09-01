import type { RequestHandler } from 'express';
import { cloudinary } from '../config/cloudinary.js';
import { recordUpload } from '../services/media.service.js';

/** What Cloudinary hands back that we need to keep in order to delete it later. */
interface Uploaded {
  secure_url: string;
  public_id: string;
  resource_type: string;
}

/** Cloudinary reports more types than it accepts back on `destroy`. */
function resourceType(value: string): 'image' | 'video' | 'raw' {
  return value === 'video' || value === 'raw' ? value : 'image';
}

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

  const result = await new Promise<Uploaded | null>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `da-forms/${req.params.id}`,
        resource_type: 'auto',
        // For an image Cloudinary infers the format from the file content, but
        // a `raw` resource (doc/docx/xlsx/...) has no such inference — without
        // an extension on the public_id it stores as a bare id served back as
        // `application/octet-stream`, which is what broke the file-type icon
        // and the "open this as its real format" behaviour downstream.
        // `use_filename` + `filename_override` carries the original name's
        // extension onto the stored public_id.
        use_filename: true,
        unique_filename: true,
        filename_override: file.originalname,
      },
      (error, uploaded) => (error ? reject(error) : resolve((uploaded as Uploaded) ?? null))
    );
    stream.end(file.buffer);
  });

  if (!result) return res.status(502).json({ error: 'upload_failed', message: 'Upload failed' });

  // Recorded before the URL is handed out, so a file can never exist in
  // Cloudinary without a row that knows how to delete it. Until the submission
  // claims it, this row is what the abandoned-upload sweep looks for.
  await recordUpload({
    publicId: result.public_id,
    resourceType: resourceType(result.resource_type),
    url: result.secure_url,
    formId: req.params.id,
  });

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

  const result = await new Promise<Uploaded | null>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `da-forms/backgrounds/${req.params.workspaceId}`, resource_type: 'image' },
      (error, uploaded) => (error ? reject(error) : resolve((uploaded as Uploaded) ?? null))
    );
    stream.end(file.buffer);
  });

  if (!result) return res.status(502).json({ error: 'upload_failed', message: 'Upload failed' });

  // A background is an editor asset, not a respondent's answer, so nothing will
  // ever "claim" it and the abandoned-upload sweep must skip it — see the
  // `workspaceId` exclusion in `sweepAbandonedUploads`.
  await recordUpload({
    publicId: result.public_id,
    resourceType: resourceType(result.resource_type),
    url: result.secure_url,
    workspaceId: req.params.workspaceId,
  });

  res.status(201).json({ url: result.secure_url, name: file.originalname });
};
