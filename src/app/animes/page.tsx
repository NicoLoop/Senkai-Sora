"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { fetchCategory, ApiCatalogItem } from "@/services/api";
import {
  Tv,
  Play,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";

function AnimesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [activeTab, setActiveTab] = useState("browse");
  const [activeNav, setActiveNav] = useState("animes");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [animes, setAnimes] = useState<ApiCatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalResults, setTotalResults] = useState<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const res = await fetchCategory("anime", page);
        if (res && res.success && isMounted) {
          setAnimes(res.results || []);
          setTotalPages(res.totalPages || 1);
          setHasNextPage(Boolean(res.hasNextPage));
          setTotalResults(res.totalResults);
        }
      } catch (err) {
        console.error("Failed to load animes:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      isMounted = false;
    };
  }, [page]);

  const handleCardClick = (item: ApiCatalogItem) => {
    const cleanId = item.id.replace(/^\/+|\/+$/g, "");
    if (cleanId.startsWith("movies/") || cleanId.startsWith("movie/")) {
      router.push(`/watch/${cleanId}`);
    } else {
      router.push(`/${cleanId}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/animes?page=${newPage}`);
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
            if (nav === "animes") router.push("/animes");
            if (nav === "cartoon") router.push("/cartoon");
            if (nav === "genres") router.push("/genres");
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 pt-24 pb-12">
          {/* Header Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/70 via-[#131122] to-[#0d0c18] border border-purple-500/25 p-6 sm:p-10 mb-8 shadow-xl">
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-400/30 text-purple-200 text-xs font-bold tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>Senkai Sora Catalog</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Anime Series & Episodes
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300">
                Explore popular and trending anime shows in Hindi Dubbed and Multi-Audio.
              </p>
            </div>
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
          ) : animes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {animes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12111b]/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(147,51,234,0.25)] hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-600/90 text-white uppercase">
                      Anime
                    </span>
                    {item.rating && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-black">
                        ★ {item.rating}
                      </span>
                    )}
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-neutral-500">
              No anime available.
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

export default function AnimesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AnimesContent />
    </React.Suspense>
  );
}
