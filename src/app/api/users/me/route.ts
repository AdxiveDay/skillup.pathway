import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { getUserSessionFromCookies } from "@/lib/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  const session = await getUserSessionFromCookies();
  if (!session) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  await connectToDb();
  const user = await User.findById(session.sub).lean();
  if (!user) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      profile: user.profile,
      milestones: user.milestones,
      dreamUniversityImageUrl: user.dreamUniversityImageUrl,
    },
  });
}

