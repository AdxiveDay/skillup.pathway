import { redirect } from "next/navigation";
import { connectToDb } from "@/lib/db";
import { getUserSessionFromCookies } from "@/lib/session";
import { User } from "@/models/User";
import { MainClient } from "./main-client";

export default async function MainPage() {
  const session = await getUserSessionFromCookies();
  if (!session) redirect("/");

  await connectToDb();
  const user = await User.findById(session.sub).lean();
  if (!user) redirect("/");

  return (
    <MainClient
      initialUser={{
        id: user._id.toString(),
        username: user.username,
        profile: user.profile ?? undefined,
        milestones: (user.milestones ?? []).map((m) => ({
          id: m.id,
          label: m.label,
          title: m.title ?? undefined,
          tasks: (m.tasks ?? []).map((t) => ({ id: t.id, text: t.text, done: Boolean(t.done) })),
        })),
        dreamUniversityImageUrl: user.dreamUniversityImageUrl,
      }}
    />
  );
}

