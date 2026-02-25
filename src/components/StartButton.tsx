"use client";

import { useRouter } from "next/navigation";
import { PillButton } from "@/components/PillButton";

export function StartButton() {
  const router = useRouter();

  return (
    <PillButton
      onClick={() => {
        try {
          const hasRegistered = window.localStorage.getItem("hasRegistered") === "1";
          router.push(hasRegistered ? "/login" : "/register");
        } catch {
          router.push("/register");
        }
      }}
    >
      เริ่มต้นใช้งาน
    </PillButton>
  );
}

