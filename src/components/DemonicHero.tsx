"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Check, Info } from "lucide-react";
import { AnimeItem } from "@/data/animeData";

interface DemonicHeroProps {
  spotlightList: AnimeItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onPlay: (anime: AnimeItem) => void;
  onMoreInfo: (anime: AnimeItem) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (anime: AnimeItem) => void;
}

export function DemonicHero({
  spotlightList,
  currentIndex,
  onSelectIndex,
  onPlay,
  onMoreInfo,
  isInWatchlist,
  onToggleWatchlist,
}: DemonicHeroProps) {
  const [isHovered, setIsHovered] = useState(false);

  const anime = spotlightList[currentIndex] || spotlightList[0];

  // Auto-scroll spotlight every 7 seconds when not hovered
  useEffect(() => {
    if (spotlightList.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      onSelectIndex((currentIndex + 1) % spotlightList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [currentIndex, spotlightList.length, isHovered, onSelectIndex]);

  if (!anime) return null;

  const isDemonSlayer =
    anime.id.toLowerCase().includes("demon-slayer") ||
    anime.title.toLowerCase().includes("demon slayer") ||
    anime.title.toLowerCase().includes("demonic slash");

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full min-h-[520px] sm:min-h-[580px] md:min-h-[640px] lg:min-h-[700px] flex items-center overflow-hidden select-none"
    >
      {/* Background Anime Artwork with Multi-Layer Cinematic Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          key={anime.id || currentIndex}
          src={anime.backdrop || anime.image}
          alt={anime.title}
          className="w-full h-full object-cover object-[75%_center] filter brightness-[0.95] contrast-[1.08] pointer-events-none transition-opacity duration-700 ease-in-out"
        />

        {/* Left Dark Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-[#08080c]/85 via-45% md:via-52% to-transparent w-full md:w-[72%]" />

        {/* Bottom Fade Overlay for seamless transition into the bottom shelf */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#08080c] via-[#08080c]/80 to-transparent" />

        {/* Top Vignette Overlay */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#08080c]/70 to-transparent" />

        {/* Ambient Purple Atmospheric Glow */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 pt-8 pb-12 w-full">
        <div className="max-w-xl lg:max-w-2xl space-y-4 sm:space-y-5">
          {/* Badge: [S] slothui original */}
          <div className="inline-flex items-center gap-2 px-1 py-0.5">
            {/* Custom squircle S badge */}
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-400 p-[1px] shadow-[0_0_10px_rgba(147,51,234,0.4)] flex items-center justify-center">
              <span className="font-extrabold text-[10px] text-white">S</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs tracking-tight">
              <span className="font-bold text-white">slothui</span>
              <span className="text-neutral-400 font-normal">original</span>
            </div>
          </div>

          {/* Title: Ornate Gothic for Demonic Slash / Demon Slayer, clean display for others */}
          <h1
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-normal text-white leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] transition-all duration-300 ${
              isDemonSlayer ? "font-gothic" : "font-display"
            }`}
          >
            {anime.title}
          </h1>

          {/* Metadata Row: Year • Season Count • Type Pill (Rating removed as requested) */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-300 flex-wrap">
            <span className="font-medium text-neutral-200">{anime.year}</span>
            <span className="font-medium text-neutral-200">
              {anime.seasonsCountText || `${anime.episodes || 12} Seasons`}
            </span>

            {/* Outline tag pill: Cartoon / Anime */}
            <span className="px-2.5 py-0.5 rounded-full border border-white/20 text-neutral-200 text-xs font-medium bg-white/5 backdrop-blur-sm">
              {anime.genres[0] || "Cartoon"}
            </span>
          </div>

          {/* Synopsis Description from API */}
          <p className="text-neutral-300 text-xs sm:text-sm md:text-[15px] leading-relaxed max-w-lg md:max-w-xl font-normal drop-shadow-md text-balance line-clamp-3 sm:line-clamp-4">
            {anime.synopsis}
          </p>

          {/* Action Buttons: Play S1:E1, Plus, Info */}
          <div className="flex items-center gap-3 pt-3 flex-wrap">
            {/* Play Button matching screenshot with circular icon + text */}
            <button
              onClick={() => onPlay(anime)}
              className="group relative flex items-center gap-3 pl-2 pr-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-white/20 group-hover:bg-white flex items-center justify-center transition-colors shadow-inner">
                <Play className="w-4 h-4 fill-white text-white group-hover:fill-black group-hover:text-black transition-colors ml-0.5" />
              </div>
              <span className="tracking-tight text-white font-medium">
                Play S1:E1
              </span>
            </button>

            {/* Add to Watchlist (+) Circular Button */}
            <button
              onClick={() => onToggleWatchlist(anime)}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                isInWatchlist
                  ? "bg-purple-600/30 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "bg-white/10 hover:bg-white/20 border-white/15 text-white backdrop-blur-md"
              }`}
              title={isInWatchlist ? "Remove from List" : "Add to Watchlist"}
            >
              {isInWatchlist ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>

            {/* Info (ⓘ) Circular Button */}
            <button
              onClick={() => onMoreInfo(anime)}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
              title="More Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Navigation Dots on Right Corner matching user requirement */}
      {spotlightList.length > 1 && (
        <div
          aria-label="Spotlight carousel navigation"
          className="absolute right-4 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5 p-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10"
        >
          {spotlightList.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={item.id || idx}
                onClick={() => onSelectIndex(idx)}
                aria-label={`Show ${item.title}`}
                title={item.title}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-2.5 h-7 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                    : "w-2.5 h-2.5 bg-white/30 hover:bg-white/70 hover:scale-125"
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
