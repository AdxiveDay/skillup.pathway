import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAdminSessionFromCookies();
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  await connectToDb();
  const members = await User.find({}, { username: 1, email: 1, profile: 1 }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    ok: true,
    count: members.length,
    members: members.map((m) => ({
      id: m._id.toString(),
      username: m.username,
      email: m.email,
      displayName: m.profile?.displayName ?? "",
    })),
  });
}

