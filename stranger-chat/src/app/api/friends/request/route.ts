import { NextRequest, NextResponse } from "next/server";
import { authUser, err, notify } from "@/lib/api";
import { cleanUid } from "@/lib/auth";
import { User } from "@/models/User";
import { FriendRequest } from "@/models/FriendRequest";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const me = await authUser(req);
  if (!me) return err("Pehle apni ID banao", 401);
  const { to } = await req.json().catch(() => ({}));
  const target = cleanUid(to);
  if (!target) return err("Friend ki ID daalo");
  if (target === me.uid) return err("Apni hi ID par request nahi bhej sakte");
  if (me.friends.includes(target)) return err("Ye already tumhara friend hai", 409);

  const other = await User.findOne({ uid: target }, "uid blocked").lean();
  if (!other || other.blocked.includes(me.uid)) return err("Is ID ka koi user nahi mila", 404);

  // Agar samne wale ne pehle hi request bheji hai to seedha friend bana do
  const reverse = await FriendRequest.findOne({ from: target, to: me.uid, status: "pending" });
  if (reverse) {
    reverse.status = "accepted";
    await Promise.all([
      reverse.save(),
      User.updateOne({ uid: me.uid }, { $addToSet: { friends: target } }),
      User.updateOne({ uid: target }, { $addToSet: { friends: me.uid } }),
    ]);
    await notify(target);
    return NextResponse.json({ status: "accepted" });
  }

  try {
    await FriendRequest.findOneAndUpdate(
      { from: me.uid, to: target },
      { $set: { status: "pending", createdAt: new Date() } },
      { upsert: true }
    );
  } catch {
    return err("Request pehle se bheji hui hai", 409);
  }
  await notify(target);
  return NextResponse.json({ status: "pending" });
}
