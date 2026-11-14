import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { cleanName, hashSecret, makeSecret, makeUid } from "@/lib/auth";
import { err } from "@/lib/api";

export const runtime = "nodejs";

/** Guest ke liye unique ID banao. Koi email/password nahi. */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
  } catch {
    return err("Database connected nahi hai. Friends feature ke liye MONGODB_URI set karo.", 503);
  }
  const body = await req.json().catch(() => ({}));
  const secret = makeSecret();
  for (let i = 0; i < 5; i++) {
    const uid = makeUid();
    const name = cleanName(body?.name) || `Guest-${uid.slice(0, 4)}`;
    try {
      await User.create({ uid, name, secretHash: hashSecret(secret) });
      return NextResponse.json({ uid, secret, name });
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) return err("ID nahi ban payi", 500);
    }
  }
  return err("ID nahi ban payi, dobara try karo", 500);
}
