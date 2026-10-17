"use client";

import React from "react";
import { GENRES } from "@/data/animeData";

interface GenreFilterProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

export function GenreFilter({ selectedGenre, onSelectGenre }: GenreFilterProps) {
  return (
    <div className="w-full py-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2.5 min-w-max pb-1">
        {GENRES.map((genre) => {
          const isSelected = selectedGenre === genre;
          return (
            <button
              key={genre}
              onClick={() => onSelectGenre(genre)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-white text-black shadow-md hover:bg-neutral-100 scale-105"
                  : "bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 hover:border-white/20"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
