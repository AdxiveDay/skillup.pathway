import { redirect } from "next/navigation";
import { StartButton } from "@/components/StartButton";
import { HomeSliderStrip } from "@/components/HomeSliderStrip";
import { connectToDb } from "@/lib/db";
import { getUserSessionFromCookies } from "@/lib/session";
import { SliderImage } from "@/models/SliderImage";

export default async function Home() {
  const session = await getUserSessionFromCookies();
  if (session) redirect("/main");

  await connectToDb();
  const items = await SliderImage.find({}).sort({ order: 1, createdAt: 1 }).lean();
  const images = items.map((i) => ({ id: i._id.toString(), url: i.url }));

  return (
    <div className="paper-grid-bg--fine min-h-dvh w-full overflow-hidden">
      <main className="mx-auto flex min-h-dvh max-w-6xl flex-col items-center justify-start px-6 pt-36">
        <h1 className="text-center text-5xl font-semibold tracking-tight text-zinc-700 md:text-6xl">
          <span className="text-zinc-700 font-medium">เส้นทางสู่ </span>
          <span className="text-[#7C3AED]">วิศวะคอม</span>
        </h1>

        <div className="mt-8">
          <StartButton />
        </div>

        <div className="mt-16 w-full">
          <div className="mx-auto max-w-5xl">
            <HomeSliderStrip items={images} />
          </div>
        </div>
      </main>
    </div>
  );
}
