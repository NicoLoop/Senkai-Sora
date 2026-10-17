"use client";

import React from "react";
import { X, Play, Bookmark, Star, Calendar, Clock, Film } from "lucide-react";
import { AnimeItem } from "@/data/animeData";

interface InfoModalProps {
  anime: AnimeItem | null;
  onClose: () => void;
  onPlay: (anime: AnimeItem) => void;
  isInMyList: boolean;
  onToggleMyList: (anime: AnimeItem) => void;
}

export function InfoModal({
  anime,
  onClose,
  onPlay,
  isInMyList,
  onToggleMyList,
}: InfoModalProps) {
  if (!anime) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#111116] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner with Close button */}
        <div className="relative aspect-[21/9] w-full bg-neutral-900 overflow-hidden">
          <img
            src={anime.backdrop || anime.image}
            alt={anime.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-[#111116]/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/75 border border-white/15 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Content */}
        <div className="p-6 sm:p-8 -mt-12 relative z-10 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
              Hindi Dubbed
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {anime.rating}
            </span>
            <span className="text-neutral-400 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {anime.year}
            </span>
            <span className="text-neutral-400 text-xs flex items-center gap-1">
              <Film className="w-3.5 h-3.5" />
              {anime.episodes} Episodes
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {anime.title}
            </h2>
            {anime.originalTitle && (
              <p className="text-xs text-neutral-400 mt-1 italic">{anime.originalTitle}</p>
            )}
          </div>

          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            {anime.synopsis}
          </p>

          {/* Genre Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Genres & Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-neutral-300"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-4 pt-3 border-t border-white/10">
            <button
              onClick={() => {
                onClose();
                onPlay(anime);
              }}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-full bg-white text-black font-bold hover:bg-neutral-200 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black text-black" />
              <span>Watch Now (Hindi Dub)</span>
            </button>

            <button
              onClick={() => onToggleMyList(anime)}
              className={`px-5 py-3 rounded-full border flex items-center gap-2 text-sm font-semibold transition cursor-pointer ${
                isInMyList
                  ? "bg-purple-600/30 border-purple-500 text-purple-300"
                  : "bg-white/5 border-white/15 text-white hover:bg-white/10"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{isInMyList ? "In My List" : "Add to List"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
