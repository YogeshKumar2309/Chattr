import mongoose from "mongoose";

type Cache = { conn?: typeof mongoose; promise?: Promise<typeof mongoose> };
const g = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = (g._mongoose ??= {});

export const hasDB = () => Boolean(process.env.MONGODB_URI);

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI set nahi hai (.env.local dekho)");
  if (cache.conn) return cache.conn;
  try {
    cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (e) {
    cache.promise = undefined;
    throw e;
  }
}
