"use client";

import React, { useRef } from "react";
import { POPULAR_SLOTHUI } from "@/data/animeData";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

interface PopularShelfProps {
  onSelectAnime: (item: any) => void;
}

export function PopularShelf({ onSelectAnime }: PopularShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -480 : 480;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full pt-2 pb-6 select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Popular on slothUI
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 font-semibold uppercase">
              Featured
            </span>
          </div>

          {/* Left/Right Horizontal Sliding Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleScroll("left")}
              aria-label="Slide Left"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label="Slide Right"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Slider - Single row of columns, no vertical wrapping */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {POPULAR_SLOTHUI.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAnime(item)}
              className="group relative flex flex-col shrink-0 w-[170px] sm:w-[200px] md:w-[220px] cursor-pointer"
            >
              {/* Poster Card with double bezel */}
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#13121b] border border-white/10 group-hover:border-purple-500/50 transition-all duration-300 group-hover:scale-[1.02] shadow-md group-hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.35)]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300"
                />

                {/* Corner S Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-400 p-[1px] shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  <div className="w-full h-full bg-[#0d0c14] rounded-[calc(0.5rem-1px)] flex items-center justify-center">
                    <span className="font-extrabold text-[11px] text-white">
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* Play Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title & metadata without ratings */}
              <div className="pt-2 px-1">
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                  <span>{item.year}</span>
                  <span>•</span>
                  <span>{item.genres[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
