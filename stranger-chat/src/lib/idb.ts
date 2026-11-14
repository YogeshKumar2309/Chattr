/**
 * Local message store (IndexedDB). Server par koi message save nahi hota.
 * Har message 24 ghante baad apne aap delete ho jata hai (sender aur receiver dono ke browser mein alag-alag).
 */
const DB_NAME = "stranger-chat";
const STORE = "messages";
export const TTL_MS = 24 * 60 * 60 * 1000;

export interface StoredMessage {
  key: string; // `${conv}|${id}`
  conv: string;
  id: string;
  from: "me" | "peer";
  text: string;
  ts: number;
  expiresAt: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: "key" });
      store.createIndex("conv", "conv");
      store.createIndex("expiresAt", "expiresAt");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const done = (tx: IDBTransaction) =>
  new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = tx.onabort = () => rej(tx.error);
  });

export async function saveMessage(m: { conv: string; id: string; from: "me" | "peer"; text: string; ts: number }) {
  try {
    const db = await open();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...m, key: `${m.conv}|${m.id}`, expiresAt: m.ts + TTL_MS } satisfies StoredMessage);
    await done(tx);
    db.close();
  } catch {}
}

export async function loadConversation(conv: string): Promise<StoredMessage[]> {
  try {
    const db = await open();
    const req = db.transaction(STORE).objectStore(STORE).index("conv").getAll(conv);
    const rows = await new Promise<StoredMessage[]>((res, rej) => {
      req.onsuccess = () => res(req.result as StoredMessage[]);
      req.onerror = () => rej(req.error);
    });
    db.close();
    const now = Date.now();
    return rows.filter((r) => r.expiresAt > now).sort((a, b) => a.ts - b.ts);
  } catch {
    return [];
  }
}

export async function purgeExpired() {
  try {
    const db = await open();
    const tx = db.transaction(STORE, "readwrite");
    const range = IDBKeyRange.upperBound(Date.now());
    tx.objectStore(STORE).index("expiresAt").openKeyCursor(range).onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursor | null>).result;
      if (cursor) {
        tx.objectStore(STORE).delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    await done(tx);
    db.close();
  } catch {}
}

/** Abhi ek baar + har minute expired messages saaf karo. */
export function startPurgeLoop() {
  void purgeExpired();
  const t = setInterval(purgeExpired, 60_000);
  return () => clearInterval(t);
}
