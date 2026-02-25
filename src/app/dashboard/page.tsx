import { redirect } from "next/navigation";
import { connectToDb } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/session";
import { User } from "@/models/User";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const admin = await getAdminSessionFromCookies();
  if (!admin) redirect("/login");

  await connectToDb();
  const members = await User.find({}, { username: 1, email: 1, profile: 1 }).sort({ createdAt: -1 }).lean();

  return (
    <DashboardClient
      initialMembers={members.map((m) => ({
        id: m._id.toString(),
        username: m.username,
        email: m.email,
        displayName: m.profile?.displayName ?? "",
      }))}
    />
  );
}

