import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { connectDB } from "./db";
import { User } from "../models/User";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // confusing chars (0/O, 1/I) nahi

export const makeUid = () =>
  Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
export const makeSecret = () => randomBytes(24).toString("hex");
export const hashSecret = (s: string) => createHash("sha256").update(s).digest("hex");

export const cleanUid = (v: unknown) =>
  typeof v === "string" ? v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) : "";

export const cleanName = (v: unknown) =>
  typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, 24) : "";

/** uid + secret verify karke user document return karta hai (ya null). */
export async function verifyCredentials(uid?: unknown, secret?: unknown) {
  if (typeof uid !== "string" || typeof secret !== "string" || !uid || !secret) return null;
  await connectDB();
  const user = await User.findOne({ uid: cleanUid(uid) });
  if (!user) return null;
  const a = Buffer.from(user.secretHash);
  const b = Buffer.from(hashSecret(secret));
  return a.length === b.length && timingSafeEqual(a, b) ? user : null;
}
