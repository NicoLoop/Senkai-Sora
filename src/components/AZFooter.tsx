"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Film, Tv, Layers, Sparkles } from "lucide-react";

interface AZFooterProps {
  activeLetter?: string;
}

const LETTERS = [
  "#",
  "0-9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export function AZFooter({ activeLetter }: AZFooterProps) {
  const normalizedActive = (activeLetter || "").toUpperCase();

  return (
    <footer className="w-full bg-gradient-to-b from-transparent via-[#090810]/95 to-[#050508] border-t border-white/10 pt-10 pb-16 mt-16 text-neutral-400 select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 space-y-8">
        {/* A-Z List Navigation Row */}
        <div className="bg-[#0e0d16]/90 border border-purple-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <h4 className="text-xs sm:text-sm font-black text-white tracking-wider">
                A-Z DIRECTORY
              </h4>
              <span className="text-[11px] text-neutral-500 hidden sm:inline">
                Order by alphabet name A to Z
              </span>
            </div>
            <span className="text-[10px] text-purple-300 font-bold px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30">
              Scraped Catalog
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {LETTERS.map((letter) => {
              const routeParam = letter === "#" || letter === "0-9" ? "0-9" : letter.toLowerCase();
              const isSelected =
                normalizedActive === letter ||
                (letter === "0-9" && (normalizedActive === "#" || normalizedActive === "0-9"));

              return (
                <Link
                  key={letter}
                  href={`/az-list/${routeParam}`}
                  className={`min-w-[32px] sm:min-w-[36px] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.7)] border border-purple-400 scale-105"
                      : "bg-white/5 hover:bg-white/10 hover:text-white text-neutral-300 border border-white/5 hover:border-purple-500/30"
                  }`}
                >
                  {letter}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Brand & Footer Nav */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
          {/* S Logo with Senkai Sora */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer"
            title="Senkai Sora"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.7)] border border-white/30 group-hover:scale-105 transition-transform">
              <span className="text-white text-lg font-black tracking-tighter">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black text-white tracking-tight leading-none">
                Senkai <span className="text-purple-400">Sora</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide mt-1">
                Stream Anime & Cartoons
              </span>
            </div>
          </Link>

          {/* Clean Navigation Links with DMCA */}
          <nav className="flex items-center gap-5 sm:gap-7 text-xs font-semibold flex-wrap justify-center">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <Link href="/animes" className="hover:text-white transition">
              Animes
            </Link>
            <Link href="/cartoon" className="hover:text-white transition">
              Cartoon
            </Link>
            <Link href="/genres" className="hover:text-white transition">
              Genres
            </Link>
            <Link href="/movies" className="hover:text-white transition">
              Movies
            </Link>
            <Link
              href="/dmca"
              className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1 font-bold px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DMCA</span>
            </Link>
            <a
              href="https://github.com/NicoLoop/Senkai-Sora/tree/main"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white transition flex items-center gap-1.5 font-bold px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
              title="Senkai Sora on GitHub"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
          </nav>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-400">
          <p>
            Senkai Sora does not store any files on our servers. All contents are provided by non-affiliated third parties.
          </p>
          <div className="flex items-center gap-4 text-neutral-400">
            <Link href="/dmca" className="hover:text-purple-400 transition">
              DMCA & Takedown
            </Link>
            <span>•</span>
            <span>© 2026 Senkai Sora</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
