import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDb } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  profile: z
    .object({
      displayName: z.string().optional(),
      gradeLevel: z.string().optional(),
      dreamFaculty: z.string().optional(),
      avatarUrl: z.string().optional(),
    })
    .optional(),
  milestones: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        title: z.string().optional(),
        tasks: z.array(z.object({ id: z.string().min(1), text: z.string().min(1), done: z.boolean() })),
      }),
    )
    .optional(),
  dreamUniversityImageUrl: z.string().optional(),
});

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSessionFromCookies();
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await ctx.params;
  await connectToDb();
  const user = await User.findById(id).lean();
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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSessionFromCookies();
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });

  const { id } = await ctx.params;
  await connectToDb();
  const user = await User.findById(id);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  if (parsed.data.profile) {
    const base = user.profile ?? { displayName: "", gradeLevel: "", dreamFaculty: "", avatarUrl: "" };
    user.profile = {
      displayName: parsed.data.profile.displayName ?? base.displayName,
      gradeLevel: parsed.data.profile.gradeLevel ?? base.gradeLevel,
      dreamFaculty: parsed.data.profile.dreamFaculty ?? base.dreamFaculty,
      avatarUrl: parsed.data.profile.avatarUrl ?? base.avatarUrl,
    };
  }
  if (parsed.data.milestones) {
    user.set("milestones", parsed.data.milestones);
  }
  if (typeof parsed.data.dreamUniversityImageUrl === "string") {
    user.dreamUniversityImageUrl = parsed.data.dreamUniversityImageUrl;
  }

  await user.save();
  return NextResponse.json({ ok: true });
}

