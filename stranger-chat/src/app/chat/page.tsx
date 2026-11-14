import ChatRoom from "@/components/ChatRoom";
import type { Mode } from "@/components/ModePicker";

type SP = { mode?: string; friend?: string; accept?: string };

export default async function ChatPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const mode: Mode = sp.mode === "audio" || sp.mode === "video" ? sp.mode : "text";
  const clean = (v?: string) => v?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || undefined;
  return <ChatRoom initialMode={mode} friendUid={clean(sp.friend)} acceptUid={clean(sp.accept)} />;
}
