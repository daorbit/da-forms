import { Schema, model } from 'mongoose';

export interface FormSheetDocument {
  workspaceId: string;
  formId: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  columns: string[];
  rows: number;
  lastRowAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const formSheetSchema = new Schema<FormSheetDocument>(
  {
    workspaceId: { type: String, required: true },
    formId: { type: String, required: true },
    spreadsheetId: { type: String, required: true },
    spreadsheetUrl: { type: String, required: true },
    columns: { type: [String], default: [] },
    rows: { type: Number, default: 0 },
    lastRowAt: { type: Date },
  },
  { timestamps: true }
);

formSheetSchema.index({ formId: 1 }, { unique: true });
formSheetSchema.index({ workspaceId: 1, updatedAt: -1 });

export const FormSheetModel = model<FormSheetDocument>('FormSheet', formSheetSchema);
