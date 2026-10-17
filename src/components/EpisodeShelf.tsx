"use client";

import React, { useRef } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { EpisodeItem, SeasonInfo } from "@/data/animeData";

interface EpisodeShelfProps {
  seasons: SeasonInfo[];
  selectedSeason: number;
  onSelectSeason: (seasonNumber: number) => void;
  onPlayEpisode: (episode: EpisodeItem, seasonNumber: number) => void;
}

export function EpisodeShelf({
  seasons,
  selectedSeason,
  onSelectSeason,
  onPlayEpisode,
}: EpisodeShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSeasonData =
    seasons.find((s) => s.seasonNumber === selectedSeason) || seasons[0];

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full select-none pt-2 pb-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
        {/* Season Navigation Tabs matching screenshot: Season 1, Season 2, Season 3, Season 4, Season 5 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar py-1">
            {seasons.map((season) => {
              const isActive = season.seasonNumber === selectedSeason;
              return (
                <button
                  key={season.seasonNumber}
                  onClick={() => onSelectSeason(season.seasonNumber)}
                  className={`relative pb-2.5 font-medium text-xs sm:text-sm tracking-tight transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {season.name}
                  {/* Active tab underline indicator matching screenshot */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Carousel Arrow Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => handleScroll("left")}
              aria-label="Scroll Left"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label="Scroll Right"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Episode Cards Shelf matching screenshot */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"
        >
          {activeSeasonData?.episodes.map((ep) => (
            <div
              key={ep.id}
              onClick={() => onPlayEpisode(ep, selectedSeason)}
              className="group relative flex flex-col shrink-0 w-[240px] sm:w-[280px] md:w-[300px] cursor-pointer"
            >
              {/* Double-bezel outer wrapper */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#13121b] border border-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:scale-[1.02] shadow-lg group-hover:shadow-[0_10px_30px_-10px_rgba(147,51,234,0.3)]">
                {/* Thumbnail Image */}
                <img
                  src={ep.image}
                  alt={ep.title}
                  className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300"
                />

                {/* Top-Left [S] Corner Badge matching screenshot */}
                <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-400 p-[1px] shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  <div className="w-full h-full bg-[#0d0c14] rounded-[calc(0.5rem-1px)] flex items-center justify-center">
                    <span className="font-extrabold text-[11px] text-white">
                      S
                    </span>
                  </div>
                </div>

                {/* Duration pill in top right */}
                <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-neutral-300 border border-white/10">
                  {ep.duration}
                </div>

                {/* Play Hover Overlay */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                </div>

                {/* Progress Bar along bottom edge of thumbnail matching screenshot */}
                {ep.progress !== undefined && ep.progress > 0 && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                      style={{ width: `${ep.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Episode Title Label below card matching screenshot */}
              <div className="pt-2 px-1">
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                  {ep.title}
                </h3>
                {ep.synopsis && (
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    {ep.synopsis}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
