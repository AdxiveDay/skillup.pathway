"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PillButton } from "@/components/PillButton";
import { TextField } from "@/components/TextField";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim() && username.trim() && password && confirmPassword && password === confirmPassword;
  }, [email, username, password, confirmPassword]);

  return (
    <div className="purple-gradient-bg grid min-h-dvh place-items-center px-6 py-14">
      <div className="w-full max-w-[520px] rounded-2xl bg-white px-10 py-12 shadow-xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-4xl font-semibold text-[#7C3AED]">
            <span>Register</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20H21"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="mt-2 text-xs text-zinc-300">Sharpen your knowledge, sharpen your future</p>
        </div>

        <form
          className="mt-10 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setLoading(true);
            setError(null);
            try {
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, username, password, confirmPassword }),
              });
              const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
              if (!res.ok || !data?.ok) {
                setError(data?.error ?? "REGISTER_FAILED");
                return;
              }
              try {
                window.localStorage.setItem("hasRegistered", "1");
              } catch {}
              router.push("/main");
            } finally {
              setLoading(false);
            }
          }}
        >
          <TextField label="Email:" name="email" value={email} onChange={setEmail} autoComplete="email" />
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
            autoComplete="new-password"
          />
          <TextField
            label="Confirm Password:"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          <div className="pt-6 text-center">
            <PillButton type="submit" disabled={!canSubmit || loading} className="px-7">
              Confirm Register
            </PillButton>
            {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
          </div>
          <div className="pt-2 text-center text-xs text-zinc-400">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-medium text-[#7C3AED] hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

