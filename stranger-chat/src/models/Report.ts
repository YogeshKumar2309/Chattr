import mongoose, { Schema, type Model } from "mongoose";

export interface IReport {
  reporter?: string;
  reported?: string;
  reason: string;
  createdAt: Date;
}

const schema = new Schema<IReport>({
  reporter: String,
  reported: String,
  reason: { type: String, maxlength: 300, default: "unspecified" },
  createdAt: { type: Date, default: Date.now },
});

export const Report: Model<IReport> =
  (mongoose.models.Report as Model<IReport>) || mongoose.model<IReport>("Report", schema);
