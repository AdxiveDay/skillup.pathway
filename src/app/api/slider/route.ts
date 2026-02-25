import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { SliderImage } from "@/models/SliderImage";

export const runtime = "nodejs";

export async function GET() {
  await connectToDb();
  const items = await SliderImage.find({}).sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({
    ok: true,
    images: items.map((i) => ({ id: i._id.toString(), url: i.url, order: i.order })),
  });
}

