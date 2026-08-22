import { Schema, model, Types } from 'mongoose';

export interface SubmissionDocument {
  formId: Types.ObjectId;
  data: Record<string, string>;
  sourceUrl?: string;
  read: boolean;
  starred: boolean;
  createdAt: Date;
}

const submissionSchema = new Schema<SubmissionDocument>(
  {
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    sourceUrl: { type: String },
    read: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SubmissionModel = model<SubmissionDocument>('Submission', submissionSchema);
