"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { fetchHomeFeed, mapFeedCardToAnimeItem } from "@/services/api";
import { AnimeItem } from "@/data/animeData";
import { Flame, Play, Star, Sparkles, Trophy } from "lucide-react";

export default function TrendingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("trending");
  const [activeNav, setActiveNav] = useState("animes");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [trendingSeries, setTrendingSeries] = useState<AnimeItem[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<AnimeItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "series" | "movies">("all");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const feed = await fetchHomeFeed();
        if (feed && feed.success && feed.data && isMounted) {
          if (feed.data["most-popular"]) {
            setTrendingSeries(
              feed.data["most-popular"].map((item) =>
                mapFeedCardToAnimeItem(item, "Trending")
              )
            );
          }
          if (feed.data["most-popular-movies"]) {
            setTrendingMovies(
              feed.data["most-popular-movies"].map((item) =>
                mapFeedCardToAnimeItem(item, "Movie")
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to load trending items:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedItems =
    selectedFilter === "movies"
      ? trendingMovies
      : selectedFilter === "series"
      ? trendingSeries
      : [...trendingSeries, ...trendingMovies];

  const handleCardClick = (item: AnimeItem) => {
    const cleanId = item.id.replace(/^\/+|\/+$/g, "");
    if (cleanId.startsWith("movies/") || cleanId.startsWith("movie/")) {
      router.push(`/watch/${cleanId}`);
    } else {
      router.push(`/${cleanId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      <SidebarRail activeTab={activeTab} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6 relative">
        <FloatingNavbar
          activeNav={activeNav}
          onNavClick={(nav) => {
            setActiveNav(nav);
            if (nav === "home") router.push("/");
            if (nav === "animes") router.push("/animes");
            if (nav === "cartoon") router.push("/cartoon");
            if (nav === "genres") router.push("/genres");
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 pt-24 pb-12">
          {/* Header Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-[#141224] to-[#0c0b16] border border-purple-500/30 p-6 sm:p-10 mb-8 shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-400/30 text-purple-200 text-xs font-bold tracking-wider uppercase">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Top Chart</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Trending Anime & Movies
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300">
                Most watched anime shows and box-office anime movies ranked by daily viewers.
              </p>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 pt-2">
                {[
                  { id: "all", label: "All Trending" },
                  { id: "series", label: "Top Series" },
                  { id: "movies", label: "Top Movies" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id as any)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedFilter === f.id
                        ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] border border-purple-400"
                        : "bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#12111b] border border-white/5 overflow-hidden animate-pulse flex flex-col"
                >
                  <div className="aspect-[3/4] bg-white/5 w-full" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {displayedItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(147,51,234,0.25)] hover:-translate-y-1 cursor-pointer"
                >
                  {/* Poster */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Rank Badge */}
                    <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xs text-white shadow">
                      #{idx + 1}
                    </div>


                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-purple-950/40">
                      <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 ml-0.5 fill-white" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-purple-400 font-medium mt-1">
                      {item.genres?.[0] || "Hindi Dub"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-neutral-500">
              No trending anime found.
            </div>
          )}
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav activeTab={activeTab} />
    </div>
  );
}
