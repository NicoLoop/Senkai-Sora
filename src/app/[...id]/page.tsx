"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AnimeSection } from "@/components/AnimeSection";
import {
  fetchAnimeInfo,
  fetchMovieInfo,
  fetchEpisodeInfo,
  fetchStreamServers,
  fetchHomeFeed,
  mapFeedCardToAnimeItem,
  resolveAbyssVideo,
  fetchPlayXStreamData,
  AbyssResolveResponse,
  ApiStreamServerItem,
  API_BASE_URL,
} from "@/services/api";
import { AnimeVideoPlayer, VideoQualityOption } from "@/components/AnimeVideoPlayer";
import { TopProgressBar, startTopPreloader, finishTopPreloader } from "@/components/TopProgressBar";
import { AZFooter } from "@/components/AZFooter";
import { AnimeItem } from "@/data/animeData";
import {
  addToWatchHistory,
  saveWatchProgress,
  getSavedProgressForEpisode,
  getAnimeRootId,
  getPlayerControls,
  savePlayerControls,
  addToWatchlist,
  removeFromWatchlist,
  isItemInWatchlist,
} from "@/utils/cookieStorage";
import {
  Play,
  Plus,
  Check,
  ArrowLeft,
  Volume2,
  Tv,
  Film,
  Sparkles,
  Share2,
  Heart,
  ChevronDown,
  Clock,
  Cast,
  SkipForward,
  SkipBack,
  ExternalLink,
  Copy,
  Maximize2,
  Minimize2,
  Lightbulb,
  Users,
  Flag,
  Search,
  Eye,
  LayoutGrid,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id?: string[] | string }> | { id?: string[] | string };
}

function AnimeDynamicContent({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params as Promise<{ id?: string[] | string }>) as
    | { id?: string[] | string }
    | undefined;
  const rawParam = resolvedParams?.id;
  const idArray = Array.isArray(rawParam) ? rawParam : [rawParam || ""];
  const rawId = idArray.filter(Boolean).join("/");
  const cleanId = decodeURIComponent(rawId).replace(/^\/+|\/+$/g, "");

  const [activeTab, setActiveTab] = useState("home");
  const [activeNav, setActiveNav] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");

  // Determine page mode based on slug
  const isEpisodeRoute =
    cleanId.startsWith("episode/") ||
    cleanId.startsWith("episode-") ||
    cleanId.includes("1x") ||
    cleanId.includes("2x") ||
    cleanId.includes("3x") ||
    cleanId.includes("4x");

  const isMovieRoute =
    cleanId.startsWith("movies/") || cleanId.startsWith("movie/");

  // Loading & Data State
  const [isLoading, setIsLoading] = useState(true);
  const [animeData, setAnimeData] = useState<any | null>(null);
  const [episodeData, setEpisodeData] = useState<any | null>(null);

  // In-Place Episode Streaming & Control States
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>(cleanId);
  const [isEpisodeLoading, setIsEpisodeLoading] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isLightDimmed, setIsLightDimmed] = useState<boolean>(false);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [autoNext, setAutoNext] = useState<boolean>(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState<boolean>(true);
  const [initialSeekTime, setInitialSeekTime] = useState<number>(0);

  // Series Season & Episode State
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [seriesSeasons, setSeriesSeasons] = useState<any[]>([]);

  // Video Streaming State for Episode or Movie
  const [availableServers, setAvailableServers] = useState<ApiStreamServerItem[]>([]);
  const availableServersRef = useRef<ApiStreamServerItem[]>([]);
  const [selectedServerName, setSelectedServerName] = useState<string>("sora");
  const selectedServerNameRef = useRef<string>("sora");
  const [activeAudioMode, setActiveAudioMode] = useState<"dub" | "sub">("dub");
  const activeAudioModeRef = useRef<"dub" | "sub">("dub");
  const [currentPlayXId, setCurrentPlayXId] = useState<string>("");
  const currentPlayXIdRef = useRef<string>("");
  const [videoQualities, setVideoQualities] = useState<VideoQualityOption[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("1080p (Sora)");
  const [audioLanguages, setAudioLanguages] = useState<
    Array<{
      language: string;
      code?: string;
      short?: string;
      videoId?: string;
      directUrl?: string;
    }>
  >([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Multi (Sora)");
  const [isResolvingStream, setIsResolvingStream] = useState<boolean>(false);
  const [playerSubtitles, setPlayerSubtitles] = useState<any[]>([]);
  const [playerIntro, setPlayerIntro] = useState<any>(null);
  const [playerOutro, setPlayerOutro] = useState<any>(null);
  const [playerThumbnailsUrl, setPlayerThumbnailsUrl] = useState<string>("");

  // Load player controls and resume time from cookies on client mount
  useEffect(() => {
    const controls = getPlayerControls();
    setSelectedServerName(controls.server);
    selectedServerNameRef.current = controls.server;
    setActiveAudioMode(controls.type);
    activeAudioModeRef.current = controls.type;
    setIsTheaterMode(controls.expand);
    setIsLightDimmed(!controls.light);
    setAutoPlay(controls.autoplay);
    setAutoNext(controls.autoNext);
    setAutoSkipIntro(controls.autoSkip);

    const savedProgress = getSavedProgressForEpisode(cleanId);
    if (savedProgress && savedProgress > 0) {
      setInitialSeekTime(savedProgress);
    }
  }, [cleanId]);

  // Watchlist & Recommendations
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [recommendations, setRecommendations] = useState<AnimeItem[]>([]);

  // Episode Search Filter Query
  const [episodeFilterQuery, setEpisodeFilterQuery] = useState("");

  // Home Feed Sections Data
  const [topAiringAnime, setTopAiringAnime] = useState<AnimeItem[]>([]);
  const [topAnimeMovies, setTopAnimeMovies] = useState<AnimeItem[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<AnimeItem[]>([]);

  // -------------------------------------------------------------
  // Switch / Activate Streaming Server (SORA or ABYSS in DUB or SUB mode)
  // -------------------------------------------------------------
  const activateServer = useCallback(
    async (
      serverName: string,
      targetLangName?: string,
      mode: "dub" | "sub" = "dub",
      serversList: ApiStreamServerItem[] = []
    ) => {
      const list = serversList.length > 0 ? serversList : availableServersRef.current;
      const normServer = serverName.toLowerCase() === "playx" ? "sora" : serverName.toLowerCase();
      selectedServerNameRef.current = normServer;
      setSelectedServerName(normServer);
      activeAudioModeRef.current = mode;
      setActiveAudioMode(mode);
      savePlayerControls({
        server: normServer as any,
        type: mode,
      });

      // Find Sora/PlayX server ID if available
      const playxSrv = list.find((s) => s.serverName.toLowerCase() === "playx" || s.serverName.toLowerCase() === "sora");
      const foundPlayXId =
        playxSrv?.languages?.[0]?.video_id ||
        (playxSrv as any)?.serverId ||
        currentPlayXIdRef.current ||
        episodeData?.streamInfo?.playXID;

      if (foundPlayXId) {
        currentPlayXIdRef.current = foundPlayXId;
        setCurrentPlayXId(foundPlayXId);
      }

      // Always query Sora to obtain subtitles, intro, and thumbnails
      let soraData: any = null;
      if (foundPlayXId) {
        try {
          soraData = await fetchPlayXStreamData(foundPlayXId);
          if (soraData && soraData.success) {
            if (soraData.subtitles && soraData.subtitles.length > 0) {
              setPlayerSubtitles(soraData.subtitles);
            }
            if (soraData.intro) {
              setPlayerIntro(soraData.intro);
            } else if (soraData.fields?.intro) {
              const [start, end] = soraData.fields.intro.split("-").map(Number);
              if (!isNaN(start) && !isNaN(end)) {
                setPlayerIntro({ start, end, enabled: true });
              }
            }
            if (soraData.outro) {
              setPlayerOutro(soraData.outro);
            } else if (soraData.fields?.outro) {
              const [start, end] = soraData.fields.outro.split("-").map(Number);
              if (!isNaN(start) && !isNaN(end)) {
                setPlayerOutro({ start, end, enabled: true });
              }
            }
            const thumb =
              soraData.thumbnails?.originalUrl ||
              soraData.tracks?.find((t: any) => t.kind === "thumbnails")?.originalUrl;
            if (thumb) {
              setPlayerThumbnailsUrl(thumb);
            }
          }
        } catch (err) {
          console.error("Error fetching Sora player metadata:", err);
        }
      }

      // 1. SORA SERVER
      if (normServer === "sora") {
        const directProxyUrl =
          soraData?.streamProxyUrl ||
          playxSrv?.streamUrl ||
          playxSrv?.languages?.[0]?.streamUrl;

        if (directProxyUrl) {
          setVideoQualities([
            { label: "1080p (Sora)", url: directProxyUrl },
            { label: "Auto", url: directProxyUrl },
          ]);
          setCurrentQuality("1080p (Sora)");

          if (mode === "sub") {
            setSelectedLanguage("Japanese");
            setAudioLanguages([{ language: "Japanese (Original)" }]);
          } else {
            setSelectedLanguage("Multi (Sora)");
            setAudioLanguages([
              { language: "Multi (Default)" },
              { language: "Japanese" },
              { language: "English" },
              { language: "Hindi" },
            ]);
          }
        }
        return;
      }

      // 2. ABYSS SERVER (or other servers)
      const targetServer =
        list.find((s) => s.serverName.toLowerCase() === normServer) || list[0];
      if (!targetServer) return;

      const proxyBase = (process.env.NEXT_PUBLIC_ABYSS_PROXY_URL || "https://abyss-proxies-production.up.railway.app").replace(/\/+$/, "");
      const abyssLangs = (targetServer.languages || []).map((l) => {
        const raw = l.sourceUrl || (l as any).directUrl || l.streamUrl;
        const directUrl = (raw && raw.includes("ravok.buzz") && !raw.includes("/player/stream/proxy"))
          ? `${proxyBase}/player/stream/proxy?url=${encodeURIComponent(raw)}&videoId=${foundPlayXId || ""}`
          : raw;
        return {
          language: l.language,
          code: l.code,
          short: l.short,
          videoId: l.video_id,
          directUrl,
        };
      });

      if (mode === "sub") {
        // In SUB: loads ONLY Japanese audio + subtitles from Sora
        const jpTrack =
          abyssLangs.find(
            (l) =>
              l.code === "ja" ||
              l.code === "jpn" ||
              l.language.toLowerCase().includes("japan")
          ) || abyssLangs[0];

        setAudioLanguages([{ language: "Japanese (Original)" }]);
        if (jpTrack) {
          setSelectedLanguage("Japanese");
          if (jpTrack.videoId) {
            setIsResolvingStream(true);
            try {
              const resolved = await resolveAbyssVideo(jpTrack.videoId);
              if (resolved && resolved.success) {
                if (resolved.sources && resolved.sources.length > 0) {
                  const quals: VideoQualityOption[] = resolved.sources.map((s) => ({
                    label: s.label,
                    url: s.directStreamUrl,
                  }));
                  setVideoQualities(quals);
                  setCurrentQuality(quals[0].label);
                } else if (resolved.streamUrl) {
                  setVideoQualities([{ label: "1080p", url: resolved.streamUrl }]);
                  setCurrentQuality("1080p");
                }
              }
            } catch (err) {
              console.error("Error resolving Abyss Japanese stream:", err);
            } finally {
              setIsResolvingStream(false);
            }
          } else if (jpTrack.directUrl) {
            setVideoQualities([{ label: "Default", url: jpTrack.directUrl }]);
            setCurrentQuality("Default");
          }
        }
      } else {
        // In DUB: audioLanguages passed into player settings
        if (abyssLangs.length > 0) {
          setAudioLanguages(abyssLangs);
        }

        const chosenTrack =
          (targetLangName &&
            abyssLangs.find(
              (l) => l.language.toLowerCase() === targetLangName.toLowerCase()
            )) ||
          abyssLangs.find(
            (l) =>
              l.code === "hin" ||
              l.language.toLowerCase().includes("hindi")
          ) ||
          abyssLangs[0];

        if (chosenTrack) {
          setSelectedLanguage(chosenTrack.language);
          if (chosenTrack.videoId && targetServer.serverName.toLowerCase() === "abyss") {
            setIsResolvingStream(true);
            try {
              const resolved = await resolveAbyssVideo(chosenTrack.videoId);
              if (resolved && resolved.success) {
                if (resolved.sources && resolved.sources.length > 0) {
                  const quals: VideoQualityOption[] = resolved.sources.map((s) => ({
                    label: s.label,
                    url: s.directStreamUrl,
                  }));
                  setVideoQualities(quals);
                  setCurrentQuality(quals[0].label);
                } else if (resolved.streamUrl) {
                  setVideoQualities([{ label: "1080p", url: resolved.streamUrl }]);
                  setCurrentQuality("1080p");
                }
              } else if (chosenTrack.directUrl) {
                setVideoQualities([{ label: "Default", url: chosenTrack.directUrl }]);
                setCurrentQuality("Default");
              }
            } catch (err) {
              console.error("Error resolving Abyss stream:", err);
              if (chosenTrack.directUrl) {
                setVideoQualities([{ label: "Default", url: chosenTrack.directUrl }]);
                setCurrentQuality("Default");
              }
            } finally {
              setIsResolvingStream(false);
            }
          } else if (chosenTrack.directUrl) {
            setVideoQualities([{ label: "Default", url: chosenTrack.directUrl }]);
            setCurrentQuality("Default");
          }
        }
      }
    },
    [episodeData]
  );

  // -------------------------------------------------------------
  // Dedicated In-Place Episode Loader (No Page Reload)
  // -------------------------------------------------------------
  const loadEpisodeData = useCallback(
    async (targetEpId: string, shouldAutoPlay = false) => {
      setIsEpisodeLoading(true);
      try {
        const savedProgress = getSavedProgressForEpisode(targetEpId);
        if (savedProgress && savedProgress > 0) {
          setInitialSeekTime(savedProgress);
        } else {
          setInitialSeekTime(0);
        }

        const epRes = await fetchEpisodeInfo(targetEpId);
        if (epRes && epRes.success && epRes.data) {
          const ep = epRes.data;
          setEpisodeData(ep);

          try {
            saveWatchProgress({
              id: ep.anime?.id || getAnimeRootId(targetEpId),
              episodeId: targetEpId,
              animeTitle: ep.anime?.title || ep.title,
              episodeTitle: ep.title,
              season: ep.runningEpisode?.season || 1,
              episode: ep.runningEpisode?.episode || 1,
              image: (ep as any).image || ep.anime?.image,
              currentTime: savedProgress || 0,
              duration: 0,
            });
          } catch {
            // ignore
          }

          if (ep.runningEpisode?.season) {
            setSelectedSeasonNumber(ep.runningEpisode.season);
          }

          const seriesIdToFetch = ep.anime?.id || (targetEpId ? `series/${getAnimeRootId(targetEpId)}` : null);
          if (seriesIdToFetch) {
            fetchAnimeInfo(seriesIdToFetch).then((seriesRes) => {
              if (seriesRes && seriesRes.success && seriesRes.data) {
                const s = seriesRes.data;
                setAnimeData(s);
                if (s.seasons && s.seasons.length > 0) {
                  setSeriesSeasons(s.seasons);
                }
                if (s.title) {
                  setEpisodeData((prev: any) => {
                    if (!prev) return prev;
                    let resolvedEpTitle = prev.title;
                    if (s.seasons) {
                      for (const seasonObj of s.seasons) {
                        if (seasonObj.episodes) {
                          const matchedInSeason = seasonObj.episodes.find(
                            (e: any) =>
                              e.id === targetEpId ||
                              e.id === `episode/${targetEpId.replace(/^episode\//, "")}` ||
                              (e.season === prev.runningEpisode?.season && e.episode === prev.runningEpisode?.episode)
                          );
                          if (matchedInSeason && matchedInSeason.title) {
                            resolvedEpTitle = matchedInSeason.title;
                            break;
                          }
                        }
                      }
                    }
                    return {
                      ...prev,
                      title: resolvedEpTitle,
                      anime: {
                        ...(prev.anime || {}),
                        id: seriesIdToFetch,
                        title: s.title,
                      },
                    };
                  });
                }
              }
            });
          }

          const streamInfo = ep.streamInfo;
          const playXID = streamInfo?.playXID;
          if (playXID) {
            currentPlayXIdRef.current = playXID;
            setCurrentPlayXId(playXID);
          }
          const abyssId = streamInfo?.abyssId || streamInfo?.streamId;
          const serversEndpoint = streamInfo?.serversEndpoint;
          let foundDirectUrl = false;

          if (playXID || abyssId || serversEndpoint) {
            const serversRes = await fetchStreamServers({
              playXID,
              abyssId,
              serversEndpoint,
            });

            if (
              serversRes &&
              serversRes.success &&
              serversRes.data?.servers &&
              serversRes.data.servers.length > 0
            ) {
              const srvs = serversRes.data.servers;
              availableServersRef.current = srvs;
              setAvailableServers(srvs);

              const playxSrv = srvs.find((s) => s.serverName.toLowerCase() === "playx");
              const resolvedPlayXId =
                playxSrv?.languages?.[0]?.video_id ||
                serversRes.data?.playXID ||
                (serversRes as any).playXID ||
                playXID;
              if (resolvedPlayXId) {
                currentPlayXIdRef.current = resolvedPlayXId;
                setCurrentPlayXId(resolvedPlayXId);
              }

              const abyssSrv = srvs.find((s) => s.serverName.toLowerCase() === "abyss");
              if (abyssSrv?.languages && abyssSrv.languages.length > 0) {
                const abyssLangs = abyssSrv.languages.map((l) => ({
                  language: l.language,
                  code: l.code,
                  short: l.short,
                  videoId: l.video_id,
                  directUrl: l.sourceUrl || (l as any).directUrl,
                }));
                setAudioLanguages(abyssLangs);
              }

              const defaultServerKey =
                selectedServerNameRef.current ||
                serversRes.data.defaultSource?.serverName ||
                srvs[0]?.serverName ||
                "sora";
              const defaultMode = activeAudioModeRef.current || "dub";

              await activateServer(defaultServerKey, undefined, defaultMode, srvs);
              foundDirectUrl = true;
            }
          }

          if (!foundDirectUrl && ep.otherPlayers && ep.otherPlayers.length > 0) {
            setVideoQualities([{ label: "Default", url: ep.otherPlayers[0].embedUrl }]);
            setCurrentQuality("Default");
            setAudioLanguages([]);
            availableServersRef.current = [];
            setAvailableServers([]);
          }

          if (shouldAutoPlay) {
            setAutoPlay(true);
          }
        }
      } catch (err) {
        console.error("Failed to load episode in-place:", err);
      } finally {
        setIsEpisodeLoading(false);
        finishTopPreloader();
      }
    },
    [activateServer]
  );

  useEffect(() => {
    setIsInWatchlist(isItemInWatchlist(cleanId));
  }, [cleanId]);

  // -------------------------------------------------------------
  // 1. Initial Data Fetching
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadContent() {
      try {
        if (isEpisodeRoute) {
          await loadEpisodeData(cleanId, false);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (isMovieRoute) {
          const movieRes = await fetchMovieInfo(cleanId);
          if (movieRes && movieRes.success && movieRes.data && isMounted) {
            const m = movieRes.data;
            setAnimeData(m);

            if (m.multiAudioPlayers && m.multiAudioPlayers.length > 0) {
              const langs = m.multiAudioPlayers.map((p) => ({
                language: p.language,
                directUrl: p.sourceUrl,
              }));
              setAudioLanguages(langs);
              const hindiTrack =
                langs.find((l) => l.language.toLowerCase().includes("hin")) ||
                langs[0];
              if (hindiTrack) {
                setVideoQualities([{ label: "Default", url: hindiTrack.directUrl }]);
                setSelectedLanguage(hindiTrack.language);
              }
            } else if (m.players && m.players.length > 0) {
              setVideoQualities([{ label: "Default", url: m.players[0].embedUrl }]);
            }
            setIsLoading(false);
            return;
          }
        }

        const seriesRes = await fetchAnimeInfo(cleanId);
        if (seriesRes && seriesRes.success && seriesRes.data && isMounted) {
          const s = seriesRes.data;
          setAnimeData(s);
          if (s.seasons && s.seasons.length > 0) {
            setSelectedSeasonNumber(s.seasons[0].season || 1);
          }
          setIsLoading(false);
          return;
        }

        const movieFallback = await fetchMovieInfo(cleanId);
        if (movieFallback && movieFallback.success && movieFallback.data && isMounted) {
          const m = movieFallback.data;
          setAnimeData(m);
          if (m.multiAudioPlayers && m.multiAudioPlayers.length > 0) {
            const langs = m.multiAudioPlayers.map((p) => ({
              language: p.language,
              directUrl: p.sourceUrl,
            }));
            setAudioLanguages(langs);
            if (langs[0]?.directUrl) {
              setVideoQualities([{ label: "Default", url: langs[0].directUrl }]);
            }
          }
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading content:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadContent();

    async function loadHomeFeedSections() {
      try {
        const feed = await fetchHomeFeed();
        if (feed && feed.success && feed.data && isMounted) {
          if (feed.data["airing"]) {
            setTopAiringAnime(
              feed.data["airing"].slice(0, 14).map((item) => mapFeedCardToAnimeItem(item, "Airing"))
            );
          }
          if (feed.data["most-popular-movies"]) {
            setTopAnimeMovies(
              feed.data["most-popular-movies"].slice(0, 14).map((item) => mapFeedCardToAnimeItem(item, "Movie"))
            );
          }
          if (feed.data["most-popular"]) {
            const mapped = feed.data["most-popular"].map((item) => mapFeedCardToAnimeItem(item, "Popular"));
            setTrendingAnime(mapped.slice(0, 14));
            setRecommendations(mapped.slice(0, 10));
          }
        }
      } catch (e) {
        // quiet ignore
      }
    }
    loadHomeFeedSections();

    return () => {
      isMounted = false;
    };
  }, [cleanId, isEpisodeRoute, isMovieRoute]);

  // Listen to browser Back / Forward history for seamless in-place episode navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, "");
      if (
        currentPath &&
        currentPath !== currentEpisodeId &&
        (currentPath.startsWith("episode") ||
          currentPath.includes("1x") ||
          currentPath.includes("2x") ||
          currentPath.includes("3x"))
      ) {
        setCurrentEpisodeId(currentPath);
        loadEpisodeData(currentPath, false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentEpisodeId]);

  // Handle switching audio language on player by resolving the Abyss video ID or PlayX stream
  const handleSelectLanguage = async (lang: {
    language: string;
    code?: string;
    short?: string;
    videoId?: string;
    directUrl?: string;
  }) => {
    setSelectedLanguage(lang.language);
    savePlayerControls({ language: lang.language });

    if (lang.videoId && selectedServerName.toLowerCase() === "abyss") {
      setIsResolvingStream(true);
      try {
        const resolved = await resolveAbyssVideo(lang.videoId);
        if (resolved && resolved.success) {
          if (resolved.sources && resolved.sources.length > 0) {
            const quals: VideoQualityOption[] = resolved.sources.map((s) => ({
              label: s.label,
              url: s.directStreamUrl,
            }));
            setVideoQualities(quals);
            const exists = quals.some((q) => q.label.toLowerCase() === currentQuality.toLowerCase());
            if (!exists) {
              setCurrentQuality(quals[0].label);
            }
          } else if (resolved.streamUrl) {
            setVideoQualities([{ label: "1080p", url: resolved.streamUrl }]);
            setCurrentQuality("1080p");
          }
        } else if (lang.directUrl) {
          setVideoQualities([{ label: "Default", url: lang.directUrl }]);
          setCurrentQuality("Default");
        }
      } catch (err) {
        console.error("Error resolving abyss language stream:", err);
        if (lang.directUrl) {
          setVideoQualities([{ label: "Default", url: lang.directUrl }]);
          setCurrentQuality("Default");
        }
      } finally {
        setIsResolvingStream(false);
      }
    } else if (lang.directUrl) {
      setVideoQualities([{ label: "Default", url: lang.directUrl }]);
      setCurrentQuality("Default");
    }
  };

  // Current Season in Series View
  const currentSeason = useMemo(() => {
    if (!animeData?.seasons) return null;
    return (
      animeData.seasons.find((s: any) => s.season === selectedSeasonNumber) ||
      animeData.seasons[0]
    );
  }, [animeData, selectedSeasonNumber]);

  // Episodes to display in Episode Page (supports all seasons)
  const currentSeasonEpisodes = useMemo(() => {
    if (seriesSeasons && seriesSeasons.length > 0) {
      const matchedSeason = seriesSeasons.find(
        (s: any) => s.season === selectedSeasonNumber
      );
      if (matchedSeason && matchedSeason.episodes && matchedSeason.episodes.length > 0) {
        return matchedSeason.episodes;
      }
    }
    return episodeData?.episodesList || [];
  }, [seriesSeasons, selectedSeasonNumber, episodeData]);

  // Filtered episodes based on search query
  const filteredEpisodes = useMemo(() => {
    if (!episodeFilterQuery.trim()) return currentSeasonEpisodes;
    const q = episodeFilterQuery.toLowerCase();
    return currentSeasonEpisodes.filter(
      (ep: any) =>
        ep.title?.toLowerCase().includes(q) ||
        String(ep.episode).includes(q) ||
        ep.description?.toLowerCase().includes(q)
    );
  }, [currentSeasonEpisodes, episodeFilterQuery]);

  // First Episode of Series to watch
  const firstEpisode = useMemo(() => {
    if (animeData?.seasons?.[0]?.episodes?.[0]) {
      return animeData.seasons[0].episodes[0];
    }
    return null;
  }, [animeData]);

  // Handler to navigate to an episode page: in-place without page reload if on episode route!
  const handleGoToEpisode = (epId: string) => {
    startTopPreloader();
    const clean = epId.replace(/^\/+|\/+$/g, "");
    if (!isEpisodeRoute) {
      router.push(`/${clean}`);
      return;
    }

    const normClean = clean.replace(/^episode\//, "");
    const normCurrent = currentEpisodeId.replace(/^episode\//, "");
    if (normClean === normCurrent && episodeData) return;

    // 1. Instant UI update: selected episode in shelf updates immediately
    setCurrentEpisodeId(clean);

    // 2. Optimistic update for episodeData so Now Playing updates instantly
    const matchedEp = currentSeasonEpisodes.find(
      (ep: any) =>
        ep.id === clean ||
        ep.id === normClean ||
        ep.id === `episode/${normClean}` ||
        ep.link?.includes(normClean)
    );
    if (matchedEp) {
      setEpisodeData((prev: any) => ({
        ...prev,
        title: matchedEp.title || `${animeData?.title || prev?.anime?.title || "Anime"} ${matchedEp.season || 1}x${matchedEp.episode}`,
        runningEpisode: {
          season: matchedEp.season || prev?.runningEpisode?.season || 1,
          episode: matchedEp.episode,
          title: matchedEp.title,
        },
      }));
    } else {
      const epMatch = normClean.match(/(\d+)x(\d+)/i);
      if (epMatch) {
        const sNum = parseInt(epMatch[1], 10);
        const epNum = parseInt(epMatch[2], 10);
        setEpisodeData((prev: any) => ({
          ...prev,
          title: `${animeData?.title || prev?.anime?.title || "Anime"} ${sNum}x${epNum}`,
          runningEpisode: {
            season: sNum,
            episode: epNum,
            title: `${sNum}x${epNum}`,
          },
        }));
      }
    }

    // 3. Change browser URL without triggering full page reload
    window.history.pushState(null, "", `/${clean}`);

    // 4. Clear previous stream & qualities to trigger clean skeleton and reload
    setVideoQualities([]);
    setAudioLanguages([]);
    setAvailableServers([]);
    availableServersRef.current = [];

    // 5. Load episode stream data and Abyss sources with skeleton screen
    loadEpisodeData(clean, true);
  };

  const isMovie = isMovieRoute || Boolean(animeData?.isMovie);

  const handleWatchNow = () => {
    if (isMovie) {
      const normClean = cleanId.replace(/^\/+|\/+$/g, "");
      const target =
        normClean.startsWith("movies/") || normClean.startsWith("movie/")
          ? `/watch/${normClean}`
          : `/watch/movies/${normClean}`;
      router.push(target);
    } else if (firstEpisode) {
      handleGoToEpisode(firstEpisode.id);
    }
  };

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
        {/* Top Floating Navbar (Home, Browse, Kids, Support, FAQ + Search) */}
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

        <main
          className={`flex-1 w-full mx-auto px-4 sm:px-8 pt-24 md:pt-28 lg:pt-32 space-y-8 ${
            isTheaterMode && isEpisodeRoute ? "max-w-none" : "max-w-[1600px]"
          }`}
        >
          {/* Dimmed Light Backdrop: Fullscreen pitch black covering navbar, sidebar, everything */}
          {isLightDimmed && (
            <div
              onClick={() => setIsLightDimmed(false)}
              className="fixed inset-0 bg-black z-45 transition-opacity duration-300 cursor-pointer"
              title="Click anywhere to turn light back on"
            />
          )}

          {/* Back Navigation Bar (hidden on episode watch view) */}
          {!isEpisodeRoute && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border-t border-l border-white/20 border-r border-b border-black/30 backdrop-blur-xl text-neutral-300 hover:text-white text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
          )}

          {isLoading ? (
            /* Initial Loading Skeleton */
            <div className="space-y-6 animate-pulse">
              <div className="w-full h-80 sm:h-96 rounded-3xl bg-neutral-900 border border-white/5" />
              <div className="w-64 h-8 bg-neutral-800 rounded-full" />
              <div className="w-full max-w-2xl h-24 bg-neutral-900 rounded-2xl" />
            </div>
          ) : isEpisodeRoute && episodeData ? (
            /* ============================================================== */
            /* 1. EPISODE STREAMING VIEW: WHERE VIDEO IS SHOWN DIRECTLY       */
            /* ============================================================== */
            <>
              {/* Lights Off Fullscreen Blackout: Hides sidebar, navbar, footer, everything! */}
              {isLightDimmed && (
                <div
                  onClick={() => setIsLightDimmed(false)}
                  className="fixed inset-0 z-45 bg-black cursor-pointer transition-opacity duration-300"
                  title="Click anywhere to turn lights on"
                />
              )}

              <div className={`space-y-6 relative ${isLightDimmed ? "z-50" : "z-10"}`}>
                {/* Episode Header Info */}
                <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold">
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          const sId = episodeData.anime?.id || (cleanId ? `series/${getAnimeRootId(cleanId)}` : "");
                          if (sId) {
                            router.push(`/${sId.replace(/^\/+|\/+$/g, "")}`);
                          }
                        }}
                      >
                        {animeData?.title || episodeData.anime?.title || "Series"}
                      </span>
                      <span>•</span>
                      <span>
                        Season {episodeData.runningEpisode?.season || selectedSeasonNumber || 1} Episode {episodeData.runningEpisode?.episode || 1}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {episodeData.title}
                    </h1>
                  </div>
                </div>

                {/* Player & Controls Layout */}
                {/* Normal Mode: Side by side (Player left, Episode List right) */}
                {/* Expanded Mode: Full width player, Episode List moved down below */}
                <div className={!isTheaterMode ? "flex flex-col lg:flex-row gap-5 items-start" : "space-y-5 w-full"}>
                  {/* Main Player Column */}
                  <div className={!isTheaterMode ? "flex-1 min-w-0 w-full space-y-3" : "w-full space-y-3"}>
                    {isEpisodeLoading ? (
                      <div className="space-y-3">
                        {/* Player Skeleton */}
                        <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0c0b12] border border-white/10 flex flex-col items-center justify-center animate-pulse shadow-2xl">
                          <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-3">
                            <Play className="w-6 h-6 text-purple-400 opacity-50 ml-1" />
                          </div>
                          <div className="h-4 w-52 bg-white/10 rounded-full mb-2" />
                          <div className="h-3 w-32 bg-white/5 rounded-full" />
                        </div>

                        {/* Utility Bar Skeleton */}
                        <div className="h-9 w-full rounded-xl bg-white/5 animate-pulse border border-white/5" />

                        {/* Server Selector Skeleton */}
                        <div className="flex flex-col md:flex-row items-stretch gap-3 animate-pulse">
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl md:w-64 h-24" />
                          <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 h-24 space-y-3">
                            <div className="h-4 w-40 bg-white/10 rounded-full" />
                            <div className="h-6 w-64 bg-white/10 rounded-xl" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <AnimeVideoPlayer
                          key={`${currentEpisodeId}-${selectedServerName}-${activeAudioMode}`}
                          title={episodeData.title}
                          animeTitle={animeData?.title || episodeData.anime?.title || "Senkai Sora"}
                          episodeTitle={episodeData.title}
                          seasonNumber={episodeData.runningEpisode?.season || selectedSeasonNumber || 1}
                          episodeNumber={episodeData.runningEpisode?.episode || 1}
                          serverName={selectedServerName}
                          poster={episodeData.anime?.backdrop || episodeData.anime?.image}
                          qualities={videoQualities}
                          currentQuality={currentQuality}
                          onQualityChange={(newQ) => setCurrentQuality(newQ)}
                          isLoading={isResolvingStream || isEpisodeLoading}
                          selectedLanguage={selectedLanguage}
                          audioLanguages={audioLanguages}
                          onSelectLanguage={handleSelectLanguage}
                          thumbnailVttUrl={playerThumbnailsUrl}
                          onEnded={() => {
                            if (autoNext && episodeData.nextEpisode) {
                              handleGoToEpisode(episodeData.nextEpisode.id);
                            }
                          }}
                          autoPlay={autoPlay}
                          subtitles={playerSubtitles}
                          intro={playerIntro}
                          outro={playerOutro}
                          autoSkipIntro={autoSkipIntro}
                          isSubMode={activeAudioMode === "sub"}
                          initialSeekTime={initialSeekTime}
                          onProgressUpdate={(time, duration) => {
                            saveWatchProgress({
                              id: episodeData.anime?.id || animeData?.id || getAnimeRootId(cleanId),
                              episodeId: currentEpisodeId,
                              animeTitle: episodeData.anime?.title || animeData?.title || episodeData.title || "Senkai Sora",
                              episodeTitle: episodeData.title || `Episode ${episodeData.runningEpisode?.episode || 1}`,
                              season: episodeData.runningEpisode?.season || 1,
                              episode: episodeData.runningEpisode?.episode || 1,
                              image: episodeData.image || episodeData.anime?.image || animeData?.image,
                              currentTime: time,
                              duration: duration,
                            });
                          }}
                        />

                        {/* Utility Actions Bar directly under Player */}
                        <div className="flex items-center justify-between flex-wrap gap-2 px-1 py-1 text-xs select-none">
                          {/* Left Controls */}
                          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                            <button
                              onClick={() => {
                                const nextVal = !isTheaterMode;
                                setIsTheaterMode(nextVal);
                                savePlayerControls({ expand: nextVal });
                              }}
                              className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              {isTheaterMode ? (
                                <Minimize2 className="w-3.5 h-3.5 text-purple-400" />
                              ) : (
                                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                              )}
                              <span className="font-medium">Expand</span>
                            </button>

                            <button
                              onClick={() => {
                                const nextDimmed = !isLightDimmed;
                                setIsLightDimmed(nextDimmed);
                                savePlayerControls({ light: !nextDimmed });
                              }}
                              className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              <Lightbulb
                                className={`w-3.5 h-3.5 ${
                                  isLightDimmed
                                    ? "text-amber-400 fill-amber-400/30"
                                    : "text-neutral-400"
                                }`}
                              />
                              <span className="font-medium">Light</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  isLightDimmed
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-white/5 text-neutral-400"
                                }`}
                              >
                                {isLightDimmed ? "Off" : "On"}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                const nextVal = !autoPlay;
                                setAutoPlay(nextVal);
                                savePlayerControls({ autoplay: nextVal });
                              }}
                              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              <span className="font-medium">Auto Play</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  autoPlay
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-white/5 text-neutral-400"
                                }`}
                              >
                                {autoPlay ? "On" : "Off"}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                const nextVal = !autoNext;
                                setAutoNext(nextVal);
                                savePlayerControls({ autoNext: nextVal });
                              }}
                              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              <span className="font-medium">Auto Next</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  autoNext
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-white/5 text-neutral-400"
                                }`}
                              >
                                {autoNext ? "On" : "Off"}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                const nextVal = !autoSkipIntro;
                                setAutoSkipIntro(nextVal);
                                savePlayerControls({ autoSkip: nextVal });
                              }}
                              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              <span className="font-medium">Auto Skip Intro</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  autoSkipIntro
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-white/5 text-neutral-400"
                                }`}
                              >
                                {autoSkipIntro ? "On" : "Off"}
                              </span>
                            </button>
                          </div>

                          {/* Right Controls */}
                          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap ml-auto">
                            <button
                              onClick={() => {
                                if (isInWatchlist) {
                                  removeFromWatchlist(cleanId);
                                  setIsInWatchlist(false);
                                } else {
                                  addToWatchlist({
                                    id: cleanId,
                                    title: episodeData?.anime?.title || episodeData?.title || animeData?.title || cleanId,
                                    image: episodeData?.image || episodeData?.anime?.backdrop || episodeData?.anime?.image || animeData?.image,
                                    type: isMovieRoute ? "Movie" : "Series",
                                    addedAt: Date.now(),
                                  });
                                  setIsInWatchlist(true);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              {isInWatchlist ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-purple-400" />
                              )}
                              <span className="font-medium">
                                {isInWatchlist ? "In List" : "Add to List"}
                              </span>
                            </button>

                            <button
                              onClick={() => alert("Watch2gether coming soon!")}
                              className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              <span className="font-medium">Watch2gether</span>
                            </button>

                            {episodeData.prevEpisode && (
                              <button
                                onClick={() => handleGoToEpisode(episodeData.prevEpisode.id)}
                                className="inline-flex items-center gap-1 text-neutral-200 hover:text-white font-medium transition cursor-pointer"
                              >
                                <SkipBack className="w-3.5 h-3.5" />
                                <span>Prev</span>
                              </button>
                            )}

                            {episodeData.nextEpisode && (
                              <button
                                onClick={() => handleGoToEpisode(episodeData.nextEpisode.id)}
                                className="inline-flex items-center gap-1 text-purple-300 hover:text-white font-medium transition cursor-pointer"
                              >
                                <span>Next</span>
                                <SkipForward className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => alert("Report issue submitted. Thank you!")}
                              className="inline-flex items-center gap-1 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>Report</span>
                            </button>
                          </div>
                        </div>

                        {/* Server Selection Panel directly under Utility Bar */}
                        <div className="flex flex-col md:flex-row items-stretch gap-3">
                          {/* Left Notification Card */}
                          <div className="bg-gradient-to-br from-purple-950/40 via-[#12111b] to-purple-900/20 border border-purple-500/25 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-center md:w-64 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                            <span className="text-[11px] text-neutral-400 font-medium">
                              You are watching
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 tracking-tight flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                              Episode {episodeData.runningEpisode?.episode || "1"}
                            </span>
                            <p className="text-[10px] text-neutral-400 mt-1.5 leading-snug">
                              If current server doesn't work please try other servers beside.
                            </p>
                          </div>

                          {/* Right Server / Audio Languages Card */}
                          <div className="flex-1 flex flex-col justify-center gap-3 bg-[#12111b]/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
                            {/* Multilingual Notice Banner */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-semibold shadow-inner">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>Sora Supports Multilingual feature. Click settings to toogle.</span>
                            </div>

                            {/* SUB Row: Sora & Abyss */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 shrink-0 w-16 sm:w-20">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-neutral-400">
                                  CC
                                </span>
                                <span>SUB:</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => activateServer("sora", undefined, "sub")}
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                                    selectedServerName.toLowerCase() === "sora" && activeAudioMode === "sub"
                                      ? "bg-purple-600 text-white border border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.5)] ring-1 ring-purple-300/40"
                                      : "bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white"
                                  }`}
                                >
                                  Sora
                                </button>

                                <button
                                  type="button"
                                  onClick={() => activateServer("abyss", undefined, "sub")}
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                                    selectedServerName.toLowerCase() === "abyss" && activeAudioMode === "sub"
                                      ? "bg-purple-600 text-white border border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.5)] ring-1 ring-purple-300/40"
                                      : "bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white"
                                  }`}
                                >
                                  Abyss
                                </button>
                              </div>
                            </div>

                            <div className="w-full h-px bg-white/5" />

                            {/* DUB Row: SORA & ABYSS */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 shrink-0 w-16 sm:w-20">
                                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>DUB:</span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap flex-1">
                                <button
                                  type="button"
                                  onClick={() => activateServer("sora", undefined, "dub")}
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                                    selectedServerName.toLowerCase() === "sora" && activeAudioMode === "dub"
                                      ? "bg-purple-600 text-white border border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.5)] ring-1 ring-purple-300/40"
                                      : "bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white"
                                  }`}
                                >
                                  Sora
                                </button>

                                <button
                                  type="button"
                                  onClick={() => activateServer("abyss", undefined, "dub")}
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                                    selectedServerName.toLowerCase() === "abyss" && activeAudioMode === "dub"
                                      ? "bg-purple-600 text-white border border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.5)] ring-1 ring-purple-300/40"
                                      : "bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white"
                                  }`}
                                >
                                  Abyss
                                </button>

                                {availableServers
                                  .filter(
                                    (s) =>
                                      s.serverName.toLowerCase() !== "abyss" &&
                                      s.serverName.toLowerCase() !== "playx" &&
                                      s.serverName.toLowerCase() !== "sora"
                                  )
                                  .map((srv) => {
                                    const isCurrent =
                                      selectedServerName.toLowerCase() ===
                                      srv.serverName.toLowerCase();
                                    return (
                                      <button
                                        key={srv.serverName}
                                        type="button"
                                        onClick={() => activateServer(srv.serverName, undefined, "dub")}
                                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                                          isCurrent
                                            ? "bg-purple-600 text-white border border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.5)] ring-1 ring-purple-300/40"
                                            : "bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white"
                                        }`}
                                      >
                                        {srv.server || srv.serverName.toUpperCase()}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side Episode List Sidebar (When !isTheaterMode) */}
                  {!isTheaterMode && (
                    <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0">
                      <div className="bg-[#0e0d16]/95 border border-white/10 rounded-2xl p-3 flex flex-col shadow-xl backdrop-blur-md">
                        {/* Header bar matching user screenshot */}
                        <div className="flex items-center gap-2 pb-3 border-b border-white/10 select-none">
                          {/* Season / Range Pill */}
                          {seriesSeasons && seriesSeasons.length > 1 ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <span>
                                  {`Season ${selectedSeasonNumber || 1}`}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                              </button>
                              {isSeasonDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 z-30 w-44 rounded-xl bg-[#141220] border border-white/10 shadow-2xl p-1.5 space-y-1">
                                  {seriesSeasons.map((s: any) => (
                                    <button
                                      key={s.season}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSeasonNumber(s.season);
                                        setIsSeasonDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        s.season === selectedSeasonNumber
                                          ? "bg-purple-600 text-white font-bold"
                                          : "hover:bg-white/5 text-neutral-300"
                                      }`}
                                    >
                                      {s.name || `Season ${s.season}`}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-neutral-300">
                              {`Season ${selectedSeasonNumber || 1}`}
                            </div>
                          )}

                          {/* Filter Input */}
                          <div className="flex-1 relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                              type="text"
                              placeholder="Filter episodes..."
                              value={episodeFilterQuery}
                              onChange={(e) => setEpisodeFilterQuery(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/70 transition"
                            />
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1 text-neutral-400">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white transition cursor-pointer"
                              title="Episodes overview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white transition cursor-pointer"
                              title="Grid mode"
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Episodes List */}
                        <div className="pt-2.5 overflow-y-auto no-scrollbar space-y-2 max-h-[580px] lg:max-h-[640px]">
                          {filteredEpisodes.length === 0 ? (
                            <div className="py-8 text-center text-xs text-neutral-500">
                              No episodes matching &quot;{episodeFilterQuery}&quot;
                            </div>
                          ) : (
                            filteredEpisodes.map((ep: any) => {
                              const isPlaying =
                                ep.id === currentEpisodeId ||
                                ep.id === episodeData?.episodeId ||
                                (currentEpisodeId && ep.id.endsWith(currentEpisodeId)) ||
                                (currentEpisodeId && currentEpisodeId.endsWith(ep.id));

                              return (
                                <div
                                  key={ep.id}
                                  onClick={() => handleGoToEpisode(ep.id)}
                                  className={`group flex items-center gap-3 p-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${
                                    isPlaying
                                      ? "bg-[#b49cf8] text-neutral-950 font-medium shadow-[0_4px_16px_rgba(180,156,248,0.4)] ring-1 ring-purple-300"
                                      : "bg-[#12111b]/80 hover:bg-[#1a1827] text-neutral-200 border border-white/5 hover:border-purple-500/30"
                                  }`}
                                >
                                  {/* Thumbnail on left with EP badge */}
                                  <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-black shadow-sm">
                                    <img
                                      src={ep.image || episodeData.anime?.backdrop || episodeData.anime?.image}
                                      alt={ep.title || `Episode ${ep.episode}`}
                                      className={`w-full h-full object-cover transition-transform duration-300 ${
                                        isPlaying ? "brightness-100" : "brightness-[0.88] group-hover:brightness-100 group-hover:scale-105"
                                      }`}
                                      onError={(e) => {
                                        if (episodeData.anime?.backdrop && e.currentTarget.src !== episodeData.anime.backdrop) {
                                          e.currentTarget.src = episodeData.anime.backdrop;
                                        } else if (episodeData.anime?.image && e.currentTarget.src !== episodeData.anime.image) {
                                          e.currentTarget.src = episodeData.anime.image;
                                        }
                                      }}
                                    />
                                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/85 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-sm shadow">
                                      EP {ep.episode}
                                    </div>
                                  </div>

                                  {/* Right side title, description snippet, date */}
                                  <div className="flex-1 min-w-0 pr-1">
                                    <h4
                                      className={`text-xs font-bold truncate leading-tight ${
                                        isPlaying ? "text-neutral-950" : "text-neutral-200 group-hover:text-purple-300"
                                      }`}
                                    >
                                      {ep.title || `Episode ${ep.episode}`}
                                    </h4>
                                    <p
                                      className={`text-[10px] line-clamp-2 mt-0.5 leading-snug ${
                                        isPlaying ? "text-neutral-800" : "text-neutral-400"
                                      }`}
                                    >
                                      {ep.description || ep.summary || "Full episode stream with multi audio & subtitles."}
                                    </p>
                                    <div
                                      className={`flex items-center gap-1.5 text-[9px] mt-1 font-medium ${
                                        isPlaying ? "text-neutral-700" : "text-neutral-500"
                                      }`}
                                    >
                                      <Tv className="w-3 h-3" />
                                      <span>{ep.releaseDate || ep.date || "Oct 2026"}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* When Expanded (isTheaterMode): Episode List Dropped Down Below Player */}
                {isTheaterMode && (
                  <div className="w-full pt-4">
                    <div className="bg-[#0e0d16]/95 border border-white/10 rounded-2xl p-4 flex flex-col shadow-xl backdrop-blur-md">
                      {/* Header bar matching user screenshot */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 select-none">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <span>Episodes</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold">
                              {currentSeasonEpisodes.length}
                            </span>
                          </h3>

                          {seriesSeasons && seriesSeasons.length > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                              {seriesSeasons.map((s: any) => (
                                <button
                                  key={s.season}
                                  onClick={() => setSelectedSeasonNumber(s.season)}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    s.season === selectedSeasonNumber
                                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.6)]"
                                      : "bg-white/5 hover:bg-white/10 text-neutral-300"
                                  }`}
                                >
                                  {s.name || `Season ${s.season}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Search Input in Expanded Mode */}
                        <div className="w-64 relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="text"
                            placeholder="Filter episodes..."
                            value={episodeFilterQuery}
                            onChange={(e) => setEpisodeFilterQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/70 transition"
                          />
                        </div>
                      </div>

                      {/* Expanded Mode Grid */}
                      <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto no-scrollbar">
                        {filteredEpisodes.map((ep: any) => {
                          const isPlaying =
                            ep.id === currentEpisodeId ||
                            ep.id === episodeData?.episodeId ||
                            (currentEpisodeId && ep.id.endsWith(currentEpisodeId)) ||
                            (currentEpisodeId && currentEpisodeId.endsWith(ep.id));

                          return (
                            <div
                              key={ep.id}
                              onClick={() => handleGoToEpisode(ep.id)}
                              className={`group flex items-center gap-3 p-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${
                                isPlaying
                                  ? "bg-[#b49cf8] text-neutral-950 font-medium shadow-[0_4px_16px_rgba(180,156,248,0.4)] ring-1 ring-purple-300"
                                  : "bg-[#12111b]/80 hover:bg-[#1a1827] text-neutral-200 border border-white/5 hover:border-purple-500/30"
                              }`}
                            >
                              <div className="relative w-28 aspect-video rounded-lg overflow-hidden shrink-0 bg-black shadow-sm">
                                <img
                                  src={ep.image || episodeData.anime?.backdrop || episodeData.anime?.image}
                                  alt={ep.title || `Episode ${ep.episode}`}
                                  className={`w-full h-full object-cover transition-transform duration-300 ${
                                    isPlaying ? "brightness-100" : "brightness-[0.88] group-hover:brightness-100 group-hover:scale-105"
                                  }`}
                                />
                                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/85 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-sm shadow">
                                  EP {ep.episode}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 pr-1">
                                <h4
                                  className={`text-xs font-bold truncate leading-tight ${
                                    isPlaying ? "text-neutral-950" : "text-neutral-200 group-hover:text-purple-300"
                                  }`}
                                >
                                  {ep.title || `Episode ${ep.episode}`}
                                </h4>
                                <p
                                  className={`text-[10px] line-clamp-1 mt-0.5 leading-snug ${
                                    isPlaying ? "text-neutral-800" : "text-neutral-400"
                                  }`}
                                >
                                  {ep.description || ep.summary || "Full episode stream."}
                                </p>
                                <div
                                  className={`flex items-center gap-1.5 text-[9px] mt-1 font-medium ${
                                    isPlaying ? "text-neutral-700" : "text-neutral-500"
                                  }`}
                                >
                                  <Tv className="w-3 h-3" />
                                  <span>{ep.releaseDate || ep.date || "Oct 2026"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Home Feed Sections Below Player & Episodes */}
                <div className="pt-10 space-y-10 border-t border-white/5">
                  {topAiringAnime.length > 0 && (
                    <AnimeSection
                      title="Currently Airing Anime"
                      items={topAiringAnime}
                      myListIds={new Set()}
                      onToggleMyList={(anime) => {
                        addToWatchlist({
                          id: anime.id,
                          title: anime.title,
                          image: anime.image,
                          type: "Series",
                          addedAt: Date.now(),
                        });
                      }}
                      onSelectAnime={(anime) => {
                        const clean = anime.id.replace(/^\/+|\/+$/g, "");
                        router.push(`/${clean}`);
                      }}
                    />
                  )}

                  {topAnimeMovies.length > 0 && (
                    <AnimeSection
                      title="Top Anime Movies"
                      items={topAnimeMovies}
                      myListIds={new Set()}
                      onToggleMyList={(anime) => {
                        addToWatchlist({
                          id: anime.id,
                          title: anime.title,
                          image: anime.image,
                          type: "Movie",
                          addedAt: Date.now(),
                        });
                      }}
                      onSelectAnime={(anime) => {
                        const clean = anime.id.replace(/^\/+|\/+$/g, "");
                        router.push(`/watch/${clean}`);
                      }}
                    />
                  )}

                  {trendingAnime.length > 0 && (
                    <AnimeSection
                      title="Most Popular Series"
                      items={trendingAnime}
                      myListIds={new Set()}
                      onToggleMyList={(anime) => {
                        addToWatchlist({
                          id: anime.id,
                          title: anime.title,
                          image: anime.image,
                          type: "Series",
                          addedAt: Date.now(),
                        });
                      }}
                      onSelectAnime={(anime) => {
                        const clean = anime.id.replace(/^\/+|\/+$/g, "");
                        router.push(`/${clean}`);
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          ) : animeData ? (
            /* ============================================================== */
            /* 2. SERIES VIEW: NO DIRECT VIDEO! SHOWS DETAILS & EPISODES      */
            /* ============================================================== */
            <>
              {/* ------------------------------------------------------------- */}
              {/* MOBILE VIEW (< md): Matches user reference Image 1           */}
              {/* ------------------------------------------------------------- */}
              <div className="block md:hidden space-y-5 select-none pb-6">
                {/* Hero Header with Banner & Poster Image */}
                <div className="relative rounded-3xl overflow-hidden bg-[#0e0d16] border border-white/10 shadow-2xl">
                  {/* Landscape Banner Artwork */}
                  <div className="relative w-full h-[280px]">
                    <img
                      src={animeData.banner || animeData.image}
                      alt={animeData.title}
                      className="w-full h-full object-cover object-[70%_center] filter brightness-[0.9] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d16] via-[#0e0d16]/60 to-transparent" />
                  </div>

                  {/* Poster Image + Metadata Stack */}
                  <div className="relative p-5 -mt-20 z-10 space-y-3.5">
                    <div className="flex items-end gap-3.5">
                      {/* Vertical Poster Image */}
                      <div
                        onClick={handleWatchNow}
                        className="w-24 h-36 rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.8)] bg-neutral-900 cursor-pointer active:scale-95 transition-all"
                        title={isMovie ? "Watch Now" : "Play Episode"}
                      >
                        <img
                          src={animeData.image || animeData.banner}
                          alt={animeData.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Header Tags & Metadata */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Tags Pill Row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[10px] tracking-wide border border-white/15">
                            HD
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 font-semibold text-[10px] border border-purple-500/30">
                            {isMovie ? "Movie" : animeData.totalSeasons ? `${animeData.totalSeasons} Seasons` : "Series"}
                          </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
                          {animeData.title}
                        </h1>

                        {/* Genres */}
                        {animeData.genres && animeData.genres.length > 0 && (
                          <p className="text-[11px] text-neutral-400 truncate">
                            {animeData.genres.slice(0, 3).join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Audio Dub Languages Badges */}
                    {animeData.languages && animeData.languages.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Audio Dubs Available
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {animeData.languages.map((lang: string) => (
                            <span
                              key={lang}
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-900/30 border border-purple-400/30 text-purple-200"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons matching Mobile Image 1: [Watch Now / Play all episodes] + [♡] */}
                    <div className="flex items-center gap-2.5 pt-2">
                      <button
                        onClick={handleWatchNow}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-[0_4px_20px_rgba(147,51,234,0.45)] active:scale-95 transition-all cursor-pointer"
                      >
                        <span>{isMovie ? "Watch Now" : "Play all episodes"}</span>
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </button>

                      <button
                        onClick={() => setIsInWatchlist(!isInWatchlist)}
                        className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                          isInWatchlist
                            ? "bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                            : "bg-white/10 text-white border-white/20"
                        }`}
                        title="Add to Watchlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isInWatchlist ? "fill-white" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {animeData.synopsis && (
                  <div className="space-y-1.5 px-1">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      About
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                      {animeData.synopsis}
                    </p>
                  </div>
                )}

                {/* Episodes Section with Season Dropdown matching Mobile Image 1 */}
                {!isMovie && animeData.seasons && animeData.seasons.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between relative">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Episodes
                      </h3>

                      {/* Season Dropdown Selector */}
                      {animeData.seasons && animeData.seasons.length > 1 ? (
                        <div className="relative">
                          <button
                            onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white cursor-pointer"
                          >
                            <span>{currentSeason?.name || `Season ${selectedSeasonNumber}`}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {isSeasonDropdownOpen && (
                            <div className="absolute right-0 mt-1.5 w-36 bg-[#161522] border border-white/15 rounded-xl shadow-2xl py-1 z-30">
                              {animeData.seasons.map((s: any) => (
                                <button
                                  key={`m-season-${s.season}`}
                                  onClick={() => {
                                    setSelectedSeasonNumber(s.season);
                                    setIsSeasonDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition ${
                                    selectedSeasonNumber === s.season
                                      ? "bg-purple-600 text-white"
                                      : "text-neutral-300 hover:bg-white/10"
                                  }`}
                                >
                                  {s.name || `Season ${s.season}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 font-medium">
                          {currentSeason?.name || "Season 1"}
                        </span>
                      )}
                    </div>

                    {/* Vertical Stack of Episodes matching Mobile Reference Image 1 */}
                    <div className="space-y-2.5">
                      {currentSeason?.episodes?.map((ep: any) => (
                        <div
                          key={ep.id}
                          onClick={() => handleGoToEpisode(ep.id)}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#12111b] border border-white/10 hover:border-purple-500/40 active:scale-[0.98] transition-all cursor-pointer"
                        >
                          {/* Thumbnail on left */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10 relative">
                            <img
                              src={ep.image || animeData.backdrop || animeData.image}
                              alt={ep.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Title, Snippet, & Duration in middle */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <h4 className="text-xs font-bold text-white truncate">
                              E{ep.episode || 1} • {ep.title.replace(/^Episode \d+:\s*/i, "")}
                            </h4>
                            <p className="text-[11px] text-neutral-400 line-clamp-1">
                              {animeData.title} Season {selectedSeasonNumber}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 pt-0.5">
                              <Clock className="w-3 h-3 text-purple-400" />
                              <span>24 min</span>
                            </div>
                          </div>

                          {/* Circular Play Button on right */}
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* More Like This Carousel */}
                {recommendations.length > 0 && (
                  <div className="pt-4">
                    <AnimeSection
                      title="More Like This"
                      items={recommendations}
                      myListIds={new Set(isInWatchlist ? [cleanId] : [])}
                      onToggleMyList={() => setIsInWatchlist(!isInWatchlist)}
                      onSelectAnime={(item) => {
                        const c = item.id.replace(/^\/+|\/+$/g, "");
                        router.push(`/${c}`);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* DESKTOP VIEW (md: and up): Keep Complete Current Layout       */}
              {/* (NO video player! Only details, both images, languages, eps)  */}
              {/* ------------------------------------------------------------- */}
              <div className="hidden md:block space-y-8 select-none">
                {/* Desktop Hero Card showing BOTH Poster and Landscape Banner */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0e0d16] shadow-2xl">
                  {/* Wide Landscape Banner Artwork */}
                  <div className="relative w-full h-[400px] lg:h-[460px]">
                    <img
                      src={animeData.banner || animeData.image}
                      alt={animeData.title}
                      className="w-full h-full object-cover object-[75%_center] filter brightness-[0.88] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-[#08080c]/85 via-45% to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0e0d16] to-transparent" />
                  </div>

                  {/* Info Overlay Content */}
                  <div className="absolute inset-0 flex items-end p-8 lg:p-12 z-10">
                    <div className="flex items-end gap-6 max-w-4xl">
                      {/* Vertical Poster Image */}
                      <div
                        onClick={handleWatchNow}
                        className="group relative w-32 lg:w-40 h-48 lg:h-56 rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-neutral-900 cursor-pointer hover:border-purple-400/60 transition-all duration-200"
                        title={isMovie ? "Watch Now" : "Play Episode"}
                      >
                        <img
                          src={animeData.image || animeData.banner}
                          alt={animeData.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {/* Media Type & Season Count */}
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-purple-600 text-white font-bold tracking-wider uppercase text-[10px] shadow-[0_0_12px_rgba(147,51,234,0.6)]">
                            {isMovie ? "Movie" : "Series"}
                          </span>

                          {animeData.totalSeasons ? (
                            <span className="px-3 py-1 rounded-full border border-purple-400/40 text-purple-200 font-semibold bg-purple-950/40 backdrop-blur-md">
                              {animeData.totalSeasons} {animeData.totalSeasons === 1 ? "Season" : "Seasons"}
                            </span>
                          ) : null}

                          {animeData.genres &&
                            animeData.genres.slice(0, 3).map((g: string) => (
                              <span
                                key={g}
                                className="px-2.5 py-0.5 rounded-full border border-white/20 text-neutral-200 text-xs font-medium bg-white/5 backdrop-blur-sm"
                              >
                                {g}
                              </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                          {animeData.title}
                        </h1>

                        {/* Audio Dub Languages Badges */}
                        {animeData.languages && animeData.languages.length > 0 && (
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="text-neutral-400 font-semibold text-[11px]">
                              Languages:
                            </span>
                            {animeData.languages.map((lang: string) => (
                              <span
                                key={lang}
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 border border-purple-400/30 text-purple-200"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Synopsis */}
                        {animeData.synopsis && (
                          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed line-clamp-3 max-w-xl font-normal drop-shadow">
                            {animeData.synopsis}
                          </p>
                        )}

                        {/* Action Buttons -> Watch Ep 1 redirects to /[episode id], Movies redirect to /watch/movies/... */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={handleWatchNow}
                            className="group relative flex items-center gap-3 pl-2 pr-6 py-2 rounded-full bg-gradient-to-b from-white/25 via-white/15 to-white/10 hover:from-white/35 hover:to-white/20 border-t border-l border-white/40 border-r border-b border-white/10 backdrop-blur-xl text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.35)] cursor-pointer"
                          >
                            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                            </div>
                            <span>
                              {isMovie
                                ? "Watch Now"
                                : firstEpisode
                                ? `Watch Ep 1 (${firstEpisode.title.replace(/^Episode \d+:\s*/i, "")})`
                                : "Watch Now"}
                            </span>
                          </button>

                          <button
                            onClick={() => setIsInWatchlist(!isInWatchlist)}
                            className={`w-11 h-11 rounded-full border-t border-l flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                              isInWatchlist
                                ? "bg-purple-600/40 border-purple-300 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.6)]"
                                : "bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                            }`}
                            title={isInWatchlist ? "Remove from List" : "Add to Watchlist"}
                          >
                            {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              alert("Link copied to clipboard!");
                            }}
                            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border-t border-l border-white/30 border-r border-b border-white/10 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                            title="Share Link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Series Seasons & Horizontal Episode Shelf (Desktop) */}
                {!isMovie && animeData.seasons && animeData.seasons.length > 0 && (
                  <div className="space-y-4 pt-4">
                    {/* Season Selector Tabs */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                        {animeData.seasons.map((s: any) => {
                          const isSelected = selectedSeasonNumber === s.season;
                          return (
                            <button
                              key={`season-${s.season}`}
                              onClick={() => setSelectedSeasonNumber(s.season)}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "bg-gradient-to-b from-purple-500/40 to-purple-800/50 border border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                  : "bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10"
                              }`}
                            >
                              {s.name || `Season ${s.season}`}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs text-neutral-400 shrink-0">
                        {currentSeason?.episodes?.length || 0} Episodes
                      </span>
                    </div>

                    {/* Horizontal Scroll of Episodes -> Click redirects to /[episode id] */}
                    {currentSeason?.episodes && (
                      <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2">
                        {currentSeason.episodes.map((ep: any) => (
                          <div
                            key={ep.id}
                            onClick={() => handleGoToEpisode(ep.id)}
                            className="group relative flex flex-col shrink-0 w-[240px] sm:w-[280px] rounded-2xl overflow-hidden bg-[#12111b] border border-white/10 hover:border-purple-500/40 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                          >
                            {/* Episode Thumbnail */}
                            <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                              <img
                                src={ep.image || animeData.backdrop || animeData.image}
                                alt={ep.title}
                                className="w-full h-full object-cover filter brightness-[0.9] group-hover:brightness-100 transition-all duration-300"
                              />

                              {/* Hover Play Icon */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                  <Play className="w-4 h-4 fill-black ml-0.5" />
                                </div>
                              </div>
                            </div>

                            {/* Episode Details */}
                            <div className="p-3">
                              <h4 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                                {ep.title}
                              </h4>
                              <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                                Season {selectedSeasonNumber} • Episode {ep.episode || 1}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* More Like This (Other Animes) */}
                {recommendations.length > 0 && (
                  <div className="pt-6">
                    <AnimeSection
                      title="More Like This"
                      items={recommendations}
                      myListIds={new Set(isInWatchlist ? [cleanId] : [])}
                      onToggleMyList={() => setIsInWatchlist(!isInWatchlist)}
                      onSelectAnime={(item) => {
                        const c = item.id.replace(/^\/+|\/+$/g, "");
                        router.push(`/${c}`);
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Not Found Screen */
            <div className="py-24 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-950/40 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <Film className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Content Not Found</h2>
              <p className="text-neutral-400 text-sm max-w-md mx-auto">
                Could not retrieve metadata for <code className="text-purple-300">{cleanId}</code>.
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          )}
        </main>

        <AZFooter />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
        }}
        myListCount={isInWatchlist ? 1 : 0}
      />
    </div>
  );
}

export default function AnimeDynamicPage(props: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm font-medium">Loading content...</p>
          </div>
        </div>
      }
    >
      <AnimeDynamicContent {...props} />
    </React.Suspense>
  );
}
