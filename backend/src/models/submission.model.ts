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
  sourceUrl?: string;
  /**
   * 'pending_payment' rows are invisible everywhere a customer looks — they
   * are a checkout in progress, not a response. Only the webhook promotes one
   * to 'complete'. Forms without a payment field write 'complete' directly.
   */
  status: 'complete' | 'pending_payment';
  payment?: SubmissionPayment;
  read: boolean;
  starred: boolean;
  createdAt: Date;
}

const submissionSchema = new Schema<SubmissionDocument>(
  {
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    sourceUrl: { type: String },
    status: {
      type: String,
      enum: ['complete', 'pending_payment'],
      default: 'complete',
      index: true,
    },
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
    read: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SubmissionModel = model<SubmissionDocument>('Submission', submissionSchema);
