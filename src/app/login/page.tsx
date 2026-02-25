import { redirect } from "next/navigation";
import { getAdminSessionFromCookies, getUserSessionFromCookies } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getAdminSessionFromCookies()) redirect("/dashboard");
  if (await getUserSessionFromCookies()) redirect("/main");
  return <LoginForm />;
}

