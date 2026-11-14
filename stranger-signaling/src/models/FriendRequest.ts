import mongoose, { Schema, type Model } from "mongoose";

export interface IFriendRequest {
  from: string;
  to: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

const schema = new Schema<IFriendRequest>({
  from: { type: String, required: true, index: true },
  to: { type: String, required: true, index: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
schema.index({ from: 1, to: 1 }, { unique: true });

export const FriendRequest: Model<IFriendRequest> =
  (mongoose.models.FriendRequest as Model<IFriendRequest>) ||
  mongoose.model<IFriendRequest>("FriendRequest", schema);
