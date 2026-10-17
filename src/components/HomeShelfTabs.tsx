"use client";

import React, { useRef } from "react";
import { Play, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { AnimeItem, EpisodeItem } from "@/data/animeData";

export type HomeTabType = "history" | "popular" | "new" | "airing";

interface HomeShelfTabsProps {
  activeTab: HomeTabType;
  onTabChange: (tab: HomeTabType) => void;
  watchHistoryItems: EpisodeItem[];
  popularItems: AnimeItem[];
  newItems: AnimeItem[];
  airingItems: AnimeItem[];
  onPlayEpisode: (episode: EpisodeItem) => void;
  onSelectAnime: (anime: AnimeItem) => void;
}

export function HomeShelfTabs({
  activeTab,
  onTabChange,
  watchHistoryItems,
  popularItems,
  newItems,
  airingItems,
  onPlayEpisode,
  onSelectAnime,
}: HomeShelfTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs: Array<{ id: HomeTabType; label: string }> = [
    { id: "history", label: "Watch History" },
    { id: "popular", label: "Popular" },
    { id: "new", label: "New" },
    { id: "airing", label: "Airing" },
  ];

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -480 : 480;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full select-none pt-2 pb-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
        {/* Navigation Tabs: Watch History, Popular, New, Airing */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative pb-2.5 font-medium text-xs sm:text-sm tracking-tight transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {tab.label}
                  {/* Active tab underline indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Left/Right Horizontal Scroll Controls */}
          <div className="flex items-center gap-1.5">
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

        {/* Single Row Horizontal Sliding Container - Strictly one card per column, no vertical wrapping */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {activeTab === "history" && watchHistoryItems.length === 0 && (
            <div className="w-full py-12 px-4 rounded-2xl bg-[#0e0d16]/60 border border-white/5 flex flex-col items-center justify-center text-center">
              <Clock className="w-9 h-9 text-neutral-600 mb-2.5 stroke-[1.5]" />
              <p className="text-sm font-semibold text-neutral-300">
                Nothing on Watch history
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Episodes and movies you watch will show up here so you can pick up where you left off.
              </p>
            </div>
          )}

          {activeTab === "history" &&
            watchHistoryItems.map((ep) => (
              <div
                key={ep.id}
                onClick={() => onPlayEpisode(ep)}
                className="group relative flex flex-col shrink-0 w-[240px] sm:w-[280px] md:w-[300px] cursor-pointer"
              >
                {/* 16:9 Thumbnail with double-bezel */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#13121b] border border-white/10 group-hover:border-purple-500/40 transition-all duration-300 group-hover:scale-[1.02] shadow-md group-hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.35)]">
                  <img
                    src={ep.image}
                    alt={ep.title}
                    className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300"
                  />


                  {/* Duration pill */}
                  {ep.duration && (
                    <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-neutral-300 border border-white/10">
                      {ep.duration}
                    </div>
                  )}

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Progress Bar along bottom edge */}
                  {ep.progress !== undefined && ep.progress > 0 && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                        style={{ width: `${ep.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Title Label - Clean without rating or dub tag */}
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

          {activeTab !== "history" &&
            (activeTab === "popular"
              ? popularItems
              : activeTab === "new"
              ? newItems
              : airingItems
            ).map((anime) => (
              <div
                key={anime.id}
                onClick={() => onSelectAnime(anime)}
                className="group relative flex flex-col shrink-0 w-[240px] sm:w-[280px] md:w-[300px] cursor-pointer"
              >
                {/* 16:9 Thumbnail with double-bezel */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#13121b] border border-white/10 group-hover:border-purple-500/40 transition-all duration-300 group-hover:scale-[1.02] shadow-md group-hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.35)]">
                  <img
                    src={anime.backdrop || anime.image}
                    alt={anime.title}
                    className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300"
                  />


                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Optional progress bar for airing */}
                  {anime.progress !== undefined && anime.progress > 0 && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                        style={{ width: `${anime.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Title Label - Clean without rating or dub tag */}
                <div className="pt-2 px-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                    {anime.title}
                  </h3>
                  {anime.synopsis && (
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                      {anime.synopsis}
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
