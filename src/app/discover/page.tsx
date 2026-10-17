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
import { Compass, Sparkles, Shuffle, Play, Flame, Star } from "lucide-react";

export default function DiscoverPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("discover");
  const [activeNav, setActiveNav] = useState("genres");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [catalog, setCatalog] = useState<AnimeItem[]>([]);
  const [randomPick, setRandomPick] = useState<AnimeItem | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const feed = await fetchHomeFeed();
        if (feed && feed.success && feed.data && isMounted) {
          const combined = [
            ...(feed.data["most-popular"] || []),
            ...(feed.data["newest-drops"] || []),
            ...(feed.data["airing"] || []),
            ...(feed.data["most-popular-movies"] || []),
          ];
          const mapped = combined.map((c) => mapFeedCardToAnimeItem(c, "Anime"));
          setCatalog(mapped);
          if (mapped.length > 0) {
            setRandomPick(mapped[Math.floor(Math.random() * mapped.length)]);
          }
        }
      } catch (err) {
        console.error("Failed to load discover catalog:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRoll = () => {
    if (catalog.length === 0) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setRandomPick(catalog[Math.floor(Math.random() * catalog.length)]);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  const handleWatch = (item: AnimeItem) => {
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
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Anime Roulette</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Discover Random Anime
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300">
                Don't know what to watch next? Spin the anime wheel and start streaming instantly.
              </p>
              <button
                onClick={handleRoll}
                disabled={isRolling || catalog.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Shuffle className={`w-4 h-4 ${isRolling ? "animate-spin" : ""}`} />
                <span>{isRolling ? "Rolling..." : "Roll Another Anime"}</span>
              </button>
            </div>
          </div>

          {/* Random Spotlight Showcase */}
          {randomPick && (
            <div className="mb-12 rounded-3xl overflow-hidden bg-[#12111d] border border-purple-500/40 p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-center shadow-xl">
              <div className="relative w-44 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden bg-black/60 shrink-0 border border-white/10 shadow-2xl">
                <img
                  src={randomPick.image}
                  alt={randomPick.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Your Mystery Pick</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {randomPick.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
                  {randomPick.synopsis || "Watch this series in complete Hindi Dub and high resolution."}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                  <button
                    onClick={() => handleWatch(randomPick)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs shadow-lg hover:bg-neutral-200 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Watch Now</span>
                  </button>
                  <button
                    onClick={handleRoll}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Try Another</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Browse All Discovery Catalog */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Curated Discovery Pool
            </h3>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl bg-[#12111b] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {catalog.slice(0, 18).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleWatch(item)}
                    className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(147,51,234,0.25)] hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-purple-950/40">
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 ml-0.5 fill-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav activeTab={activeTab} />
    </div>
  );
}
