import { NextResponse, type NextRequest } from "next/server";
import { verifyCredentials } from "./auth";

export const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function authUser(req: NextRequest) {
  try {
    return await verifyCredentials(req.headers.get("x-uid"), req.headers.get("x-secret"));
  } catch {
    return null;
  }
}

/** Render ke signaling server ko batao ki friends list update karni hai. */
export async function notify(uid: string) {
  const url = process.env.SIGNALING_URL;
  if (!url) return;
  try {
    await fetch(`${url}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, secret: process.env.NOTIFY_SECRET }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {}
}
