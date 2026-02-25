import { redirect } from "next/navigation";
import { getAdminSessionFromCookies, getUserSessionFromCookies } from "@/lib/session";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  if (await getAdminSessionFromCookies()) redirect("/dashboard");
  if (await getUserSessionFromCookies()) redirect("/main");
  return <RegisterForm />;
}

