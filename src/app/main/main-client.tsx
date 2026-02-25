"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Task = { id: string; text: string; done: boolean };
type Milestone = { id: string; label: string; title?: string; tasks: Task[] };
type UserData = {
  id: string;
  username: string;
  profile?: { displayName?: string; gradeLevel?: string; dreamFaculty?: string; avatarUrl?: string };
  milestones: Milestone[];
  dreamUniversityImageUrl?: string;
};

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return match;
}

export function MainClient({ initialUser }: { initialUser: UserData }) {
  const router = useRouter();
  const [user, setUser] = useState<UserData>(initialUser);
  const [active, setActive] = useState<{
    milestone: Milestone;
    anchor: { x: number; y: number };
  } | null>(null);
  const vertical = useMediaQuery("(max-width: 768px)");

  const points = useMemo(() => {
    const ms = user.milestones ?? [];
    const pattern = vertical ? [0, 36, -18, 24, -12, 30, -8] : [0, -56, 36, -22, 18, -36, 28];
    const step = vertical ? 170 : 230;
    const base = vertical ? { x: 56, y: 120 } : { x: 110, y: 190 };

    const list = ms.map((m, idx) => {
      const offset = pattern[idx % pattern.length] ?? 0;
      return {
        milestone: m,
        x: vertical ? base.x + offset : base.x + idx * step,
        y: vertical ? base.y + idx * step : base.y + offset,
      };
    });

    const end = vertical
      ? { x: base.x + 10, y: base.y + ms.length * step }
      : { x: base.x + ms.length * step, y: base.y - 10 };

    const size = vertical
      ? { w: 260, h: Math.max(520, base.y + ms.length * step + 220) }
      : { w: Math.max(900, base.x + ms.length * step + 360), h: 420 };

    return { list, end, size };
  }, [user.milestones, vertical]);

  const displayName = user.profile?.displayName || "Name  Surname";
  const gradeLevel = user.profile?.gradeLevel || "ระดับชั้น ม. 6";
  const dreamFaculty = user.profile?.dreamFaculty || "วิศวะคอม";

  return (
    <div className="paper-grid-bg--fine min-h-dvh w-full overflow-hidden">
      <div className="relative mx-auto flex min-h-dvh max-w-full items-center justify-center px-4 py-6">
        <div className="absolute right-6 top-6 z-30">
          <button
            className="rounded-full border border-zinc-300/70 bg-white/80 px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur hover:bg-white"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
              try {
                window.localStorage.removeItem("hasRegistered");
              } catch {}
              router.push("/login");
            }}
          >
            Logout
          </button>
        </div>
        <div className="absolute left-6 top-6 z-20 rounded-md px-4 py-3 text-zinc-700 backdrop-blur">
        <div className="flex gap-8 items-center">
          <div className="mt-2 flex flex-col items-center gap-2">
            <div className="size-10 overflow-hidden">
              {user.profile?.avatarUrl ? (
                <Image
                  src={user.profile.avatarUrl}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="text-[8px] text-zinc-500">@{user.username}</div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">{gradeLevel}</div>
            <div className="text-[11px] text-zinc-500">คณะในฝัน : {dreamFaculty}</div>
          </div>
          </div>
        </div>

        <div
          className={cn(
            "relative mx-auto scrollbar-hide",
            vertical ? "h-[calc(100dvh-80px)] overflow-y-auto pb-20" : "overflow-x-auto pb-10",
          )}
        >
          <div
            className="relative"
            style={{
              width: points.size.w,
              height: points.size.h,
            }}
          >
            <svg
              className="absolute inset-0"
              width={points.size.w}
              height={points.size.h}
              viewBox={`0 0 ${points.size.w} ${points.size.h}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {points.list.map((p, idx) => {
                const next = points.list[idx + 1];
                const x2 = next ? next.x : points.end.x;
                const y2 = next ? next.y : points.end.y;
                return (
                  <line
                    key={`${p.milestone.id}-line`}
                    x1={p.x}
                    y1={p.y}
                    x2={x2}
                    y2={y2}
                    stroke="#8C8C8C"
                    strokeWidth="3"
                    strokeDasharray="8 10"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {points.list.map((p) => {
              const allDone = p.milestone.tasks.length > 0 && p.milestone.tasks.every((t) => t.done);
              return (
                <button
                  key={p.milestone.id}
                  onClick={(e) => {
                    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setActive({
                      milestone: p.milestone,
                      anchor: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
                    });
                  }}
                  className={cn(
                    "absolute z-10 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-sm transition hover:scale-[1.02]",
                    allDone ? "bg-zinc-400" : "bg-[#7C3AED]",
                  )}
                  style={{ left: p.x, top: p.y }}
                  aria-label={p.milestone.label}
                />
              );
            })}

            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow"
              style={{ left: points.end.x, top: points.end.y }}
            >
              <div className="grid size-[84px] place-items-center overflow-hidden rounded-full border border-zinc-200 bg-white">
                {user.dreamUniversityImageUrl ? (
                  <Image
                    src={user.dreamUniversityImageUrl}
                    alt="dream"
                    width={84}
                    height={84}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[10px] text-zinc-400">Dream</div>
                )}
              </div>
            </div>

            {points.list.map((p) => (
              <div
                key={`${p.milestone.id}-label`}
                className="absolute z-10 -translate-x-1/2 translate-y-5 text-center text-[11px] text-zinc-500"
                style={{ left: p.x, top: p.y }}
              >
                {p.milestone.title ? p.milestone.title : p.milestone.label}
              </div>
            ))}
          </div>
        </div>

        {active ? (
          <TaskModal
            milestone={active.milestone}
            anchor={active.anchor}
            onClose={() => setActive(null)}
            onToggle={async (taskId, done) => {
              setUser((u) => ({
                ...u,
                milestones: u.milestones.map((m) =>
                  m.id !== active.milestone.id
                    ? m
                    : { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done } : t)) },
                ),
              }));

              await fetch("/api/users/me/milestones", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ milestoneId: active.milestone.id, taskId, done }),
              }).catch(() => {});

              setActive((prev) =>
                prev
                  ? { ...prev, milestone: { ...prev.milestone, tasks: prev.milestone.tasks.map((t) => (t.id === taskId ? { ...t, done } : t)) } }
                  : prev,
              );
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function TaskModal({
  milestone,
  anchor,
  onClose,
  onToggle,
}: {
  milestone: Milestone;
  anchor: { x: number; y: number };
  onClose: () => void;
  onToggle: (taskId: string, done: boolean) => Promise<void>;
}) {
  const style = useMemo(() => {
    const w = 340;
    const h = Math.min(520, 150 + milestone.tasks.length * 28);
    const margin = 14;
    const left = Math.min(Math.max(anchor.x + 24, margin), window.innerWidth - w - margin);
    const top = Math.min(Math.max(anchor.y - h / 2, margin), window.innerHeight - h - margin);
    return { left, top, width: w };
  }, [anchor.x, anchor.y, milestone.tasks.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/0" onMouseDown={onClose}>
      <div
        className="absolute rounded-xl bg-white p-4 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        style={style}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[#7C3AED]">Task</div>
          <button className="text-xs text-zinc-400 hover:text-zinc-600" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-1 text-xs text-zinc-400">{milestone.title ?? milestone.label}</div>

        <div className="mt-4 space-y-2">
          {milestone.tasks.length ? (
            milestone.tasks.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => onToggle(t.id, e.target.checked)}
                  className="size-4 accent-[#7C3AED]"
                />
                <span className={cn(t.done ? "text-zinc-400 line-through" : "")}>{t.text}</span>
              </label>
            ))
          ) : (
            <div className="text-sm text-zinc-400">No tasks</div>
          )}
        </div>
      </div>
    </div>
  );
}

