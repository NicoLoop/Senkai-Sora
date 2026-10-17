"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { fetchAzListing, ApiCatalogItem } from "@/services/api";
import {
  Sparkles,
  Play,
  Film,
  Tv,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

interface PageProps {
  params: Promise<{ letter: string }> | { letter: string };
}

function AzListingContent({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params as Promise<{ letter: string }>) as { letter: string } | undefined;
  const rawLetter = resolvedParams?.letter || "a";
  const letter = decodeURIComponent(rawLetter).trim().toLowerCase();

  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [activeTab, setActiveTab] = useState("browse");
  const [activeNav, setActiveNav] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [catalog, setCatalog] = useState<ApiCatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalResults, setTotalResults] = useState<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const res = await fetchAzListing(letter, page);
        if (res && res.success && isMounted) {
          setCatalog(res.results || []);
          setTotalPages(res.totalPages || 1);
          setHasNextPage(Boolean(res.hasNextPage));
          setTotalResults(res.totalResults);
        }
      } catch (err) {
        console.error("Failed to load AZ list:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      isMounted = false;
    };
  }, [letter, page]);

  const handleCardClick = (item: ApiCatalogItem) => {
    const cleanId = item.id.replace(/^\/+|\/+$/g, "");
    if (cleanId.startsWith("movies/") || cleanId.startsWith("movie/")) {
      router.push(`/watch/${cleanId}`);
    } else {
      router.push(`/${cleanId}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/az-list/${letter}?page=${newPage}`);
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
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 pt-24 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold tracking-wide uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alphabetical Directory</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Order by Letter:{" "}
                <span className="text-purple-400 font-black uppercase">
                  {letter === "0-9" ? "# (0-9)" : letter}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Browse all Hindi Dubbed anime and series starting with "{letter.toUpperCase()}"
              </p>
            </div>

            {totalResults !== undefined && (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 w-fit">
                {totalResults} titles found
              </span>
            )}
          </div>

          {/* Catalog Grid */}
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
          ) : catalog.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {catalog.map((item) => {
                const isMovie = item.id.includes("movie");
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(147,51,234,0.25)] hover:-translate-y-1 cursor-pointer"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                      {/* Type Badge */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 uppercase">
                        {isMovie ? "Movie" : "Series"}
                      </span>

                      {/* Rating */}
                      {item.rating && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-black">
                          ★ {item.rating}
                        </span>
                      )}

                      {/* Hover Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-950/40 backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.8)] scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                        <span>{item.year || (isMovie ? "Movie" : "Hindi Dub")}</span>
                        <span className="text-purple-400 font-semibold text-[10px] uppercase">
                          {isMovie ? "Watch Now" : "Episodes"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center">
              <Search className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Anime Found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                No titles starting with "{letter.toUpperCase()}" are currently listed in the directory.
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

        <AZFooter activeLetter={letter} />
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

export default function AzListingPage(props: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AzListingContent {...props} />
    </React.Suspense>
  );
}
