import { Schema, model, Types } from 'mongoose';

/**
 * One file living in Cloudinary, and what it belongs to.
 *
 * Uploads happen before the submission exists: a respondent picks a file, the
 * bytes go up immediately so the form can show a thumbnail, and only later —
 * maybe never — is Submit pressed. Without a row here that gap is invisible,
 * and an abandoned upload is a file nothing references and nobody can find to
 * delete. The row is what makes both cleanup rules possible: `submissionId`
 * being null is exactly "not claimed yet", and `publicId` is the only handle
 * Cloudinary's delete API accepts.
 */
export interface UploadDocument {
  /** Cloudinary's own id — what `destroy` takes. Not derivable from the URL reliably. */
  publicId: string;
  /** Cloudinary stores images, video and raw files in separate namespaces. */
  resourceType: 'image' | 'video' | 'raw';
  url: string;
  /** Null for a form background, which belongs to the design rather than an answer. */
  formId: Types.ObjectId | null;
  workspaceId?: string;
  /**
   * Set when the submission carrying this file is stored. Null means the file
   * is still unclaimed and the sweep may take it once the grace period passes.
   */
  submissionId: Types.ObjectId | null;
  createdAt: Date;
}

const uploadSchema = new Schema<UploadDocument>(
  {
    publicId: { type: String, required: true, unique: true },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    url: { type: String, required: true },
    formId: { type: Schema.Types.ObjectId, ref: 'Form', default: null, index: true },
    workspaceId: { type: String },
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// The sweep's only query: unclaimed rows older than the grace period.
uploadSchema.index({ submissionId: 1, createdAt: 1 });

// Claiming a submission's files looks each one up by the URL the answer stored,
// since that is all the submitted payload carries.
uploadSchema.index({ url: 1 });

export const UploadModel = model<UploadDocument>('Upload', uploadSchema);
