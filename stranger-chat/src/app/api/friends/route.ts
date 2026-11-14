import { NextRequest, NextResponse } from "next/server";
import { authUser, err, notify } from "@/lib/api";
import { cleanUid } from "@/lib/auth";
import { User } from "@/models/User";
import { FriendRequest } from "@/models/FriendRequest";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const me = await authUser(req);
  if (!me) return err("Unauthorized", 401);

  const [incoming, outgoing] = await Promise.all([
    FriendRequest.find({ to: me.uid, status: "pending" }).sort({ createdAt: -1 }).lean(),
    FriendRequest.find({ from: me.uid, status: "pending" }).sort({ createdAt: -1 }).lean(),
  ]);
  const uids = [...new Set([...me.friends, ...incoming.map((r) => r.from), ...outgoing.map((r) => r.to)])];
  const users = await User.find({ uid: { $in: uids } }, "uid name").lean();
  const nameOf = (uid: string) => users.find((u) => u.uid === uid)?.name ?? uid;

  return NextResponse.json({
    friends: me.friends.map((uid) => ({ uid, name: nameOf(uid) })),
    incoming: incoming.map((r) => ({ id: String(r._id), uid: r.from, name: nameOf(r.from) })),
    outgoing: outgoing.map((r) => ({ id: String(r._id), uid: r.to, name: nameOf(r.to) })),
  });
}

/** Friend remove (dono taraf se). */
export async function DELETE(req: NextRequest) {
  const me = await authUser(req);
  if (!me) return err("Unauthorized", 401);
  const { uid } = await req.json().catch(() => ({}));
  const other = cleanUid(uid);
  if (!other) return err("uid chahiye");
  await Promise.all([
    User.updateOne({ uid: me.uid }, { $pull: { friends: other } }),
    User.updateOne({ uid: other }, { $pull: { friends: me.uid } }),
    FriendRequest.deleteMany({ $or: [{ from: me.uid, to: other }, { from: other, to: me.uid }] }),
  ]);
  await notify(other);
  return NextResponse.json({ ok: true });
}
