import mongoose, { Schema, type Model } from "mongoose";

export interface IUser {
  uid: string; // public unique ID, jaise "K7QM2XPA"
  name: string;
  secretHash: string; // sha256(secret). Secret sirf user ke browser mein rehta hai
  friends: string[]; // friend uids
  blocked: string[]; // blocked uids
  createdAt: Date;
}

const schema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 24 },
  secretHash: { type: String, required: true },
  friends: { type: [String], default: [] },
  blocked: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", schema);
