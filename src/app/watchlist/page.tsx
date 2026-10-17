"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import {
  getWatchlist,
  removeFromWatchlist,
  AnimeWatchlistItem,
} from "@/utils/cookieStorage";
import { Bookmark, Play, Trash2, Heart, ArrowRight } from "lucide-react";

export default function WatchlistPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("watchlist");
  const [activeNav, setActiveNav] = useState("animes");
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlist, setWatchlist] = useState<AnimeWatchlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWatchlist(getWatchlist());
    setIsLoaded(true);
  }, []);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromWatchlist(id);
    setWatchlist(getWatchlist());
  };

  const handleCardClick = (item: AnimeWatchlistItem) => {
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold uppercase mb-1">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Library</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                My Watchlist
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Anime and series bookmarked to your browser cookies.
              </p>
            </div>

            {watchlist.length > 0 && (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-purple-600/30 text-purple-300 border border-purple-500/30 w-fit">
                {watchlist.length} Saved Titles
              </span>
            )}
          </div>

          {/* List Grid */}
          {!isLoaded ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl bg-[#12111b] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(147,51,234,0.25)] hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Delete from Watchlist button */}
                    <button
                      onClick={(e) => handleRemove(e, item.id)}
                      title="Remove from watchlist"
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

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
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {item.type || "Anime"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-950/30 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                <Bookmark className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-white">Your Watchlist is Empty</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Add titles to your watchlist while browsing movies or anime episodes to save them directly into your browser cookies.
              </p>
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition"
              >
                <span>Explore Trending</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav activeTab={activeTab} />
    </div>
  );
}
