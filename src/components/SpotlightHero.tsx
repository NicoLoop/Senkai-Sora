"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, Check, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeItem } from "@/data/animeData";

interface SpotlightHeroProps {
  spotlightList: AnimeItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onPlay?: (anime: AnimeItem) => void;
  onMoreInfo?: (anime: AnimeItem) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (anime: AnimeItem) => void;
}

export function SpotlightHero({
  spotlightList,
  currentIndex,
  onSelectIndex,
  onPlay,
  onMoreInfo,
  isInWatchlist,
  onToggleWatchlist,
}: SpotlightHeroProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Guarantee strictly unique items to prevent any phantom duplicate dots
  const uniqueSpotlightList = useMemo(() => {
    const seen = new Set<string>();
    return spotlightList.filter((item, idx) => {
      const key = item.id || `idx-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [spotlightList]);

  const total = uniqueSpotlightList.length;
  // Strictly clamp index: 0 <= validIndex < total
  const validIndex = total > 0 ? ((currentIndex % total) + total) % total : 0;
  const anime = uniqueSpotlightList[validIndex] || uniqueSpotlightList[0];

  // Auto-slide every 2 seconds (2000ms), paused on hover
  useEffect(() => {
    if (total <= 1 || isHovered) return;
    const interval = setInterval(() => {
      onSelectIndex((validIndex + 1) % total);
    }, 2000);

    return () => clearInterval(interval);
  }, [validIndex, total, isHovered, onSelectIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;
    onSelectIndex((validIndex - 1 + total) % total);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;
    onSelectIndex((validIndex + 1) % total);
  };

  const handleNavigate = () => {
    if (!anime?.id) return;
    const clean = anime.id.replace(/^\/+|\/+$/g, "");
    router.push(`/${clean}`);
  };

  if (!anime) return null;

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full min-h-[520px] sm:min-h-[580px] md:min-h-[640px] lg:min-h-[680px] flex items-center overflow-hidden select-none pt-14 md:pt-16"
    >
      {/* Background Artwork with Slide-Left Animation & Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          key={`hero-bg-${anime.id || validIndex}`}
          src={anime.backdrop || anime.image}
          alt={anime.title}
          className="w-full h-full object-cover object-[75%_center] filter brightness-[0.92] contrast-[1.08] pointer-events-none animate-hero-bg"
        />

        {/* Left Dark Gradient Overlay for optimal text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-[#08080c]/85 via-45% md:via-52% to-transparent w-full md:w-[72%]" />

        {/* Bottom Fade Overlay for seamless blend into shelves */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#08080c] via-[#08080c]/80 to-transparent" />

        {/* Top Vignette Overlay for top floating navigation */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#08080c]/80 to-transparent" />

        {/* Ambient Purple Atmospheric Glow */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Hero Content Overlay with Slide-Left Animation */}
      <div
        key={`hero-content-${anime.id || validIndex}`}
        className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 py-10 w-full animate-slide-left"
      >
        <div className="max-w-xl lg:max-w-2xl space-y-4">
          {/* Real Anime Title from API - Click to navigate */}
          <h1
            onClick={handleNavigate}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-tight text-white leading-[1.06] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] font-display cursor-pointer hover:text-purple-200 transition-colors"
          >
            {anime.title}
          </h1>

          {/* Clean Metadata: Season & Genres from API (NO fake year like 2028, NO rating, NO slothui tag) */}
          <div className="flex items-center gap-2.5 text-xs text-neutral-300 flex-wrap">
            {anime.seasonsCountText ? (
              <span className="px-3 py-1 rounded-full border border-purple-400/40 text-purple-200 font-semibold bg-purple-950/40 backdrop-blur-md shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                {anime.seasonsCountText}
              </span>
            ) : null}

            {anime.genres && anime.genres.length > 0 ? (
              anime.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full border border-white/20 text-neutral-200 text-xs font-medium bg-white/5 backdrop-blur-sm"
                >
                  {g}
                </span>
              ))
            ) : null}
          </div>

          {/* Real Synopsis from API */}
          {anime.synopsis ? (
            <p className="text-neutral-300 text-xs sm:text-sm md:text-[15px] leading-relaxed max-w-lg md:max-w-xl font-normal drop-shadow-md text-balance line-clamp-3 sm:line-clamp-4">
              {anime.synopsis}
            </p>
          ) : null}

          {/* 3D Action Buttons: Play Now, Watchlist (+), Info (ⓘ) */}
          <div className="flex items-center gap-3 pt-3 flex-wrap">
            {/* 3D Glossy Play Button with hover glow -> Navigates to /[id] */}
            <button
              onClick={handleNavigate}
              className="group relative flex items-center gap-3 pl-2 pr-6 py-2 rounded-full bg-gradient-to-b from-white/25 via-white/15 to-white/10 hover:from-white/35 hover:to-white/20 border-t border-l border-white/40 border-r border-b border-white/10 backdrop-blur-xl text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:scale-105 shadow-md">
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              </div>
              <span className="tracking-tight text-white font-semibold">
                Play Now
              </span>
            </button>

            {/* Watchlist (+) 3D Glass Button */}
            <button
              onClick={() => onToggleWatchlist(anime)}
              className={`w-11 h-11 rounded-full border-t border-l flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                isInWatchlist
                  ? "bg-purple-600/40 border-purple-300 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                  : "bg-white/10 hover:bg-white/20 border-white/30 border-r border-b border-white/10 text-white backdrop-blur-md hover:border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)]"
              }`}
              title={isInWatchlist ? "Remove from List" : "Add to Watchlist"}
            >
              {isInWatchlist ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>

            {/* Info (ⓘ) 3D Glass Button -> Navigates to /[id] */}
            <button
              onClick={handleNavigate}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border-t border-l border-white/30 border-r border-b border-white/10 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 hover:border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)] cursor-pointer"
              title="More Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Navigation Dots on Right Edge - Clean, Absolutely NO background container, strictly ONE active dot */}
      {total > 1 && (
        <div
          aria-label="Spotlight carousel navigation"
          className="absolute right-4 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5 bg-transparent p-0 m-0 border-0"
        >
          {uniqueSpotlightList.map((item, idx) => {
            const isActive = idx === validIndex;
            return (
              <button
                key={`spotlight-dot-${item.id || idx}`}
                onClick={() => onSelectIndex(idx)}
                aria-label={`Go to slide ${idx + 1}: ${item.title}`}
                title={item.title}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-2.5 h-7 bg-white shadow-[0_0_14px_rgba(255,255,255,0.95)]"
                    : "w-2.5 h-2.5 bg-white/30 hover:bg-white/80 hover:scale-125"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* 2 Arrow Buttons in Bottom Right of Spotlight Div to change slides */}
      {total > 1 && (
        <div className="absolute bottom-6 right-8 sm:right-12 z-20 flex items-center gap-2.5">
          <button
            onClick={handlePrev}
            aria-label="Previous Spotlight Anime"
            title="Previous"
            className="w-10 h-10 rounded-full bg-gradient-to-b from-[#1c1b26]/90 to-[#100f18]/95 hover:from-white/20 hover:to-white/10 border-t border-l border-white/25 border-r border-b border-white/10 backdrop-blur-2xl text-white flex items-center justify-center transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:border-purple-400/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-90 active:translate-y-[1px] cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-200 hover:text-white" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Spotlight Anime"
            title="Next"
            className="w-10 h-10 rounded-full bg-gradient-to-b from-[#1c1b26]/90 to-[#100f18]/95 hover:from-white/20 hover:to-white/10 border-t border-l border-white/25 border-r border-b border-white/10 backdrop-blur-2xl text-white flex items-center justify-center transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:border-purple-400/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-90 active:translate-y-[1px] cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-neutral-200 hover:text-white" />
          </button>
        </div>
      )}
    </section>
  );
}
