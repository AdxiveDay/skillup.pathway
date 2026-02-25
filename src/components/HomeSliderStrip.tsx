"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type SliderImageItem = { id: string; url: string };

export function HomeSliderStrip({ items }: { items: SliderImageItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || items.length === 0) return;

    let direction: 1 | -1 = 1;
    const speed = 0.5; // px per frame
    let frameId: number;

    const tick = () => {
      if (!el) return;
      el.scrollLeft += direction * speed;

      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        direction = -1;
      } else if (el.scrollLeft <= 0) {
        direction = 1;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [items.length]);

  const list = items.length
    ? items
    : Array.from({ length: 5 }).map((_, idx) => ({ id: `placeholder-${idx}`, url: "" }));

  return (
    <div ref={containerRef} className="w-full overflow-x-auto py-3 scrollbar-hide">
      <div className="flex min-w-max items-center justify-center gap-8 px-4">
        {list.map((img) => (
          <div
            key={img.id}
            className={cn(
              "size-[173px] shrink-0 overflow-hidden rounded-3xl bg-zinc-300/80",
              img.url && "bg-transparent",
            )}
          >
            {img.url ? (
              <Image
                src={img.url}
                alt="slide"
                width={173}
                height={173}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

