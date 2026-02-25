import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) throw new Error("Missing AUTH_SECRET in environment.");

export const SESSION_COOKIE = "session";
export const ADMIN_COOKIE = "admin_session";

type SessionPayload = {
  sub: string; // userId
  username: string;
  role: "user";
};

type AdminPayload = {
  sub: "admin";
  username: "admin";
  role: "admin";
};

export function signUserSession(payload: Omit<SessionPayload, "role">) {
  return jwt.sign({ ...payload, role: "user" satisfies SessionPayload["role"] }, AUTH_SECRET!, {
    algorithm: "HS256",
    expiresIn: "30d",
  });
}

export function signAdminSession() {
  const payload: AdminPayload = { sub: "admin", username: "admin", role: "admin" };
  return jwt.sign(payload, AUTH_SECRET!, { algorithm: "HS256", expiresIn: "7d" });
}

export function verifySessionToken(token: string) {
  return jwt.verify(token, AUTH_SECRET!) as SessionPayload | AdminPayload;
}

export async function getUserSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = verifySessionToken(token);
    if (payload.role !== "user") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromCookies(): Promise<AdminPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = verifySessionToken(token);
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

