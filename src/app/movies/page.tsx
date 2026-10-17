"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { fetchMovies, ApiCatalogItem } from "@/services/api";
import {
  Film,
  Play,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Volume2,
} from "lucide-react";

function MoviesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [activeTab, setActiveTab] = useState("browse");
  const [activeNav, setActiveNav] = useState("movies");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState<ApiCatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalResults, setTotalResults] = useState<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadMovies() {
      try {
        const res = await fetchMovies(page);
        if (res && res.success && isMounted) {
          setMovies(res.results || []);
          setTotalPages(res.totalPages || 1);
          setHasNextPage(Boolean(res.hasNextPage));
          setTotalResults(res.totalResults);
        }
      } catch (err) {
        console.error("Failed to load movies:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMovies();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      isMounted = false;
    };
  }, [page]);

  const handleWatchMovie = (movie: ApiCatalogItem) => {
    const cleanId = movie.id.replace(/^\/+|\/+$/g, "");
    const target =
      cleanId.startsWith("movies/") || cleanId.startsWith("movie/")
        ? `/watch/${cleanId}`
        : `/watch/movies/${cleanId}`;
    router.push(target);
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/movies?page=${newPage}`);
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      <SidebarRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6 relative">
        <FloatingNavbar
          activeNav={activeNav}
          onNavClick={(nav) => {
            setActiveNav(nav);
            if (nav === "home") router.push("/");
            if (nav === "genres") router.push("/genres");
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 pt-24 pb-12">
          {/* Hero Banner for Movies */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-[#131122] to-[#0d0c18] border border-purple-500/25 p-6 sm:p-10 mb-10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-400/30 text-purple-200 text-xs font-bold tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>Multi-Audio Movie Vault</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Hindi Dubbed Anime & Animated Movies
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Stream full-length anime feature films and cartoon blockbusters with high-speed multi-audio servers (Hindi, Tamil, Telugu) and 1080p Full HD resolution.
              </p>
              <div className="flex items-center gap-3 pt-2 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Volume2 className="w-3.5 h-3.5" /> Multi-Audio Dubs
                </span>
                <span>•</span>
                <span>Direct High-Speed Playback</span>
                <span>•</span>
                <span>No Iframe Clutter</span>
              </div>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                All Movies
              </h2>
            </div>
            {totalResults !== undefined && (
              <span className="text-xs text-purple-300 font-bold px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30">
                {totalResults} Movies Available
              </span>
            )}
          </div>

          {/* Movies Grid */}
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
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleWatchMovie(movie)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(147,51,234,0.3)] hover:-translate-y-1.5 cursor-pointer"
                >
                  {/* Poster */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                    <img
                      src={movie.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Movie Badge */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-600/90 backdrop-blur-md text-white border border-purple-400/40 uppercase tracking-wide">
                      Movie
                    </span>

                    {/* Rating */}
                    {movie.rating && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-black shadow">
                        ★ {movie.rating}
                      </span>
                    )}

                    {/* Direct Watch Now Button overlay on hover */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-950/50 backdrop-blur-[2px] p-3">
                      <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.9)] scale-75 group-hover:scale-100 transition-transform duration-300 mb-2">
                        <Play className="w-5 h-5 ml-0.5 fill-white" />
                      </div>
                      <span className="px-4 py-1.5 rounded-full bg-white text-black font-extrabold text-xs shadow-lg uppercase tracking-wider">
                        Watch Now
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors leading-snug">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/5">
                      <span className="text-purple-300 font-medium">
                        Hindi Dub
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWatchMovie(movie);
                        }}
                        className="text-xs font-bold text-white hover:text-purple-300 flex items-center gap-1 group/btn"
                      >
                        <span>Watch</span>
                        <Play className="w-3 h-3 fill-current group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Movies Found</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Unable to load movies right now. Please check back later.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12 select-none">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 flex items-center gap-1 cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                  let pNum = page <= 3 ? idx + 1 : page + idx - 2;
                  if (pNum > totalPages) return null;
                  const isCurrent = pNum === page;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] border border-purple-400"
                          : "bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!hasNextPage && page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 flex items-center gap-1 cursor-pointer transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
        }}
        myListCount={0}
      />
    </div>
  );
}

export default function MoviesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MoviesContent />
    </React.Suspense>
  );
}
