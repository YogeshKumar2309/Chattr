import { NextRequest, NextResponse } from "next/server";
import { authUser, err } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await authUser(req);
  if (!user) return err("Unauthorized", 401);
  return NextResponse.json({ uid: user.uid, name: user.name });
}
