import { Schema, model, Types } from 'mongoose';

export type BookingStatus = 'held' | 'confirmed';

export interface BookingDocument {
  workspaceId: string;
  formId: Types.ObjectId;
  fieldId: string;
  start: Date;
  end: Date;
  seat: number;
  status: BookingStatus;
  submissionId?: Types.ObjectId;
  calendarId?: string;
  eventId?: string;
  createdAt: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    workspaceId: { type: String, required: true },
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    fieldId: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    seat: { type: Number, default: 0 },
    status: { type: String, enum: ['held', 'confirmed'], default: 'held' },
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
    calendarId: { type: String },
    eventId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookingSchema.index({ formId: 1, fieldId: 1, start: 1, seat: 1 }, { unique: true });
bookingSchema.index({ submissionId: 1 }, { sparse: true });
bookingSchema.index({ status: 1, createdAt: 1 });
bookingSchema.index({ workspaceId: 1 });
bookingSchema.index({ workspaceId: 1, status: 1, start: 1 });

export const BookingModel = model<BookingDocument>('Booking', bookingSchema);
