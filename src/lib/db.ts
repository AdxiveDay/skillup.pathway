import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
function getMongoUri() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment.");
  }
  return MONGODB_URI;
}

declare global {
  var __mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.__mongooseConn ?? (global.__mongooseConn = { conn: null, promise: null });

export async function connectToDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri()).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

