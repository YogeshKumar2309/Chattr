"use client";
import { MessageSquare, Mic, Video } from "lucide-react";

export type Mode = "text" | "audio" | "video";

const ITEMS: { id: Mode; label: string; Icon: typeof Video }[] = [
  { id: "text", label: "Text", Icon: MessageSquare },
  { id: "audio", label: "Audio", Icon: Mic },
  { id: "video", label: "Video", Icon: Video },
];

export default function ModePicker({
  value,
  onChange,
  disabled,
}: {
  value: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Chat type" className="inline-flex rounded-full bg-black/25 p-1">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={value === id}
          disabled={disabled}
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            value === id ? "bg-ink text-deep" : "text-ink/80 hover:text-ink"
          }`}
        >
          <Icon size={16} /> {label}
        </button>
      ))}
    </div>
  );
}
