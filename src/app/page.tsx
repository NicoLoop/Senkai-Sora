"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { SpotlightHero } from "@/components/SpotlightHero";
import { HomeShelfTabs, HomeTabType } from "@/components/HomeShelfTabs";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AnimeSection } from "@/components/AnimeSection";
import { GenreFilter } from "@/components/GenreFilter";
import { PlayerModal } from "@/components/PlayerModal";
import { InfoModal } from "@/components/InfoModal";
import { AnimeItem, EpisodeItem } from "@/data/animeData";
import {
  fetchHomeFeed,
  fetchAnimeInfo,
  fetchCategory,
  fetchGenreListing,
  mapSpotlightToAnimeItem,
  mapFeedCardToAnimeItem,
  mapApiSeasonsToSeasonInfo,
  API_BASE_URL,
} from "@/services/api";
import { AZFooter } from "@/components/AZFooter";
import {
  getWatchHistory,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isItemInWatchlist,
  WatchHistoryItem,
  AnimeWatchlistItem,
} from "@/utils/cookieStorage";
import { Heart, Play, Tv, Volume2, Check, Plus } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [activeNav, setActiveNav] = useState("home");
  const [homeShelfTab, setHomeShelfTab] = useState<HomeTabType>("history");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  // Spotlight carousel from API (strictly starts empty, no default mock values)
  const [spotlightList, setSpotlightList] = useState<AnimeItem[]>([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Live API feed shelves
  const [apiNewestDrops, setApiNewestDrops] = useState<AnimeItem[]>([]);
  const [apiMostPopular, setApiMostPopular] = useState<AnimeItem[]>([]);
  const [apiAiring, setApiAiring] = useState<AnimeItem[]>([]);
  const [apiCartoons, setApiCartoons] = useState<AnimeItem[]>([]);
  const [apiPopularMovies, setApiPopularMovies] = useState<AnimeItem[]>([]);

  // Networks & Languages from Home API
  const [apiNetworks, setApiNetworks] = useState<
    Array<{ name: string; slug: string; id: string; image?: string }>
  >([]);
  const [apiLanguages, setApiLanguages] = useState<
    Array<{ name: string; slug: string; id: string; image?: string }>
  >([]);

  // Genre Filtered Anime List (from API /category/anime for All Genres, or specific genre)
  const [genreAnimeList, setGenreAnimeList] = useState<AnimeItem[]>([]);
  const [isGenreLoading, setIsGenreLoading] = useState(false);

  // Modals state
  const [playingAnime, setPlayingAnime] = useState<AnimeItem | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<EpisodeItem | null>(null);
  const [playingSeasonNumber, setPlayingSeasonNumber] = useState<number>(1);
  const [infoAnime, setInfoAnime] = useState<AnimeItem | null>(null);

  // Watch History & Watchlist state from Cookies
  const [cookieHistory, setCookieHistory] = useState<WatchHistoryItem[]>([]);
  const [myList, setMyList] = useState<AnimeItem[]>([]);

  const mapWatchlistItemToAnime = (item: AnimeWatchlistItem): AnimeItem => ({
    id: item.id,
    title: item.title,
    image: item.image || "",
    backdrop: item.image,
    rating: item.rating || "8.5",
    year: item.year ? parseInt(item.year, 10) || 2024 : 2024,
    genres: ["Hindi Dub"],
    episodes: 1,
    audio: ["Hindi", "Japanese"],
    synopsis: `${item.title} saved in your watchlist.`,
  });

  useEffect(() => {
    setCookieHistory(getWatchHistory());
    const list = getWatchlist();
    if (list && list.length > 0) {
      setMyList(list.map(mapWatchlistItemToAnime));
    }
  }, []);

  const myListIds = useMemo(() => new Set(myList.map((a) => a.id)), [myList]);

  const handleToggleMyList = (anime: AnimeItem) => {
    if (isItemInWatchlist(anime.id)) {
      removeFromWatchlist(anime.id);
    } else {
      addToWatchlist({
        id: anime.id,
        title: anime.title,
        image: anime.image || anime.backdrop,
        type: (anime as any).type || "Anime",
        rating: anime.rating,
        year: String(anime.year || "2024"),
        addedAt: Date.now(),
      });
    }
    const updated = getWatchlist();
    setMyList(updated.map(mapWatchlistItemToAnime));
  };

  // Connect and fetch data from backend API
  useEffect(() => {
    let isMounted = true;

    async function loadFeed() {
      try {
        const feed = await fetchHomeFeed();
        if (!isMounted || !feed || !feed.success || !feed.data) return;

        // 1. Process Spotlight completely from API
        if (feed.data.spotlight && feed.data.spotlight.length > 0) {
          const mappedSpotlights = feed.data.spotlight.map((s) =>
            mapSpotlightToAnimeItem(s)
          );
          setSpotlightList(mappedSpotlights);

          // Asynchronously enrich first spotlight with full episode list if available
          try {
            const firstItem = feed.data.spotlight[0];
            const details = await fetchAnimeInfo(firstItem.id);
            if (details && details.success && details.data?.seasons && isMounted) {
              const mappedSeasons = mapApiSeasonsToSeasonInfo(details.data.seasons);
              setSpotlightList((prev) =>
                prev.map((item, idx) =>
                  idx === 0 ? { ...item, seasons: mappedSeasons } : item
                )
              );
            }
          } catch (e) {
            console.warn("Could not enrich first spotlight", e);
          }
        }

        // 2. Process Shelves from API
        if (feed.data["newest-drops"] && isMounted) {
          setApiNewestDrops(
            feed.data["newest-drops"].map((item) =>
              mapFeedCardToAnimeItem(item, "New")
            )
          );
        }
        if (feed.data["most-popular"] && isMounted) {
          setApiMostPopular(
            feed.data["most-popular"].map((item) =>
              mapFeedCardToAnimeItem(item, "Popular")
            )
          );
        }
        if (feed.data["airing"] && isMounted) {
          setApiAiring(
            feed.data["airing"].map((item) =>
              mapFeedCardToAnimeItem(item, "Airing")
            )
          );
        }
        if (feed.data["cartoons"] && isMounted) {
          setApiCartoons(
            feed.data["cartoons"].map((item) =>
              mapFeedCardToAnimeItem(item, "Cartoon")
            )
          );
        }
        if (feed.data["most-popular-movies"] && isMounted) {
          setApiPopularMovies(
            feed.data["most-popular-movies"].map((item) =>
              mapFeedCardToAnimeItem(item, "Movie")
            )
          );
        }
        if (feed.data.network && isMounted) {
          setApiNetworks(feed.data.network);
        }
        if (feed.data.languages && isMounted) {
          setApiLanguages(feed.data.languages);
        }
      } catch (err) {
        console.warn("[Home] API offline or error", err);
      } finally {
        if (isMounted) {
          setIsFeedLoading(false);
        }
      }
    }

    loadFeed();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch anime items dynamically based on selected genre:
  // "All Genres" -> up to 20 anime from /category/anime
  // Other genres -> from /category/cartoon or /genre/:genre
  useEffect(() => {
    let isCurrent = true;
    setIsGenreLoading(true);

    async function loadGenreAnime() {
      try {
        if (selectedGenre === "All Genres") {
          const [p1, p2] = await Promise.all([
            fetchCategory("anime", 1),
            fetchCategory("anime", 2),
          ]);
          const combined = [
            ...((p1 && p1.results) || []),
            ...((p2 && p2.results) || []),
          ].slice(0, 20);

          if (isCurrent) {
            setGenreAnimeList(
              combined.map((c) => ({
                id: c.id,
                title: c.title,
                image: c.image || "",
                backdrop: c.image || "",
                genres: ["Anime"],
                rating: "8.6",
                year: 2024,
                episodes: 24,
                audio: ["Hindi", "Japanese"],
                synopsis: c.title,
                badge: "Anime",
              }))
            );
          }
        } else if (selectedGenre.toLowerCase() === "cartoon") {
          const [p1, p2] = await Promise.all([
            fetchCategory("cartoon", 1),
            fetchCategory("cartoon", 2),
          ]);
          const combined = [
            ...((p1 && p1.results) || []),
            ...((p2 && p2.results) || []),
          ].slice(0, 20);

          if (isCurrent) {
            setGenreAnimeList(
              combined.map((c) => ({
                id: c.id,
                title: c.title,
                image: c.image || "",
                backdrop: c.image || "",
                genres: ["Cartoon"],
                rating: "8.5",
                year: 2024,
                episodes: 12,
                audio: ["Hindi Dub"],
                synopsis: c.title,
                badge: "Cartoon",
              }))
            );
          }
        } else {
          const res = await fetchGenreListing(selectedGenre.toLowerCase(), 1);
          if (res && res.results && isCurrent) {
            setGenreAnimeList(
              res.results.slice(0, 20).map((c) => ({
                id: c.id,
                title: c.title,
                image: c.image || "",
                backdrop: c.image || "",
                genres: [selectedGenre],
                rating: "8.5",
                year: 2024,
                episodes: 24,
                audio: ["Hindi", "Japanese"],
                synopsis: c.title,
                badge: selectedGenre,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Error loading genre anime list:", err);
      } finally {
        if (isCurrent) {
          setIsGenreLoading(false);
        }
      }
    }

    loadGenreAnime();
    return () => {
      isCurrent = false;
    };
  }, [selectedGenre]);

  const activeSpotlight = spotlightList[spotlightIndex] || spotlightList[0];

  // Navigate to /[id] on clicking any anime, spotlight, or episode
  const handleNavigateToAnime = (animeOrId: AnimeItem | string) => {
    const idStr = typeof animeOrId === "string" ? animeOrId : animeOrId?.id;
    if (!idStr) return;
    const cleanId = idStr.replace(/^\/+|\/+$/g, "");
    router.push(`/${cleanId}`);
  };

  // Play handler for episode from Watch History -> routes to episode/movie to resume playback
  const handlePlayWatchHistoryEpisode = (episode: EpisodeItem) => {
    const epId = episode.id.replace(/^wh-/, "");
    const cleanId = epId.replace(/^\/+|\/+$/g, "");
    if (cleanId.startsWith("movies/") || cleanId.startsWith("movie/")) {
      router.push(`/watch/${cleanId}`);
    } else {
      router.push(`/${cleanId}`);
    }
  };

  // Play handler for hero Play button -> routes to /[id]
  const handleHeroPlay = (anime: AnimeItem) => {
    handleNavigateToAnime(anime);
  };

  // Select card to navigate to /[id]
  const handleSelectCardAnime = (anime: AnimeItem) => {
    handleNavigateToAnime(anime);
  };

  // Filter helper based on genre and search
  const filterAnimeList = (list: AnimeItem[]) => {
    return list.filter((anime) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (anime.synopsis &&
          anime.synopsis.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === "All Genres" ||
        anime.genres.some(
          (g) => g.toLowerCase() === selectedGenre.toLowerCase()
        );

      return matchesSearch && matchesGenre;
    });
  };

  // Watch History Episodes from Cookie Storage (with fallback to API)
  const watchHistoryEpisodes: EpisodeItem[] = useMemo(() => {
    if (cookieHistory && cookieHistory.length > 0) {
      return cookieHistory.map((item, idx) => {
        const timeSec = item.currentTime || 0;
        const durSec = typeof item.duration === "number" ? item.duration : 0;
        const m = Math.floor(timeSec / 60);
        const s = Math.floor(timeSec % 60);
        const timeStr = `${m}:${s < 10 ? "0" : ""}${s}`;
        const durationDisplay = durSec > 0 ? `${Math.floor(durSec / 60)}m` : "24m";

        return {
          id: item.episodeId || item.id,
          episodeNumber: item.episode || idx + 1,
          title: item.animeTitle,
          image: item.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
          duration: durationDisplay,
          progress: item.progress || (durSec > 0 ? Math.min(100, Math.round((timeSec / durSec) * 100)) : 15),
          synopsis: item.episodeTitle ? `${item.episodeTitle} • Resume at ${timeStr}` : `Resume at ${timeStr}`,
        };
      });
    }
    // Strictly no placeholder data for watch history
    return [];
  }, [cookieHistory]);

  const filteredMyList = useMemo(
    () => filterAnimeList(myList),
    [searchQuery, selectedGenre, myList]
  );

  // Search Results
  const allFilteredAnime = useMemo(() => {
    if (!searchQuery.trim() && selectedGenre === "All Genres") return [];
    const combined = [
      ...spotlightList,
      ...apiMostPopular,
      ...apiNewestDrops,
      ...apiAiring,
      ...apiCartoons,
      ...apiPopularMovies,
    ];
    const uniqueMap = new Map<string, AnimeItem>();
    combined.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return filterAnimeList(Array.from(uniqueMap.values()));
  }, [searchQuery, selectedGenre, spotlightList, apiMostPopular, apiNewestDrops, apiAiring, apiCartoons, apiPopularMovies]);

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      {/* Left Navigation Sidebar Rail with 3D buttons and glow */}
      <SidebarRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") {
            setActiveNav("home");
          }
        }}
        onOpenSettings={() => {
          alert(`Anime Stream\nConnected API Base: ${API_BASE_URL}`);
        }}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6 relative">
        {/* Top Floating Navigation Bar (Home, Browse, Kids, Support, FAQ) + Expandable Floating Search Island */}
        <FloatingNavbar
          activeNav={activeNav}
          onNavClick={(nav) => {
            setActiveNav(nav);
            if (nav === "home") {
              setActiveTab("home");
            }
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectProfile={() => setActiveTab("profile")}
        />

        {/* View Routing */}
        <main className="flex-1">
          {/* Watchlist / Kids View */}
          {activeTab === "my-list" || activeNav === "kids" ? (
            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-24 pb-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">
                    {activeNav === "kids" ? "Kids Zone Anime" : "My Watchlist"}
                  </h1>
                  <p className="text-sm text-neutral-400 mt-1">
                    {activeNav === "kids"
                      ? "Family-safe animated adventures"
                      : "Saved anime and series"}
                  </p>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]">
                  {filteredMyList.length} Saved
                </span>
              </div>

              {filteredMyList.length > 0 ? (
                <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2">
                  {filteredMyList.map((anime) => (
                    <div key={anime.id} className="w-[240px] sm:w-[280px] shrink-0">
                      <AnimeSection
                        title=""
                        items={[anime]}
                        myListIds={myListIds}
                        onToggleMyList={handleToggleMyList}
                        onSelectAnime={handleSelectCardAnime}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <Heart className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-neutral-300">
                    Your List is Empty
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Click the + button on any title to save it to your watchlist.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("home");
                      setActiveNav("home");
                    }}
                    className="mt-5 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Explore Spotlight
                  </button>
                </div>
              )}
            </div>
          ) : searchQuery.trim() !== "" ? (
            /* Search Results View */
            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-24 pb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Search Results for <span className="text-purple-400">"{searchQuery}"</span>
              </h1>
              <p className="text-sm text-neutral-400 mb-6">
                Found {allFilteredAnime.length} matching titles
              </p>

              <GenreFilter
                selectedGenre={selectedGenre}
                onSelectGenre={setSelectedGenre}
              />

              {allFilteredAnime.length > 0 ? (
                <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 mt-6">
                  {allFilteredAnime.map((anime) => (
                    <div key={anime.id} className="w-[240px] sm:w-[280px] shrink-0">
                      <AnimeSection
                        title=""
                        items={[anime]}
                        myListIds={myListIds}
                        onToggleMyList={handleToggleMyList}
                        onSelectAnime={handleSelectCardAnime}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-neutral-500">
                  No anime found matching your query.
                </div>
              )}
            </div>
          ) : isFeedLoading && spotlightList.length === 0 ? (
            /* ============================================================== */
            /* Home Page Skeleton Loading Screen                             */
            /* ============================================================== */
            <div className="space-y-8 select-none">
              {/* Hero Spotlight Skeleton */}
              <div className="w-full min-h-[520px] sm:min-h-[580px] md:min-h-[640px] flex items-center bg-[#09090f] relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-transparent to-transparent" />
                <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 space-y-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-6 bg-white/10 rounded-full" />
                    <div className="w-20 h-6 bg-purple-600/20 rounded-full" />
                  </div>
                  <div className="w-72 sm:w-[480px] h-12 sm:h-16 bg-white/10 rounded-2xl" />
                  <div className="space-y-2 max-w-lg">
                    <div className="w-full h-4 bg-white/5 rounded-full" />
                    <div className="w-4/5 h-4 bg-white/5 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 pt-3">
                    <div className="w-36 h-11 bg-purple-600/30 rounded-full" />
                    <div className="w-36 h-11 bg-white/5 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Shelves Skeleton Rail */}
              <div className="max-w-[1600px] mx-auto px-4 sm:px-8 space-y-8 pb-12 animate-pulse">
                {/* Tabs Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="w-32 h-10 bg-purple-600/20 rounded-xl" />
                  <div className="w-28 h-10 bg-white/5 rounded-xl" />
                  <div className="w-28 h-10 bg-white/5 rounded-xl" />
                </div>

                {/* Cards Rail 1 */}
                <div className="flex items-stretch gap-4 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[240px] sm:w-[280px] shrink-0 rounded-2xl bg-[#12111b] border border-white/5 overflow-hidden"
                    >
                      <div className="aspect-video bg-white/5" />
                      <div className="p-3.5 space-y-2">
                        <div className="w-3/4 h-4 bg-white/10 rounded" />
                        <div className="w-1/2 h-3 bg-white/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shelf 2 */}
                <div className="space-y-3 pt-4">
                  <div className="w-52 h-6 bg-white/10 rounded-lg" />
                  <div className="flex items-stretch gap-4 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[200px] sm:w-[240px] shrink-0 rounded-2xl bg-[#12111b] border border-white/5 overflow-hidden"
                      >
                        <div className="aspect-[3/4] bg-white/5" />
                        <div className="p-3.5 space-y-2">
                          <div className="w-3/4 h-4 bg-white/10 rounded" />
                          <div className="w-1/2 h-3 bg-white/5 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Main Showcase Layout */
            <>
              {/* Spotlight Hero Carousel from API */}
              {spotlightList.length > 0 && (
                <SpotlightHero
                  spotlightList={spotlightList}
                  currentIndex={spotlightIndex}
                  onSelectIndex={setSpotlightIndex}
                  onPlay={handleHeroPlay}
                  onMoreInfo={setInfoAnime}
                  isInWatchlist={myListIds.has(activeSpotlight?.id || "")}
                  onToggleWatchlist={handleToggleMyList}
                />
              )}

              {/* Shelf with Tabs: Watch History, Popular, New, Airing */}
              <HomeShelfTabs
                activeTab={homeShelfTab}
                onTabChange={setHomeShelfTab}
                watchHistoryItems={watchHistoryEpisodes}
                popularItems={apiMostPopular}
                newItems={apiNewestDrops}
                airingItems={apiAiring}
                onPlayEpisode={handlePlayWatchHistoryEpisode}
                onSelectAnime={handleSelectCardAnime}
              />

              {/* Networks & Studios Shelf from Home API */}
              {apiNetworks.length > 0 && (
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                  <section className="relative w-full py-4 select-none">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        <Tv className="w-5 h-5 text-purple-400" />
                        <span>Networks & Studios</span>
                        <span className="text-xs font-normal text-neutral-400">({apiNetworks.length})</span>
                      </h2>
                    </div>
                    <div className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
                      {apiNetworks.map((net) => (
                        <div
                          key={net.slug || net.id}
                          onClick={() => router.push(`/${net.id.replace(/^\/+|\/+$/g, "")}`)}
                          className="group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#12111d]/90 hover:bg-[#1a172c] border border-white/10 hover:border-purple-500/50 shadow-md hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-300 cursor-pointer min-w-[130px] sm:min-w-[150px] shrink-0 active:scale-95"
                        >
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/[0.04] border border-white/10 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {net.image ? (
                              <img
                                src={net.image}
                                alt={net.name}
                                className="w-full h-full object-contain filter drop-shadow"
                              />
                            ) : (
                              <span className="text-xs font-bold text-neutral-300">{net.name}</span>
                            )}
                          </div>
                          <span className="mt-2.5 text-xs font-semibold text-neutral-300 group-hover:text-white truncate max-w-[120px] text-center">
                            {net.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* Languages & Multi-Audio Hub from Home API */}
              {apiLanguages.length > 0 && (
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                  <section className="relative w-full py-4 select-none">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-purple-400" />
                        <span>Languages</span>
                        <span className="text-xs font-normal text-neutral-400">({apiLanguages.length})</span>
                      </h2>
                    </div>
                    <div className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
                      {apiLanguages.map((lang) => (
                        <div
                          key={lang.slug || lang.id}
                          onClick={() => router.push(`/${lang.id.replace(/^\/+|\/+$/g, "")}`)}
                          className="group relative flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#12111d]/90 hover:bg-gradient-to-r hover:from-purple-950/50 hover:to-indigo-950/40 border border-white/10 hover:border-purple-500/50 shadow-md hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-300 cursor-pointer min-w-[170px] shrink-0 active:scale-95"
                        >
                          {lang.image ? (
                            <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-neutral-900 shadow">
                              <img
                                src={lang.image}
                                alt={lang.name}
                                className="w-full h-full object-cover filter brightness-[0.95] group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 font-bold flex items-center justify-center text-xs border border-purple-500/30 shrink-0">
                              {lang.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-neutral-200 group-hover:text-white transition-colors truncate">
                              {lang.name}
                            </span>
                            <span className="text-[10px] text-purple-400 font-semibold tracking-wide uppercase">
                              Multi-Audio
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* Real Popular Movies Shelf from API */}
              {apiPopularMovies.length > 0 && (
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                  <AnimeSection
                    title="Popular Anime Movies"
                    items={apiPopularMovies}
                    myListIds={myListIds}
                    onToggleMyList={handleToggleMyList}
                    onSelectAnime={handleSelectCardAnime}
                  />
                </div>
              )}

              {/* Additional Shelves */}
              <div className="max-w-[1600px] mx-auto px-4 sm:px-8 space-y-4 pb-12">
                {/* Newest Drops */}
                {apiNewestDrops.length > 0 && (
                  <AnimeSection
                    title="Newest Drops"
                    items={apiNewestDrops}
                    myListIds={myListIds}
                    onToggleMyList={handleToggleMyList}
                    onSelectAnime={handleSelectCardAnime}
                  />
                )}

                {/* Genre Filter Pills & Dynamic Anime Divs Grid */}
                <div className="pt-2 space-y-4">
                  <GenreFilter
                    selectedGenre={selectedGenre}
                    onSelectGenre={setSelectedGenre}
                  />

                  {/* Dynamic Anime Divs matching selected genre */}
                  {isGenreLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5 animate-pulse">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-[3/4] rounded-2xl bg-[#12111b] border border-white/5"
                        />
                      ))}
                    </div>
                  ) : genreAnimeList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
                      {genreAnimeList.map((anime) => (
                        <div
                          key={anime.id}
                          onClick={() => handleSelectCardAnime(anime)}
                          className="group flex flex-col cursor-pointer select-none transition-all duration-300"
                        >
                          {/* 3:4 Poster Image Container */}
                          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#12111b] border border-white/10 group-hover:border-purple-500/50 shadow-md group-hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.4)] transition-all duration-300 group-hover:scale-[1.03]">
                            <img
                              src={anime.image}
                              alt={anime.title}
                              loading="lazy"
                              className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300"
                            />

                            {/* Badge */}
                            {anime.badge && (
                              <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/65 backdrop-blur-md border border-white/10 text-purple-300">
                                {anime.badge}
                              </div>
                            )}

                            {/* Hover Overlay with Play Button & List Toggle */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
                                <Play className="w-5 h-5 fill-black ml-0.5" />
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleMyList(anime);
                                }}
                                className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  myListIds.has(anime.id)
                                    ? "bg-purple-600 text-white"
                                    : "bg-black/60 border border-white/20 text-white hover:bg-black/90"
                                }`}
                                title={myListIds.has(anime.id) ? "Remove from List" : "Add to List"}
                              >
                                {myListIds.has(anime.id) ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <div className="pt-2 px-1">
                            <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                              {anime.title}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-neutral-500">
                      No titles found for {selectedGenre}.
                    </div>
                  )}
                </div>

                {/* Most Popular Series */}
                {apiMostPopular.length > 0 && (
                  <AnimeSection
                    title="Most Popular Series"
                    items={apiMostPopular}
                    myListIds={myListIds}
                    onToggleMyList={handleToggleMyList}
                    onSelectAnime={handleSelectCardAnime}
                  />
                )}

                {/* Currently Airing */}
                {apiAiring.length > 0 && (
                  <AnimeSection
                    title="Currently Airing"
                    items={apiAiring}
                    showProgress={true}
                    myListIds={myListIds}
                    onToggleMyList={handleToggleMyList}
                    onSelectAnime={handleSelectCardAnime}
                  />
                )}

                {/* Cartoons & Animation */}
                {apiCartoons.length > 0 && (
                  <AnimeSection
                    title="Cartoons & Animation"
                    items={apiCartoons}
                    myListIds={myListIds}
                    onToggleMyList={handleToggleMyList}
                    onSelectAnime={handleSelectCardAnime}
                  />
                )}
              </div>
            </>
          )}
        </main>

        {/* Footer with A-Z List and navigation */}
        <AZFooter />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") {
            setActiveNav("home");
          }
        }}
        myListCount={myList.length}
      />

      {/* Interactive Video Player Modal */}
      <PlayerModal
        anime={playingAnime}
        initialEpisode={playingEpisode}
        initialSeasonNumber={playingSeasonNumber}
        onClose={() => {
          setPlayingAnime(null);
          setPlayingEpisode(null);
        }}
        isInMyList={playingAnime ? myListIds.has(playingAnime.id) : false}
        onToggleMyList={handleToggleMyList}
      />

      {/* Detailed Info Modal */}
      <InfoModal
        anime={infoAnime}
        onClose={() => setInfoAnime(null)}
        onPlay={(a) => {
          setInfoAnime(null);
          handleHeroPlay(a);
        }}
        isInMyList={infoAnime ? myListIds.has(infoAnime.id) : false}
        onToggleMyList={handleToggleMyList}
      />
    </div>
  );
}
