import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { ADMIN_COOKIE, SESSION_COOKIE, signAdminSession, signUserSession } from "@/lib/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "passw0rd";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const res = NextResponse.json({ ok: true, role: "admin" as const });
    res.cookies.set(ADMIN_COOKIE, signAdminSession(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  await connectToDb();
  const user = await User.findOne({ username });
  if (!user) return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });

  const token = signUserSession({ sub: user._id.toString(), username: user.username });
  const res = NextResponse.json({ ok: true, role: "user" as const });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

