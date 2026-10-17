"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { fetchSearchResults, ApiSearchResultItem, API_BASE_URL } from "@/services/api";
import { Play, Search, ArrowLeft, Sparkles, Film, Tv } from "lucide-react";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || searchParams.get("s") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [activeTab, setActiveTab] = useState("home");
  const [activeNav, setActiveNav] = useState("browse");
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<ApiSearchResultItem[]>([]);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    let isMounted = true;
    if (!queryParam.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    async function loadSearch() {
      setIsLoading(true);
      try {
        const data = await fetchSearchResults(queryParam, pageParam);
        if (data && data.success && isMounted) {
          setResults(data.results || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setHasNextPage(Boolean(data.hasNextPage));
          setTotalResults(data.totalResults || data.results?.length || 0);
        } else if (isMounted) {
          setResults([]);
        }
      } catch (err) {
        console.error("Search fetch failed:", err);
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSearch();
    return () => {
      isMounted = false;
    };
  }, [queryParam, pageParam]);

  const handlePageChange = (newPage: number) => {
    router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${newPage}`);
  };

  const popularSuggestions = [
    "Solo Leveling",
    "Fullmetal Alchemist",
    "Naruto",
    "Jujutsu Kaisen",
    "One Piece",
    "Attack on Titan",
    "Demon Slayer",
  ];

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      {/* Desktop Left Sidebar Rail */}
      <SidebarRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
        }}
        onOpenSettings={() => alert(`API Base: ${API_BASE_URL}`)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8 relative">
        {/* Top Floating Navbar with Live Suggestions */}
        <FloatingNavbar
          activeNav={activeNav}
          onNavClick={(nav) => {
            setActiveNav(nav);
            if (nav === "home") router.push("/");
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectProfile={() => router.push("/")}
        />

        <main className="flex-1 w-full mx-auto px-4 sm:px-8 pt-20 md:pt-24 space-y-8 max-w-[1600px]">
          {/* Header Row with Back Button */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/15 backdrop-blur-xl text-neutral-300 hover:text-white text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>

              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-400" />
                  <span>
                    {queryParam ? `Search: "${queryParam}"` : "Search Anime"}
                  </span>
                </h1>
                {queryParam && !isLoading && (
                  <p className="text-xs text-neutral-400">
                    Found {totalResults} {totalResults === 1 ? "title" : "titles"}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Filter Tag Suggestion Pills */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                Trending:
              </span>
              {popularSuggestions.slice(0, 4).map((tag) => (
                <button
                  key={tag}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Search Content Body */}
          {isLoading ? (
            /* Loading Skeleton Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 animate-pulse">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="aspect-[2/3] w-full rounded-2xl bg-neutral-900 border border-white/5" />
                  <div className="h-4 w-3/4 rounded-full bg-neutral-800" />
                  <div className="h-3 w-1/2 rounded-full bg-neutral-800/60" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            /* Results Grid */
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {results.map((anime) => {
                  const cleanId = anime.id.replace(/^\/+|\/+$/g, "");
                  return (
                    <div
                      key={anime.id}
                      onClick={() => router.push(`/${cleanId}`)}
                      className="group flex flex-col cursor-pointer select-none rounded-2xl overflow-hidden bg-[#12111b] border border-white/10 hover:border-purple-500/50 hover:shadow-[0_10px_30px_rgba(147,51,234,0.35)] transition-all duration-300 hover:scale-[1.02]"
                    >
                      {/* Vertical Poster Container */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                        <img
                          src={
                            anime.image ||
                            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"
                          }
                          alt={anime.title}
                          className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition" />

                        {/* Type Badge */}
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md border border-white/15 text-purple-300 shadow">
                          {anime.type ? anime.type.toUpperCase() : "HD"}
                        </div>

                        {/* Hover Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="p-3 space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-200 group-hover:text-white truncate">
                          {anime.title}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Hindi Dub</span>
                          <span className="text-purple-400 font-semibold group-hover:underline">
                            Watch &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 pb-4">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
                  >
                    &larr; Previous Page
                  </button>
                  <span className="text-xs text-neutral-400 font-medium px-3">
                    Page <strong className="text-white">{currentPage}</strong> of{" "}
                    <strong className="text-white">{totalPages}</strong>
                  </span>
                  <button
                    disabled={!hasNextPage}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] transition cursor-pointer"
                  >
                    Next Page &rarr;
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-purple-950/40 border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.2)]">
                <Search className="w-8 h-8 text-purple-400 opacity-60" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h2 className="text-lg font-bold text-white">
                  No anime found {queryParam ? `for "${queryParam}"` : ""}
                </h2>
                <p className="text-xs text-neutral-400">
                  Try searching for another anime title, series franchise, or pick one from popular recommendations below:
                </p>
              </div>

              {/* Popular recommendations pills */}
              <div className="flex items-center justify-center gap-2 flex-wrap max-w-lg pt-2">
                {popularSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-purple-600/30 text-neutral-300 hover:text-white border border-white/10 hover:border-purple-500/50 transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        <AZFooter />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
          if (tab === "search") router.push("/search");
        }}
        myListCount={0}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080c] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
