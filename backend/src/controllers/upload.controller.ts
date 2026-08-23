import type { RequestHandler } from 'express';
import { cloudinary } from '../config/cloudinary.js';

/** Uploads a respondent's file (from a `file`/`imageUpload`/`mediaUpload` field) to Cloudinary and returns its URL. */
export const uploadFormFile: RequestHandler = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'no_file', message: 'No file provided' });

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
