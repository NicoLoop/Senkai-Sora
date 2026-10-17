"use client";

import React, { useState } from "react";
import { Play, Plus, Check } from "lucide-react";
import { AnimeItem } from "@/data/animeData";

interface AnimeCardProps {
  anime: AnimeItem;
  showProgress?: boolean;
  isInMyList?: boolean;
  onToggleMyList?: (anime: AnimeItem) => void;
  onSelect: (anime: AnimeItem) => void;
}

export function AnimeCard({
  anime,
  showProgress = false,
  isInMyList = false,
  onToggleMyList,
  onSelect,
}: AnimeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={() => onSelect(anime)}
      className="group flex flex-col cursor-pointer select-none w-full transition-all duration-300"
    >
      {/* Poster Image Container - 16:9 or aspect-video */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#14131d] border border-white/10 group-hover:border-purple-500/40 transition-all duration-300 shadow-md group-hover:shadow-[0_10px_30px_-5px_rgba(147,51,234,0.35)] group-hover:scale-[1.025]">
        {/* Poster Image */}
        <img
          src={anime.backdrop || anime.image}
          alt={anime.title}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 filter brightness-[0.92] group-hover:brightness-100 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Skeleton while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
        )}


        {/* Optional Season or Episode pill if present */}
        {anime.badge && anime.badge !== "Hindi Dub" && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 backdrop-blur-md border border-white/10 text-neutral-300">
            {anime.badge}
          </div>
        )}

        {/* Hover Dark Gradient Overlay & Quick Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>

          {/* Add to My List Button */}
          {onToggleMyList && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMyList(anime);
              }}
              className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isInMyList
                  ? "bg-purple-600 text-white"
                  : "bg-black/60 border border-white/20 text-white hover:bg-black/90"
              }`}
              title={isInMyList ? "Remove from List" : "Add to List"}
            >
              {isInMyList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Progress Bar for watch history / continue watching */}
        {showProgress && anime.progress !== undefined && anime.progress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
              style={{ width: `${anime.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Anime Title underneath - Clean, without rating or dub tags */}
      <div className="mt-2 px-1">
        <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white truncate transition-colors">
          {anime.title}
        </h3>
        {anime.synopsis && (
          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
            {anime.synopsis}
          </p>
        )}
      </div>
    </div>
  );
}
