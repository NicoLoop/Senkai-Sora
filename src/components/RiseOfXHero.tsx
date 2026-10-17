"use client";

import React from "react";
import { Play, Info, Tv } from "lucide-react";
import { AnimeItem } from "@/data/animeData";

interface RiseOfXHeroProps {
  anime: AnimeItem;
  onPlay: (anime: AnimeItem) => void;
  onMoreInfo: (anime: AnimeItem) => void;
}

export function RiseOfXHero({ anime, onPlay, onMoreInfo }: RiseOfXHeroProps) {
  return (
    <section className="relative w-full min-h-[500px] sm:min-h-[580px] md:min-h-[640px] flex items-center overflow-hidden">
      {/* Background with lightsaber storm visual */}
      <div className="absolute inset-0 z-0">
        <img
          src={anime.backdrop || anime.image}
          alt={anime.title}
          className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.1] select-none pointer-events-none"
        />

        {/* Ambient Dark Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-[#08080c]/70 via-40% to-transparent w-full md:w-3/5" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 py-10 w-full">
        <div className="max-w-xl space-y-4 text-center sm:text-left mx-auto sm:mx-0">
          {/* Tag: [S] slothui original */}
          <div className="inline-flex items-center gap-2 px-1 py-0.5 justify-center sm:justify-start">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-400 p-[1px] flex items-center justify-center">
              <span className="font-extrabold text-[10px] text-white">S</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-white">slothui</span>
              <span className="text-neutral-400">original</span>
            </div>
          </div>

          {/* Title: RISE OF X */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-none uppercase drop-shadow-xl">
            {anime.title}
          </h1>

          {/* Metadata: 2028  82 Seasons  TV-MA */}
          <div className="flex items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-neutral-300">
            <span>{anime.year}</span>
            <span>{anime.seasonsCountText || "82 Seasons"}</span>
            <span className="px-2 py-0.5 rounded-md border border-white/20 text-neutral-200 text-xs font-semibold bg-white/5">
              {anime.genres[0]}
            </span>
          </div>

          {/* #1 in TV Shows Today Banner matching mobile screenshot */}
          <div className="inline-flex items-center justify-center sm:justify-start gap-2 text-white font-bold text-xs sm:text-sm pt-1">
            <Tv className="w-4 h-4 text-neutral-300" />
            <span>#1 in TV Shows Today</span>
          </div>

          {/* Buttons: Play (white pill) & More Info (glass pill) matching mobile screenshot */}
          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
            <button
              onClick={() => onPlay(anime)}
              className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 active:scale-95 transition cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Play</span>
            </button>

            <button
              onClick={() => onMoreInfo(anime)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-md active:scale-95 transition cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
