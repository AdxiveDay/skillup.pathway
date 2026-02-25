"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PillButton } from "@/components/PillButton";
import { TextField } from "@/components/TextField";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => username.trim() && password, [username, password]);

  return (
    <div className="purple-gradient-bg grid min-h-dvh place-items-center px-6 py-14">
      <div className="w-full max-w-[520px] rounded-2xl bg-white px-10 py-12 shadow-xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-4xl font-semibold text-[#7C3AED]">
            <span>Login</span>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 17L15 12L10 7"
                stroke="#7C3AED"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 12H3"
                stroke="#7C3AED"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 3V21"
                stroke="#7C3AED"
                strokeWidth="0"
              />
            </svg>
          </div>
        </div>

        <form
          className="mt-14 space-y-8"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setLoading(true);
            setError(null);
            try {
              const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ username, password }),
              });
              const data = (await res.json().catch(() => null)) as
                | { ok?: boolean; error?: string; role?: "user" | "admin" }
                | null;
              if (!res.ok || !data?.ok) {
                setError(data?.error ?? "LOGIN_FAILED");
                return;
              }
              try {
                window.localStorage.setItem("hasRegistered", "1");
              } catch {}
              router.push(data.role === "admin" ? "/dashboard" : "/main");
            } finally {
              setLoading(false);
            }
          }}
        >
          <TextField
            label="Username:"
            name="username"
            value={username}
            onChange={setUsername}
            autoComplete="username"
          />
          <TextField
            label="Password:"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <div className="pt-2 text-center">
            <PillButton type="submit" disabled={!canSubmit || loading} className="px-10">
              Login
            </PillButton>
            {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
          </div>

          <div className="pt-2 text-center text-xs text-zinc-400">
            Didn&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-[#7C3AED] hover:underline">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

