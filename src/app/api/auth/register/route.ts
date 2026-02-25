import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { connectToDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signUserSession, SESSION_COOKIE } from "@/lib/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

const RegisterSchema = z
  .object({
    email: z.string().email(),
    username: z.string().min(3).max(24),
    password: z.string().min(6).max(72),
    confirmPassword: z.string().min(6).max(72),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match" });

function defaultMilestones() {
  const months = ["ตุลาคม", "พฤศจิกายน", "ธันวาคม", "มกราคม", "กุมภาพันธ์"];
  return months.map((label, idx) => ({
    id: `m_${nanoid(10)}`,
    label,
    title: idx === 1 ? "พฤศจิกายน - ธันวาคม" : undefined,
    tasks: [{ id: `t_${nanoid(10)}`, text: "Task", done: false }],
  }));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  const { email, username, password } = parsed.data;

  await connectToDb();
  const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
  if (existing) {
    return NextResponse.json({ ok: false, error: "USER_EXISTS" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    username,
    passwordHash,
    milestones: defaultMilestones(),
  });

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

