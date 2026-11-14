export interface Identity {
  uid: string;
  secret: string;
  name: string;
}

const KEY = "stranger-chat:identity";

export function getStoredIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v?.uid && v?.secret ? (v as Identity) : null;
  } catch {
    return null;
  }
}

export function clearIdentity() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** Guest ID banao (server par) aur browser mein save karo. */
export async function createIdentity(name?: string): Promise<Identity> {
  const res = await fetch("/api/guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "ID nahi ban payi");
  localStorage.setItem(KEY, JSON.stringify(data));
  return data as Identity;
}

export async function api<T = unknown>(
  path: string,
  id: Identity,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: { "Content-Type": "application/json", "x-uid": id.uid, "x-secret": id.secret },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Kuch galat ho gaya");
  return data as T;
}
