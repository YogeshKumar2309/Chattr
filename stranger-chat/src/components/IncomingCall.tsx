"use client";
import { Phone, X } from "lucide-react";

export interface Call {
  fromUid: string;
  fromName: string;
  mode: "text" | "audio" | "video";
}

const LABEL = { text: "chat", audio: "audio call", video: "video call" } as const;

export default function IncomingCall({
  call,
  onAccept,
  onDecline,
}: {
  call: Call;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label="Incoming request"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-panel2 p-4 shadow-2xl"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{call.fromName}</p>
        <p className="text-sm text-mute">tumse {LABEL[call.mode]} karna chahta hai</p>
      </div>
      <button onClick={onDecline} aria-label="Decline" className="rounded-full bg-black/30 p-3 hover:bg-black/50">
        <X size={18} />
      </button>
      <button onClick={onAccept} aria-label="Accept" className="rounded-full bg-mint p-3 text-deep hover:brightness-110">
        <Phone size={18} />
      </button>
    </div>
  );
}
