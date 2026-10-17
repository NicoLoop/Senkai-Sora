"use client";

import React from "react";
import { Play, Info, Volume2, VolumeX, Sparkles } from "lucide-react";
import { AnimeItem } from "@/data/animeData";

interface HeroBannerProps {
  anime: AnimeItem;
  onPlay: (anime: AnimeItem) => void;
  onMoreInfo: (anime: AnimeItem) => void;
}

export function HeroBanner({ anime, onPlay, onMoreInfo }: HeroBannerProps) {
  const [isMuted, setIsMuted] = React.useState(true);

  return (
    <section className="relative w-full min-h-[580px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[780px] flex items-center overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src={anime.backdrop || anime.image}
          alt={anime.title}
          className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
        />

        {/* Cinematic Multi-Layer Gradient Overlays */}
        {/* Left darkening gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0d] via-[#0a0a0d]/60 to-transparent w-full md:w-3/4" />
        {/* Bottom fade to page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/40 to-transparent" />
        {/* Top subtle vignette for navbar */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0d]/80 via-transparent to-transparent h-32" />
        {/* Ambient warm radial glow */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 pt-24 pb-12 w-full">
        <div className="max-w-2xl lg:max-w-3xl space-y-5">
          {/* Subtle Hindi Dub Available Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-neutral-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hindi Dub Streaming Now</span>
            <span className="text-white/40">•</span>
            <span className="text-purple-300">Episodes 1-28 Complete</span>
          </div>

          {/* Main Title matching the screenshot */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] drop-shadow-md">
            {anime.title}
          </h1>

          {/* Synopsis Description matching the screenshot */}
          <p className="text-neutral-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl md:max-w-2xl font-normal drop-shadow-sm text-balance">
            {anime.synopsis}
          </p>

          {/* Action Buttons matching screenshot */}
          <div className="flex items-center gap-3.5 pt-2 flex-wrap">
            {/* Play Button - White rounded pill */}
            <button
              onClick={() => onPlay(anime)}
              className="group flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:bg-neutral-200 active:scale-95 transition-all shadow-lg hover:shadow-white/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black text-black group-hover:scale-110 transition-transform" />
              <span>Play</span>
            </button>

            {/* More Info Button - Translucent rounded pill */}
            <button
              onClick={() => onMoreInfo(anime)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-sm sm:text-base backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>More Info</span>
            </button>

            {/* Audio Toggle button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-neutral-300 hover:text-white flex items-center justify-center transition-all ml-auto hidden sm:flex cursor-pointer"
              title={isMuted ? "Unmute Preview" : "Mute Preview"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
