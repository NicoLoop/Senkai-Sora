"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { fetchTaxonomyListing, ApiCatalogItem } from "@/services/api";
import {
  Layers,
  Play,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Tv,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

export default function CategoryDynamicPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params as Promise<{ slug: string[] }>) as
    | { slug: string[] }
    | undefined;
  const rawSlug = resolvedParams?.slug || [];
  const fullPath = Array.isArray(rawSlug) ? rawSlug.join("/") : String(rawSlug || "");
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [activeTab, setActiveTab] = useState("browse");
  const [activeNav, setActiveNav] = useState("genres");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ApiCatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalResults, setTotalResults] = useState<number | undefined>(undefined);

  // Derive human-readable title from slug, e.g. "category/network/disney-channel" -> "Disney Channel"
  const lastPart = fullPath.split("/").filter(Boolean).pop() || "Category";
  const formattedTitle = lastPart
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const categoryType = fullPath.includes("network")
    ? "Network"
    : fullPath.includes("language")
    ? "Language"
    : fullPath.includes("franchise")
    ? "Franchise"
    : "Category";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadCategoryItems() {
      try {
        const taxonomyPath = `category/${fullPath}`;
        const res = await fetchTaxonomyListing(taxonomyPath, page);
        if (res && res.success && isMounted) {
          setItems(res.results || []);
          setTotalPages(res.totalPages || 1);
          setHasNextPage(Boolean(res.hasNextPage));
          setTotalResults(res.totalResults);
        }
      } catch (err) {
        console.error(`Failed to load category ${fullPath}:`, err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCategoryItems();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      isMounted = false;
    };
  }, [fullPath, page]);

  const handleCardClick = (item: ApiCatalogItem) => {
    const cleanId = item.id.replace(/^\/+|\/+$/g, "");
    if (cleanId.startsWith("movies/") || cleanId.startsWith("movie/")) {
      router.push(`/watch/${cleanId}`);
    } else {
      router.push(`/${cleanId}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/category/${fullPath}?page=${newPage}`);
  };

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
          {/* Breadcrumb Link */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4 select-none">
            <button
              onClick={() => router.push("/")}
              className="hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span>/</span>
            <span className="text-neutral-500">{categoryType}</span>
            <span>/</span>
            <span className="text-purple-400 font-semibold">{formattedTitle}</span>
          </div>

          {/* Category Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                <Tv className="w-4 h-4" />
                <span>{categoryType} Hub</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>{formattedTitle}</span>
                {totalResults !== undefined && (
                  <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
                    {totalResults} Titles
                  </span>
                )}
              </h1>
            </div>

            {/* Pagination Controls in Header */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="text-xs font-mono text-neutral-400 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={!hasNextPage && page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Grid of Titles */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl bg-[#12111b] border border-white/5"
                />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="group flex flex-col cursor-pointer select-none"
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#12111b] border border-white/10 group-hover:border-purple-500/50 shadow-lg group-hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.4)] transition-all duration-300 group-hover:scale-[1.03]">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 px-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <Layers className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-neutral-300">
                No Titles Found
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                There are currently no titles available in this category.
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-5 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          )}

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Page</span>
              </button>
              <span className="text-xs font-mono text-neutral-400 px-3">
                {page} / {totalPages}
              </span>
              <button
                disabled={!hasNextPage && page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Next Page</span>
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
          if (tab === "browse") router.push("/genres");
        }}
      />
    </div>
  );
}
