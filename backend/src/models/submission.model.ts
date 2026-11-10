import { Schema, model, Types } from 'mongoose';
import type { SubmissionAttribution } from '../lib/attribution.js';
import { RESPONDENT_DEVICES, type RespondentMeta } from '../lib/respondentMeta.js';

export type PaymentStatus = 'created' | 'paid' | 'failed';

export interface SubmissionPayment {
  provider: 'razorpay' | 'cashfree' | 'payu';
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  payerEmail?: string;
  payerContact?: string;
  /** card, upi, netbanking — whatever they used. */
  method?: string;
}

export interface SubmissionInvoice {
  status: 'created' | 'failed';
  id?: string;
  number?: string;
  shareUrl?: string;
  error?: string;
  at: Date;
}

export interface SubmissionBooking {
  fieldId: string;
  start: Date;
  end: Date;
  timezone: string;
  meetLink?: string;
  eventLink?: string;
}

export const SUBMISSION_STAGES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;

export type SubmissionStage = (typeof SUBMISSION_STAGES)[number];

export interface SubmissionNote {
  id: string;
  text: string;
  createdAt: Date;
}

export interface SubmissionDocument {
  formId: Types.ObjectId;
  data: Record<string, string>;
  fileMeta?: Record<string, { bytes: number }>;
  sourceUrl?: string;
  attribution?: SubmissionAttribution;
  status: 'complete' | 'pending_payment' | 'partial';
  partialKey?: string;
  lastFieldId?: string;
  lastFieldIndex?: number;
  /** Bumped on every autosave, so the sweep can age rows out by inactivity. */
  updatedAt?: Date;
  payment?: SubmissionPayment;
  invoice?: SubmissionInvoice;
  booking?: SubmissionBooking;
  quiz?: { score: number; total: number; correct: number; questions: number };
  leadScore?: number;
  respondent?: RespondentMeta;
  stage?: SubmissionStage;
  assignee?: string;
  tags?: string[];
  notes?: SubmissionNote[];
  read: boolean;
  starred: boolean;
  createdAt: Date;
}

const submissionSchema = new Schema<SubmissionDocument>(
  {
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    fileMeta: { type: Schema.Types.Mixed },
    sourceUrl: { type: String },
    attribution: {
      type: new Schema<SubmissionAttribution>(
        {
          channel: { type: String, required: true },
          paid: { type: Boolean },
          source: { type: String },
          medium: { type: String },
          campaign: { type: String },
          term: { type: String },
          content: { type: String },
          referrer: { type: String },
          landingUrl: { type: String },
          legacyEmbed: { type: Boolean },
        },
        { _id: false }
      ),
    },
    respondent: {
      type: new Schema<RespondentMeta>(
        {
          device: { type: String, enum: RESPONDENT_DEVICES },
          durationMs: { type: Number },
        },
        { _id: false }
      ),
    },
    status: {
      type: String,
      enum: ['complete', 'pending_payment', 'partial'],
      default: 'complete',
      index: true,
    },
    partialKey: { type: String },
    lastFieldId: { type: String },
    lastFieldIndex: { type: Number },
    payment: {
      type: new Schema<SubmissionPayment>(
        {
          provider: { type: String, enum: ['razorpay', 'cashfree', 'payu'], required: true },
          // Indexed because the webhook has nothing else to find the row by.
          orderId: { type: String, required: true, index: true },
          paymentId: { type: String },
          amount: { type: Number, required: true },
          currency: { type: String, required: true },
          status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
          paidAt: { type: Date },
          payerEmail: { type: String },
          payerContact: { type: String },
          method: { type: String },
        },
        { _id: false }
      ),
    },
    invoice: {
      type: new Schema<SubmissionInvoice>(
        {
          status: { type: String, enum: ['created', 'failed'], required: true },
          id: { type: String },
          number: { type: String },
          shareUrl: { type: String },
          error: { type: String },
          at: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
    },
    booking: {
      type: new Schema<SubmissionBooking>(
        {
          fieldId: { type: String, required: true },
          start: { type: Date, required: true },
          end: { type: Date, required: true },
          timezone: { type: String, required: true },
          meetLink: { type: String },
          eventLink: { type: String },
        },
        { _id: false }
      ),
    },
    quiz: { type: Schema.Types.Mixed },
    leadScore: { type: Number },
    stage: { type: String, enum: [...SUBMISSION_STAGES] },
    assignee: { type: String },
    tags: { type: [String], default: undefined },
    notes: {
      type: [
        new Schema<SubmissionNote>(
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: undefined,
    },
    read: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

submissionSchema.index({ formId: 1, partialKey: 1 }, { unique: true, sparse: true });

submissionSchema.index({ formId: 1, status: 1, stage: 1, createdAt: -1 });

submissionSchema.index({ formId: 1, status: 1, leadScore: -1 });

submissionSchema.index({ formId: 1, status: 1, 'booking.start': 1 }, { sparse: true });

submissionSchema.index({ formId: 1, status: 1, createdAt: -1 });

submissionSchema.index({ formId: 1, status: 1, createdAt: -1 });

export const SubmissionModel = model<SubmissionDocument>('Submission', submissionSchema);
