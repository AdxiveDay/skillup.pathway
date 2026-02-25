"use client";

import Image from "next/image";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { PillButton } from "@/components/PillButton";

type MemberListItem = { id: string; username: string; email: string; displayName: string };
type Task = { id: string; text: string; done: boolean };
type Milestone = { id: string; label: string; title?: string; tasks: Task[] };
type MemberDetail = {
  id: string;
  username: string;
  email: string;
  profile?: { displayName?: string; gradeLevel?: string; dreamFaculty?: string; avatarUrl?: string };
  milestones: Milestone[];
  dreamUniversityImageUrl?: string;
};

type SliderImage = { id: string; url: string; order: number };

async function uploadFile(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; url?: string } | null;
  if (!res.ok || !data?.ok || !data.url) throw new Error("UPLOAD_FAILED");
  return data.url;
}

export function DashboardClient({ initialMembers }: { initialMembers: MemberListItem[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [selectedId, setSelectedId] = useState<string | null>(initialMembers[0]?.id ?? null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [slider, setSlider] = useState<SliderImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const count = members.length;

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/slider");
      const data = (await res.json().catch(() => null)) as { ok?: boolean; images?: SliderImage[] } | null;
      if (res.ok && data?.ok && data.images) setSlider(data.images);
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setMessage(null);
      const res = await fetch(`/api/admin/members/${selectedId}`);
      const data = (await res.json().catch(() => null)) as { ok?: boolean; user?: MemberDetail } | null;
      if (res.ok && data?.ok && data.user) setDetail(data.user);
    })();
  }, [selectedId]);

  const selected = useMemo(() => members.find((m) => m.id === selectedId) ?? null, [members, selectedId]);

  return (
    <div className="min-h-dvh bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-zinc-900">Managing dashboard</div>
            <div className="mt-1 text-sm text-zinc-500">Members: {count}</div>
          </div>
          <button
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-900">Member list</div>
            <div className="mt-3 space-y-1">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                    selectedId === m.id ? "bg-[#7C3AED]/10 text-[#6D28D9]" : "hover:bg-zinc-50 text-zinc-700",
                  )}
                >
                  <div className="font-medium">{m.username}</div>
                  <div className="text-xs text-zinc-400">{m.displayName || m.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Edit member</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {selected ? `${selected.username} (${selected.email})` : "Select a member"}
                  </div>
                </div>
                <PillButton
                  className="px-5 py-2 text-xs"
                  disabled={!detail || saving}
                  onClick={async () => {
                    if (!detail) return;
                    setSaving(true);
                    setMessage(null);
                    try {
                      const res = await fetch(`/api/admin/members/${detail.id}`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          profile: detail.profile ?? {},
                          milestones: detail.milestones ?? [],
                          dreamUniversityImageUrl: detail.dreamUniversityImageUrl ?? "",
                        }),
                      });
                      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
                      if (!res.ok || !data?.ok) throw new Error("SAVE_FAILED");
                      setMessage("Saved.");
                      setMembers((prev) =>
                        prev.map((m) =>
                          m.id === detail.id
                            ? { ...m, displayName: detail.profile?.displayName ?? m.displayName }
                            : m,
                        ),
                      );
                    } catch {
                      setMessage("Save failed.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save
                </PillButton>
              </div>

              {message ? <div className="mt-3 text-xs text-zinc-500">{message}</div> : null}

              {detail ? (
                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <Field
                      label="ชื่อ (แสดงหน้า Main)"
                      value={detail.profile?.displayName ?? ""}
                      onChange={(v) => setDetail((d) => (d ? { ...d, profile: { ...d.profile, displayName: v } } : d))}
                    />
                    <Field
                      label="ระดับชั้น"
                      value={detail.profile?.gradeLevel ?? ""}
                      onChange={(v) => setDetail((d) => (d ? { ...d, profile: { ...d.profile, gradeLevel: v } } : d))}
                    />
                    <Field
                      label="คณะมหาลัยในฝัน"
                      value={detail.profile?.dreamFaculty ?? ""}
                      onChange={(v) => setDetail((d) => (d ? { ...d, profile: { ...d.profile, dreamFaculty: v } } : d))}
                    />

                    <ImageField
                      label="รูปโปรไฟล์"
                      url={detail.profile?.avatarUrl ?? ""}
                      onUpload={async (file) => {
                        const url = await uploadFile(file);
                        setDetail((d) => (d ? { ...d, profile: { ...d.profile, avatarUrl: url } } : d));
                      }}
                    />

                    <ImageField
                      label="รูปมหาลัยในฝัน (วงกลมสีขาวปลายทาง)"
                      url={detail.dreamUniversityImageUrl ?? ""}
                      onUpload={async (file) => {
                        const url = await uploadFile(file);
                        setDetail((d) => (d ? { ...d, dreamUniversityImageUrl: url } : d));
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">Milestones / Tasks</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        จำนวนจุด: {detail.milestones.length}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {detail.milestones.map((m, idx) => (
                        <div key={m.id} className="rounded-lg border border-zinc-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-zinc-800">จุดที่ {idx + 1}</div>
                            <button
                              className="text-xs text-red-500 hover:underline"
                              onClick={() =>
                                setDetail((d) =>
                                  d ? { ...d, milestones: d.milestones.filter((x) => x.id !== m.id) } : d,
                                )
                              }
                            >
                              ลบจุด
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field
                              label="Label (เดือน)"
                              value={m.label}
                              onChange={(v) =>
                                setDetail((d) =>
                                  d
                                    ? {
                                        ...d,
                                        milestones: d.milestones.map((x) => (x.id === m.id ? { ...x, label: v } : x)),
                                      }
                                    : d,
                                )
                              }
                            />
                            <Field
                              label="Title (ถ้าต้องการ เช่น พ.ย.-ธ.ค.)"
                              value={m.title ?? ""}
                              onChange={(v) =>
                                setDetail((d) =>
                                  d
                                    ? {
                                        ...d,
                                        milestones: d.milestones.map((x) =>
                                          x.id === m.id ? { ...x, title: v || undefined } : x,
                                        ),
                                      }
                                    : d,
                                )
                              }
                            />
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-semibold text-zinc-800">Tasks</div>
                              <button
                                className="text-xs text-[#6D28D9] hover:underline"
                                onClick={() =>
                                  setDetail((d) =>
                                    d
                                      ? {
                                          ...d,
                                          milestones: d.milestones.map((x) =>
                                            x.id !== m.id
                                              ? x
                                              : {
                                                  ...x,
                                                  tasks: [
                                                    ...x.tasks,
                                                    { id: `t_${nanoid(10)}`, text: "New task", done: false },
                                                  ],
                                                },
                                          ),
                                        }
                                      : d,
                                  )
                                }
                              >
                                + เพิ่ม task
                              </button>
                            </div>

                            <div className="mt-2 space-y-2">
                              {m.tasks.map((t) => (
                                <div key={t.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={t.done}
                                    onChange={(e) =>
                                      setDetail((d) =>
                                        d
                                          ? {
                                              ...d,
                                              milestones: d.milestones.map((x) =>
                                                x.id !== m.id
                                                  ? x
                                                  : {
                                                      ...x,
                                                      tasks: x.tasks.map((y) =>
                                                        y.id === t.id ? { ...y, done: e.target.checked } : y,
                                                      ),
                                                    },
                                              ),
                                            }
                                          : d,
                                      )
                                    }
                                    className="size-4 accent-[#7C3AED]"
                                  />
                                  <input
                                    value={t.text}
                                    onChange={(e) =>
                                      setDetail((d) =>
                                        d
                                          ? {
                                              ...d,
                                              milestones: d.milestones.map((x) =>
                                                x.id !== m.id
                                                  ? x
                                                  : {
                                                      ...x,
                                                      tasks: x.tasks.map((y) =>
                                                        y.id === t.id ? { ...y, text: e.target.value } : y,
                                                      ),
                                                    },
                                              ),
                                            }
                                          : d,
                                      )
                                    }
                                    className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm text-[#333333] outline-none focus:border-[#7C3AED]/50 focus:ring-2 focus:ring-[#7C3AED]/20"
                                  />
                                  <button
                                    className="text-xs text-red-500 hover:underline"
                                    onClick={() =>
                                      setDetail((d) =>
                                        d
                                          ? {
                                              ...d,
                                              milestones: d.milestones.map((x) =>
                                                x.id !== m.id
                                                  ? x
                                                  : { ...x, tasks: x.tasks.filter((y) => y.id !== t.id) },
                                              ),
                                            }
                                          : d,
                                      )
                                    }
                                  >
                                    ลบ
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      onClick={() =>
                        setDetail((d) =>
                          d
                            ? {
                                ...d,
                                milestones: [
                                  ...d.milestones,
                                  { id: `m_${nanoid(10)}`, label: "เดือนใหม่", tasks: [] },
                                ],
                              }
                            : d,
                        )
                      }
                    >
                      + เพิ่มจุดใหม่
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-sm text-zinc-500">Select a member to edit.</div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Home slider images</div>
                  <div className="mt-1 text-xs text-zinc-500">เพิ่ม/ลบ รูปใน slider หน้าแรก</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {slider.map((s) => (
                  <div key={s.id} className="group relative size-[120px] overflow-hidden rounded-xl bg-zinc-200">
                    <Image src={s.url} alt="slide" width={120} height={120} className="h-full w-full object-cover" />
                    <button
                      className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      onClick={async () => {
                        await fetch(`/api/admin/slider?id=${encodeURIComponent(s.id)}`, { method: "DELETE" }).catch(
                          () => {},
                        );
                        setSlider((prev) => prev.filter((x) => x.id !== s.id));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}

                <label className="grid size-[120px] cursor-pointer place-items-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-600 hover:bg-zinc-50">
                  + Add
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (!file) return;
                      const url = await uploadFile(file);
                      const res = await fetch("/api/admin/slider", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ url }),
                      });
                      const data = (await res.json().catch(() => null)) as { ok?: boolean; id?: string } | null;
                      if (res.ok && data?.ok && data.id) {
                        setSlider((prev) => [...prev, { id: data.id!, url, order: prev.length }]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-[#333333] outline-none focus:border-[#7C3AED]/50 focus:ring-2 focus:ring-[#7C3AED]/20"
      />
    </label>
  );
}

function ImageField({
  label,
  url,
  onUpload,
}: {
  label: string;
  url: string;
  onUpload: (file: File) => Promise<void>;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <div className="size-16 overflow-hidden rounded-xl bg-zinc-200">
          {url ? <Image src={url} alt="img" width={64} height={64} className="h-full w-full object-cover" /> : null}
        </div>
        <label className="cursor-pointer rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50">
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (!file) return;
              await onUpload(file);
            }}
          />
        </label>
        <div className="truncate text-xs text-zinc-400">{url || "—"}</div>
      </div>
    </div>
  );
}

