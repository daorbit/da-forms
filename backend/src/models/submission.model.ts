import { Schema, model, Types } from 'mongoose';

/** Where a payment got to. Only 'paid' lets its submission count as complete. */
export type PaymentStatus = 'created' | 'paid' | 'failed';

export interface SubmissionPayment {
  provider: 'razorpay';
  /** Razorpay order id — what the webhook looks the submission up by. */
  orderId: string;
  /** Set on capture. Absent until then. */
  paymentId?: string;
  /** Minor units, computed server-side from the form. Never sent by the client. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  /**
   * Who Razorpay says paid. Captured because a form that collects no contact
   * details would otherwise leave the owner with a payment they cannot match
   * to a person.
   */
  payerEmail?: string;
  payerContact?: string;
  /** card, upi, netbanking — whatever they used. */
  method?: string;
}

export interface SubmissionDocument {
  formId: Types.ObjectId;
  data: Record<string, string>;
  /**
   * Byte size of each uploaded file/image/media answer, keyed by field id.
   * A sibling map rather than widening `data[fieldId]` from a bare URL to an
   * object — every existing reader of `data` (CSV export, PDF export, the
   * submit payload itself) keeps working unchanged, and this is additive,
   * read only where a size actually needs displaying.
   *
   * Reported by the client from Cloudinary's own upload response, not
   * re-verified server-side — it is a display value with no security or
   * billing consequence, so trusting it is the same trade already made for
   * every other field in `data`.
   */
  fileMeta?: Record<string, { bytes: number }>;
  sourceUrl?: string;
  /**
   * 'pending_payment' rows are invisible everywhere a customer looks — they
   * are a checkout in progress, not a response. Only the webhook promotes one
   * to 'complete'. Forms without a payment field write 'complete' directly.
   *
   * 'partial' is a form someone started and did not send: written by the
   * autosave route while they type, promoted to 'complete' in place if they
   * eventually submit, and swept away after a retention window if they never
   * do. Counted nowhere a response is counted — it is evidence about the form,
   * not an answer to it.
   */
  status: 'complete' | 'pending_payment' | 'partial';
  /**
   * The browser-generated id for one person's attempt at one form.
   *
   * What makes autosave idempotent: every save from the same tab updates the
   * same row rather than leaving a trail of one row per keystroke. Random and
   * client-side because there is no session here — a public form has no login
   * — and it identifies an attempt, never a person.
   */
  partialKey?: string;
  /**
   * The last field the respondent had reached when they stopped, and its
   * position in document order.
   *
   * The position is stored rather than derived at read time because the form it
   * refers to keeps changing: an owner who adds a question at the top would
   * otherwise shift every historical drop-off point down by one, silently
   * rewriting what the data said.
   */
  lastFieldId?: string;
  lastFieldIndex?: number;
  /** Bumped on every autosave, so the sweep can age rows out by inactivity. */
  updatedAt?: Date;
  payment?: SubmissionPayment;
  /**
   * What this response scored, on a form that has an answer key.
   *
   * Stored rather than recomputed on read: an owner who corrects the key
   * afterwards has not changed what someone scored at the time, and a quiz
   * whose past results move underneath it is not a quiz.
   */
  quiz?: { score: number; total: number; correct: number; questions: number };
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
          provider: { type: String, enum: ['razorpay'], required: true },
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
    quiz: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
  },
  // `updatedAt` was off while every row was written once and never touched
  // again. Partials are the exception — they are rewritten on every autosave,
  // and the sweep that ages them out needs to know when someone last typed
  // rather than when they first arrived.
  { timestamps: { createdAt: true, updatedAt: true } }
);

// One partial row per attempt: the autosave upserts against this, so two saves
// racing from the same tab cannot both insert. Sparse because only partials
// carry the key, and a unique index over hundreds of thousands of nulls would
// reject every completed submission after the first.
submissionSchema.index({ formId: 1, partialKey: 1 }, { unique: true, sparse: true });

export const SubmissionModel = model<SubmissionDocument>('Submission', submissionSchema);
