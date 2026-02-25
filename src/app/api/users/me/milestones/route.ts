import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDb } from "@/lib/db";
import { getUserSessionFromCookies } from "@/lib/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

const PatchSchema = z.object({
  milestoneId: z.string().min(1),
  taskId: z.string().min(1),
  done: z.boolean(),
});

export async function PATCH(req: Request) {
  const session = await getUserSessionFromCookies();
  if (!session) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  await connectToDb();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const milestone = user.milestones.find((m) => m.id === parsed.data.milestoneId);
  if (!milestone) return NextResponse.json({ ok: false, error: "MILESTONE_NOT_FOUND" }, { status: 404 });

  const task = milestone.tasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return NextResponse.json({ ok: false, error: "TASK_NOT_FOUND" }, { status: 404 });

  task.done = parsed.data.done;
  await user.save();

  return NextResponse.json({ ok: true });
}

