import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { authUser, err, notify } from "@/lib/api";
import { User } from "@/models/User";
import { FriendRequest } from "@/models/FriendRequest";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const me = await authUser(req);
  if (!me) return err("Unauthorized", 401);
  const { id, action } = await req.json().catch(() => ({}));
  if (!isValidObjectId(id) || (action !== "accept" && action !== "reject")) return err("Galat request");

  const fr = await FriendRequest.findOne({ _id: id, to: me.uid, status: "pending" });
  if (!fr) return err("Request nahi mili", 404);

  if (action === "accept") {
    fr.status = "accepted";
    await Promise.all([
      fr.save(),
      User.updateOne({ uid: me.uid }, { $addToSet: { friends: fr.from } }),
      User.updateOne({ uid: fr.from }, { $addToSet: { friends: me.uid } }),
    ]);
  } else {
    fr.status = "rejected";
    await fr.save();
  }
  await notify(fr.from);
  return NextResponse.json({ ok: true, status: fr.status });
}
