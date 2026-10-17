"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { fetchGenresList, ApiGenreItem } from "@/services/api";
import {
  Layers,
  Sparkles,
  Search,
  ArrowRight,
  Flame,
  Film,
  Tv,
} from "lucide-react";

const FEATURED_GENRES = [
  "Action",
  "Adventure",
  "Supernatural",
  "Fantasy",
  "Comedy",
  "Romance",
  "Sci-Fi",
  "Mystery",
  "Shounen",
  "Isekai",
  "Horror",
  "Drama",
];

export default function GenresPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("browse");
  const [activeNav, setActiveNav] = useState("genres");
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [genres, setGenres] = useState<ApiGenreItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadGenres() {
      try {
        const list = await fetchGenresList();
        if (list && list.length > 0 && isMounted) {
          setGenres(list);
        }
      } catch (err) {
        console.error("Failed to load genres:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredGenres = useMemo(() => {
    if (!genreFilter.trim()) return genres;
    return genres.filter((g) =>
      g.name.toLowerCase().includes(genreFilter.toLowerCase())
    );
  }, [genres, genreFilter]);

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      <SidebarRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
          if (tab === "browse") router.push("/genres");
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6 relative">
        <FloatingNavbar
          activeNav={activeNav}
          onNavClick={(nav) => {
            setActiveNav(nav);
            if (nav === "home") router.push("/");
            if (nav === "movies") router.push("/movies");
            if (nav === "genres") router.push("/genres");
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 pt-24 pb-12">
          {/* Hero Header */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/70 via-[#131122] to-[#0d0c18] border border-purple-500/25 p-6 sm:p-10 mb-10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-400/30 text-purple-200 text-xs font-bold tracking-wider uppercase">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Full Taxonomy Directory</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Explore 86+ Anime & Cartoon Categories
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Discover your next favorite anime series and movies by genre. From adrenaline-packed Action and high-fantasy Isekai to cozy Slice of Life and romance, all scraped directly with multi-audio dubs.
              </p>

              {/* Genre Search Bar */}
              <div className="pt-3 max-w-md">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-purple-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    placeholder="Search genres (e.g. Action, Isekai, Romance)..."
                    className="w-full bg-[#161426] border border-purple-500/30 rounded-2xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition shadow-inner"
                  />
                  {genreFilter && (
                    <button
                      onClick={() => setGenreFilter("")}
                      className="absolute right-3 text-xs text-neutral-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Featured Popular Genres Rail */}
          {!genreFilter && (
            <div className="mb-10 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  Most Popular Categories
                </h2>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                {FEATURED_GENRES.map((name) => {
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  return (
                    <Link
                      key={name}
                      href={`/genre/${slug}`}
                      className="group px-4 py-2.5 rounded-2xl bg-gradient-to-br from-purple-900/40 to-[#151324] hover:from-purple-600 hover:to-indigo-600 border border-purple-500/30 hover:border-purple-400 text-neutral-200 hover:text-white text-xs font-bold transition-all duration-300 shadow-md hover:shadow-[0_4px_20px_rgba(147,51,234,0.5)] flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-105"
                    >
                      <span>{name}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* All 86 Genres Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                All Categories ({filteredGenres.length})
              </h2>
              {genreFilter && (
                <span className="text-xs text-purple-300 font-medium">
                  Filtering for "{genreFilter}"
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-[#12111b] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredGenres.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredGenres.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/genre/${g.slug}`}
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 hover:bg-[#1a1728] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(147,51,234,0.25)] hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {g.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 group-hover:text-neutral-400 transition-colors uppercase tracking-wider">
                        Anime & Series
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-white/5 group-hover:bg-purple-600 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-white transition-all">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500">
                No genre matching "{genreFilter}" found.
              </div>
            )}
          </div>
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
          if (tab === "browse") router.push("/genres");
        }}
        myListCount={0}
      />
    </div>
  );
}
