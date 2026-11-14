import { NextRequest, NextResponse } from "next/server";
import { authUser, err } from "@/lib/api";
import { cleanUid } from "@/lib/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const me = await authUser(req);
  if (!me) return err("Pehle apni ID banao", 401);
  const uid = cleanUid(req.nextUrl.searchParams.get("uid"));
  if (uid.length < 4) return err("Poori ID daalo");
  const u = await User.findOne({ uid }, "uid name blocked").lean();
  if (!u || u.blocked.includes(me.uid)) return err("Is ID ka koi user nahi mila", 404);
  return NextResponse.json({
    uid: u.uid,
    name: u.name,
    isFriend: me.friends.includes(u.uid),
    isSelf: u.uid === me.uid,
  });
}
