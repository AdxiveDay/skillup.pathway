import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import path from "path";
import { getAdminSessionFromCookies, getUserSessionFromCookies } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const isAuthed = Boolean((await getAdminSessionFromCookies()) || (await getUserSessionFromCookies()));
  if (!isAuthed) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "INVALID_FORM" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "MISSING_FILE" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filename = `${nanoid(12)}-${safeName}`;

  const outPath = path.join(process.cwd(), "public", "uploads", filename);
  await writeFile(outPath, buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}

