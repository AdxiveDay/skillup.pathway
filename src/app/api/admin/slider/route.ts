import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDb } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/session";
import { SliderImage } from "@/models/SliderImage";

export const runtime = "nodejs";

const CreateSchema = z.object({ url: z.string().min(1) });
const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), order: z.number().int().nonnegative() })),
});

export async function GET() {
  const admin = await getAdminSessionFromCookies();
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  await connectToDb();
  const items = await SliderImage.find({}).sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({
    ok: true,
    images: items.map((i) => ({ id: i._id.toString(), url: i.url, order: i.order })),
  });
}

export async function POST(req: Request) {
  const admin = await getAdminSessionFromCookies();
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });

  await connectToDb();
  const last = await SliderImage.findOne({}).sort({ order: -1 }).lean();
  const order = last ? last.order + 1 : 0;
  const created = await SliderImage.create({ url: parsed.data.url, order });
  return NextResponse.json({ ok: true, id: created._id.toString() });
}

export async function PATCH(req: Request) {
  const admin = await getAdminSessionFromCookies();
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });

  await connectToDb();
  await Promise.all(parsed.data.items.map((it) => SliderImage.updateOne({ _id: it.id }, { $set: { order: it.order } })));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getAdminSessionFromCookies();
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });

  await connectToDb();
  await SliderImage.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}

