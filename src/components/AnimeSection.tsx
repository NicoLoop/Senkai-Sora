"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeItem } from "@/data/animeData";
import { AnimeCard } from "./AnimeCard";

interface AnimeSectionProps {
  title: string;
  items: AnimeItem[];
  showProgress?: boolean;
  myListIds: Set<string>;
  onToggleMyList: (anime: AnimeItem) => void;
  onSelectAnime: (anime: AnimeItem) => void;
}

export function AnimeSection({
  title,
  items,
  showProgress = false,
  myListIds,
  onToggleMyList,
  onSelectAnime,
}: AnimeSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -480 : 480;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full py-4 group/section select-none">
      {/* Section Header with Left/Right Horizontal Sliding Arrows */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs font-normal text-neutral-400">({items.length})</span>
        </h2>

        {/* Carousel Scroll Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
            aria-label="Slide left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
            aria-label="Slide right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Slide Row - One card per column, no vertical wrapping */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
      >
        {items.map((anime) => (
          <div
            key={anime.id}
            className="w-[240px] sm:w-[280px] md:w-[300px] shrink-0"
          >
            <AnimeCard
              anime={anime}
              showProgress={showProgress}
              isInMyList={myListIds.has(anime.id)}
              onToggleMyList={onToggleMyList}
              onSelect={onSelectAnime}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
