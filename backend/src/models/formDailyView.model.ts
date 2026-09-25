import { Schema, model } from 'mongoose';

/**
 * Counted views per form per UTC day.
 *
 * `FormView` only remembers a visitor for thirty minutes (it exists to stop
 * double counting), so it holds no history. This keeps one small row a day so
 * the responses page can draw views, and the completion rate, over time.
 */
export interface FormDailyViewDocument {
  formId: string;
  /** `YYYY-MM-DD`, UTC. */
  date: string;
  count: number;
}

const formDailyViewSchema = new Schema<FormDailyViewDocument>({
  formId: { type: String, required: true },
  date: { type: String, required: true },
  count: { type: Number, default: 0 },
});

formDailyViewSchema.index({ formId: 1, date: 1 }, { unique: true });

export const FormDailyViewModel = model<FormDailyViewDocument>('FormDailyView', formDailyViewSchema);
