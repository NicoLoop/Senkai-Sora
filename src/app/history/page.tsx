"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import {
  getWatchHistory,
  clearWatchHistory,
  WatchHistoryItem,
} from "@/utils/cookieStorage";
import { Clock, Play, Trash2, ArrowRight, RotateCcw } from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("history");
  const [activeNav, setActiveNav] = useState("animes");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHistory(getWatchHistory());
    setIsLoaded(true);
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your watch history?")) {
      clearWatchHistory();
      setHistory([]);
    }
  };

  const handleResume = (item: WatchHistoryItem) => {
    const epId = item.episodeId || item.id;
    const cleanId = epId.replace(/^\/+|\/+$/g, "");
    if (cleanId.startsWith("movies/") || cleanId.startsWith("movie/")) {
      router.push(`/watch/${cleanId}`);
    } else {
      router.push(`/${cleanId}`);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
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
                <Clock className="w-3.5 h-3.5" />
                <span>Resume Playback</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Watch History
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Recent episodes and movies you watched, saved in browser cookies.
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-600 border border-rose-500/30 transition cursor-pointer w-fit"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {/* History List */}
          {!isLoaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-[#12111b] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.episodeId || item.id}
                  onClick={() => handleResume(item)}
                  className="group flex items-center gap-4 p-3.5 rounded-2xl bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 hover:bg-[#181628] transition-all duration-200 shadow-md cursor-pointer"
                >
                  <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-black/60 shrink-0">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"}
                      alt={item.animeTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-white" />
                      </div>
                    </div>
                    {/* Progress Bar along bottom */}
                    {item.progress !== undefined && item.progress > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                      {item.animeTitle}
                    </h3>
                    <p className="text-xs text-neutral-300 truncate">
                      {item.episodeTitle || (item.episode ? `Episode ${item.episode}` : "Movie")}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-0.5">
                      <span className="text-purple-400 font-medium">
                        {formatTimeAgo(item.watchedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-purple-300">
                        <RotateCcw className="w-3 h-3" />
                        <span>
                          {item.currentTime && item.currentTime > 0
                            ? `Resume at ${Math.floor(item.currentTime / 60)}:${Math.floor(item.currentTime % 60).toString().padStart(2, "0")}`
                            : "Resume"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-950/30 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                <Clock className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-white">No Watch History</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                When you watch episodes or movies on Senkai Sora, they will appear here automatically so you can resume anytime.
              </p>
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition"
              >
                <span>Find Something to Watch</span>
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
