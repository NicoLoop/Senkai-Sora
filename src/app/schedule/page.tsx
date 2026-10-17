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
import { Radio, Play, Sparkles, Tv, Flame, Clock } from "lucide-react";

export default function CurrentlyAiringPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("schedule");
  const [activeNav, setActiveNav] = useState("animes");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [airingAnime, setAiringAnime] = useState<AnimeItem[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "airing" | "newest">("all");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const feed = await fetchHomeFeed();
        if (feed && feed.success && feed.data && isMounted) {
          const airing = (feed.data["airing"] || []).map((c) =>
            mapFeedCardToAnimeItem(c, "Airing")
          );
          const newest = (feed.data["newest-drops"] || []).map((c) =>
            mapFeedCardToAnimeItem(c, "New")
          );
          const popular = (feed.data["most-popular"] || []).map((c) =>
            mapFeedCardToAnimeItem(c, "Popular")
          );

          // Merge unique by id
          const seen = new Set<string>();
          const combined: AnimeItem[] = [];
          for (const item of [...airing, ...newest, ...popular]) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              combined.push(item);
            }
          }

          setAiringAnime(combined);
        }
      } catch (err) {
        console.error("Failed to load airing anime:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedAnime = React.useMemo(() => {
    if (filterMode === "airing") {
      return airingAnime.filter((a) => a.badge === "Airing");
    }
    if (filterMode === "newest") {
      return airingAnime.filter((a) => a.badge === "New" || a.badge === "Popular");
    }
    return airingAnime;
  }, [airingAnime, filterMode]);

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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Radio className="w-3.5 h-3.5" />
                <span>Broadcasting Now</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Currently Airing Anime
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Catch up with currently ongoing series, seasonal weekly simulcasts, and newly dropped broadcast episodes streaming in real-time.
              </p>

              {/* Quick Filter Pills */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterMode === "all"
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                      : "bg-white/5 hover:bg-white/10 text-neutral-300"
                  }`}
                >
                  All Airing ({airingAnime.length})
                </button>
                <button
                  onClick={() => setFilterMode("airing")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterMode === "airing"
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                      : "bg-white/5 hover:bg-white/10 text-neutral-300"
                  }`}
                >
                  Top Simulcasts
                </button>
                <button
                  onClick={() => setFilterMode("newest")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterMode === "newest"
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                      : "bg-white/5 hover:bg-white/10 text-neutral-300"
                  }`}
                >
                  Newest Drops
                </button>
              </div>
            </div>
          </div>

          {/* Currently Airing Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl bg-[#12111b] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : displayedAnime.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {displayedAnime.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#11101b] border border-white/10 hover:border-purple-500/50 hover:shadow-[0_8px_30px_rgba(147,51,234,0.3)] transition-all duration-300 cursor-pointer"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-[0.92] group-hover:brightness-100"
                      loading="lazy"
                    />

                    {/* Airing Pulse Indicator Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>Airing</span>
                    </div>

                    {/* Episodes / Status Badge */}
                    {item.episodes ? (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 text-neutral-300 text-[10px] font-bold border border-white/10 backdrop-blur-md">
                        {item.episodes} Eps
                      </div>
                    ) : item.badge ? (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 text-neutral-300 text-[10px] font-bold border border-white/10 backdrop-blur-md">
                        {item.badge}
                      </div>
                    ) : null}

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.8)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="p-3 flex flex-col flex-1 justify-between bg-gradient-to-b from-[#11101b] to-[#0c0b16]">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="truncate">{item.genres?.[0] || "Anime"}</span>
                      {item.rating && (
                        <span className="text-amber-400 font-bold shrink-0">
                          ★ {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-neutral-500">
              No currently airing anime found.
            </div>
          )}
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav activeTab={activeTab} />
    </div>
  );
}
