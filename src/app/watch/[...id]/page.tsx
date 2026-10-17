"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import {
  fetchMovieInfo,
  fetchStreamServers,
  resolveAbyssVideo,
  fetchPlayXStreamData,
  fetchHomeFeed,
  mapFeedCardToAnimeItem,
  ApiStreamServerItem,
} from "@/services/api";
import { AnimeVideoPlayer, VideoQualityOption } from "@/components/AnimeVideoPlayer";
import { AnimeItem } from "@/data/animeData";
import { AnimeSection } from "@/components/AnimeSection";
import {
  addToWatchHistory,
  saveWatchProgress,
  getSavedProgressForEpisode,
  getPlayerControls,
  savePlayerControls,
  addToWatchlist,
  removeFromWatchlist,
  isItemInWatchlist,
} from "@/utils/cookieStorage";
import {
  Play,
  Volume2,
  Film,
  Sparkles,
  Share2,
  Heart,
  Maximize2,
  Minimize2,
  Lightbulb,
  Plus,
  Check,
  Flag,
  ArrowLeft,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id?: string[] | string }> | { id?: string[] | string };
}

function WatchMovieContent({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params as Promise<{ id?: string[] | string }>) as
    | { id?: string[] | string }
    | undefined;
  const rawParam = resolvedParams?.id;
  const idArray = Array.isArray(rawParam) ? rawParam : [rawParam || ""];
  const rawId = idArray.filter(Boolean).join("/");
  const cleanId = decodeURIComponent(rawId).replace(/^\/+|\/+$/g, "");

  const [activeTab, setActiveTab] = useState("movies");
  const [activeNav, setActiveNav] = useState("movies");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [movieData, setMovieData] = useState<any | null>(null);

  // Player & Controls State
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

  // Zoro Utility Bar State
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isLightDimmed, setIsLightDimmed] = useState<boolean>(false);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [initialSeekTime, setInitialSeekTime] = useState<number>(0);

  // Recommendations
  const [recommendedMovies, setRecommendedMovies] = useState<AnimeItem[]>([]);

  // Load player controls and saved progress from cookies on mount
  useEffect(() => {
    const controls = getPlayerControls();
    setSelectedServerName(controls.server);
    selectedServerNameRef.current = controls.server;
    setActiveAudioMode(controls.type);
    activeAudioModeRef.current = controls.type;
    setIsTheaterMode(controls.expand);
    setIsLightDimmed(!controls.light);
    setAutoPlay(controls.autoplay);

    const saved = getSavedProgressForEpisode(cleanId);
    if (saved && saved > 0) {
      setInitialSeekTime(saved);
    }
  }, [cleanId]);

  // -------------------------------------------------------------
  // Switch / Activate Streaming Server (SORA or ABYSS in DUB or SUB mode)
  // -------------------------------------------------------------
  const activateServer = async (
    serverName: string,
    targetLangName?: string,
    mode: "dub" | "sub" = "dub",
    serversList: ApiStreamServerItem[] = availableServersRef.current
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
    const playxSrv = list.find((s: ApiStreamServerItem) => s.serverName.toLowerCase() === "playx" || s.serverName.toLowerCase() === "sora");
    const foundId =
      playxSrv?.languages?.[0]?.video_id ||
      (playxSrv as any)?.serverId ||
      currentPlayXIdRef.current ||
      movieData?.streamInfo?.playXID ||
      movieData?.playXID;

    if (foundId) {
      currentPlayXIdRef.current = foundId;
      setCurrentPlayXId(foundId);
    }

    // Always query Sora to obtain subtitles, intro, outro, and thumbnails
    let soraData: any = null;
    if (foundId) {
      try {
        soraData = await fetchPlayXStreamData(foundId);
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
        console.error("Error fetching Sora movie metadata:", err);
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

    // 2. ABYSS SERVER
    const targetServer =
      list.find((s: ApiStreamServerItem) => s.serverName.toLowerCase() === normServer) || list[0];
    if (!targetServer) return;

    const proxyBase = (process.env.NEXT_PUBLIC_ABYSS_PROXY_URL || "https://abyss-proxies-production.up.railway.app").replace(/\/+$/, "");
    const abyssLangs = (targetServer.languages || []).map((l: any) => {
      const raw = l.sourceUrl || (l as any).directUrl || l.streamUrl;
      const directUrl = (raw && raw.includes("ravok.buzz") && !raw.includes("/player/stream/proxy"))
        ? `${proxyBase}/player/stream/proxy?url=${encodeURIComponent(raw)}&videoId=${foundId || ""}`
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
          (l: any) =>
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
            (l: any) => l.language.toLowerCase() === targetLangName.toLowerCase()
          )) ||
        abyssLangs.find(
          (l: any) =>
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
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    setIsInWatchlist(isItemInWatchlist(cleanId));

    async function loadMovie() {
      try {
        const res = await fetchMovieInfo(cleanId);
        if (res && res.success && res.data && isMounted) {
          const m = res.data;
          setMovieData(m);

          try {
            saveWatchProgress({
              id: cleanId,
              episodeId: cleanId,
              animeTitle: m.title,
              episodeTitle: "Full Movie",
              image: m.banner || m.image,
              currentTime: getSavedProgressForEpisode(cleanId) || 0,
              duration: 0,
            });
          } catch {
            // ignore
          }

          let foundDirect = false;

          // 1. Check if streamId or query params exist from dub-player
          const streamInfo = m.streamInfo;
          const playXID = streamInfo?.playXID || (m as any).playXID;
          if (playXID) {
            currentPlayXIdRef.current = playXID;
            setCurrentPlayXId(playXID);
          }
          const abyssId = streamInfo?.abyssId || streamInfo?.streamId || (m as any).abyssId;
          const serversEndpoint = streamInfo?.serversEndpoint;

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

              const playxSrv = srvs.find((s) => s.serverName.toLowerCase() === "playx" || s.serverName.toLowerCase() === "sora");
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

              const defaultServer = selectedServerNameRef.current || "sora";
              const defaultMode = activeAudioModeRef.current || "dub";
              await activateServer(defaultServer, undefined, defaultMode, srvs);
              foundDirect = true;
            }
          }

          // 2. Fallback to multiAudioPlayers if servers not available
          if (!foundDirect && m.multiAudioPlayers && m.multiAudioPlayers.length > 0) {
            const langs = m.multiAudioPlayers.map((p) => {
              const videoId = p.sourceUrl
                ? p.sourceUrl.split("/").filter(Boolean).pop()
                : undefined;
              return {
                language: p.language,
                videoId,
                directUrl: p.sourceUrl,
              };
            });
            setAudioLanguages(langs);

            const primary =
              langs.find((l) => l.language.toLowerCase().includes("hin")) ||
              langs[0];

            if (primary) {
              setSelectedLanguage(primary.language);
              if (primary.videoId) {
                setIsResolvingStream(true);
                const resolved = await resolveAbyssVideo(primary.videoId);
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
                  foundDirect = true;
                }
                setIsResolvingStream(false);
              } else if (primary.directUrl) {
                setVideoQualities([{ label: "Default", url: primary.directUrl }]);
                setCurrentQuality("Default");
                foundDirect = true;
              }
            }
          }

          // 3. Fallback to iframe player if needed
          if (!foundDirect && m.players && m.players.length > 0) {
            setVideoQualities([{ label: "Default", url: m.players[0].embedUrl }]);
            setCurrentQuality("Default");
          }
        }
      } catch (err) {
        console.error("Error loading movie for watching:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMovie();

    async function loadRecs() {
      try {
        const feed = await fetchHomeFeed();
        if (feed && feed.success && feed.data?.["most-popular-movies"] && isMounted) {
          const mapped = feed.data["most-popular-movies"]
            .slice(0, 10)
            .map((item) => mapFeedCardToAnimeItem(item, "Movie"));
          setRecommendedMovies(mapped);
        }
      } catch (e) {
        // quiet ignore
      }
    }
    loadRecs();

    return () => {
      isMounted = false;
    };
  }, [cleanId]);

  const handleSelectLanguage = async (lang: {
    language: string;
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

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      {/* Light dimming blackout backdrop overlay: hides sidebar, navbar, everything */}
      {isLightDimmed && (
        <div
          onClick={() => {
            setIsLightDimmed(false);
            savePlayerControls({ light: true });
          }}
          className="fixed inset-0 z-45 bg-black transition-opacity duration-300 pointer-events-auto cursor-pointer"
          title="Click anywhere to turn lights on"
        />
      )}

      <SidebarRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
          if (tab === "browse") router.push("/movies");
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

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 pt-24 md:pt-28 lg:pt-32 pb-12">
          {/* Breadcrumb Back Link */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4 select-none">
            <Link
              href="/movies"
              className="inline-flex items-center gap-1 hover:text-purple-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Movies Catalog</span>
            </Link>
            <span>/</span>
            <span className="text-white font-medium truncate max-w-xs">
              {movieData?.title || cleanId}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="aspect-video w-full rounded-3xl bg-[#12111b] border border-white/5 flex items-center justify-center">
                <Play className="w-12 h-12 text-purple-500/40" />
              </div>
              <div className="h-10 bg-white/5 rounded-2xl w-full" />
              <div className="h-28 bg-white/5 rounded-2xl w-full" />
            </div>
          ) : movieData ? (
            <div className="space-y-4">
              {/* Native Complete Video Player or PlayX Iframe */}
              <div
                className={`relative transition-all duration-300 ${
                  isTheaterMode
                    ? "w-full max-w-none -mx-4 sm:-mx-8 z-50 shadow-2xl"
                    : "z-50"
                }`}
              >
                <AnimeVideoPlayer
                  key={`${cleanId}-${selectedServerName}-${activeAudioMode}`}
                  title={movieData.title}
                  animeTitle={movieData.title || "Movie"}
                  episodeTitle="Full Movie"
                  serverName={selectedServerName}
                  poster={movieData.banner || movieData.image}
                  qualities={videoQualities}
                  currentQuality={currentQuality}
                  onQualityChange={(newQ) => setCurrentQuality(newQ)}
                  isLoading={isResolvingStream || isLoading}
                  selectedLanguage={selectedLanguage}
                  audioLanguages={audioLanguages}
                  onSelectLanguage={handleSelectLanguage}
                  thumbnailVttUrl={playerThumbnailsUrl}
                  autoPlay={autoPlay}
                  subtitles={playerSubtitles}
                  intro={playerIntro}
                  outro={playerOutro}
                  isSubMode={activeAudioMode === "sub"}
                  initialSeekTime={initialSeekTime}
                  onProgressUpdate={(time, duration) => {
                    saveWatchProgress({
                      id: cleanId,
                      episodeId: cleanId,
                      animeTitle: movieData.title || "Movie",
                      episodeTitle: "Full Movie",
                      image: movieData.banner || movieData.image,
                      currentTime: time,
                      duration: duration,
                    });
                  }}
                />
              </div>

              {/* Utility Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-1 py-1 text-xs select-none">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <button
                    onClick={() => {
                      const next = !isTheaterMode;
                      setIsTheaterMode(next);
                      savePlayerControls({ expand: next });
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
                      const next = !autoPlay;
                      setAutoPlay(next);
                      savePlayerControls({ autoplay: next });
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
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap ml-auto">
                  <button
                    onClick={() => {
                      if (isInWatchlist) {
                        removeFromWatchlist(cleanId);
                        setIsInWatchlist(false);
                      } else {
                        addToWatchlist({
                          id: cleanId,
                          title: movieData?.title || cleanId,
                          image: movieData?.banner || movieData?.image,
                          type: "Movie",
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
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: movieData.title,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Movie link copied to clipboard!");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-medium">Share</span>
                  </button>

                  <button
                    onClick={() => alert("Report submitted. Thank you!")}
                    className="inline-flex items-center gap-1 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                </div>
              </div>

              {/* Server & Audio Selector Panel */}
              <div className="flex flex-col md:flex-row items-stretch gap-3">
                {/* Notification Card */}
                <div className="bg-gradient-to-br from-purple-950/40 via-[#12111b] to-purple-900/20 border border-purple-500/25 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-center md:w-64 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  <span className="text-[11px] text-neutral-400 font-medium">
                    You are watching
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    Feature Film
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-1.5 leading-snug">
                    Select your preferred audio language below to switch audio track instantly.
                  </p>
                </div>

                {/* Right Server / Audio Languages Card */}
                <div className="flex-1 flex flex-col justify-center gap-3 bg-[#12111b]/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
                  {/* Multilingual Notice Banner */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-semibold shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Sora Supports Multilingual feature. Click settings to toogle.</span>
                  </div>

                  {/* SUB Row: Sora & Abyss (Loads Japanese + Subtitle only) */}
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

                  {/* DUB Row: SORA & ABYSS (Rename PLAY X to SORA; language selection moved to player settings) */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 shrink-0 w-16 sm:w-20">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>DUB:</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      {/* SORA Server Button (Default) */}
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

                      {/* ABYSS Server Button */}
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

                      {/* Additional custom servers if present */}
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

              {/* Movie Details Card */}
              <div className="bg-[#12111b]/80 border border-white/10 rounded-3xl p-6 sm:p-8 mt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {movieData.image && (
                    <div className="w-32 sm:w-44 shrink-0 rounded-2xl overflow-hidden bg-black/60 shadow-xl border border-white/10 self-start">
                      <img
                        src={movieData.image}
                        alt={movieData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-600 text-white uppercase">
                        Movie
                      </span>
                      {movieData.rating && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-black">
                          ★ {movieData.rating}
                        </span>
                      )}
                      {movieData.releaseYear && (
                        <span className="text-xs text-neutral-400 font-medium">
                          {movieData.releaseYear}
                        </span>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {movieData.title}
                    </h1>

                    {movieData.genres && movieData.genres.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {movieData.genres.map((g: string) => (
                          <Link
                            key={g}
                            href={`/genre/${g.toLowerCase().trim()}`}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 text-neutral-300 hover:text-purple-300 text-xs font-medium border border-white/5 transition"
                          >
                            {g}
                          </Link>
                        ))}
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed pt-2">
                      {movieData.synopsis || "No description provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Movies */}
              {recommendedMovies.length > 0 && (
                <div className="pt-8">
                  <AnimeSection
                    title="Popular Anime Movies"
                    items={recommendedMovies}
                    myListIds={new Set(isInWatchlist ? [cleanId] : [])}
                    onToggleMyList={() => setIsInWatchlist(!isInWatchlist)}
                    onSelectAnime={(anime) => {
                      const cleanRecId = anime.id.replace(/^\/+|\/+$/g, "");
                      router.push(`/watch/${cleanRecId}`);
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center">
              <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Movie Not Found</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Unable to load this movie stream.
              </p>
              <Link
                href="/movies"
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                Browse All Movies
              </Link>
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
          if (tab === "browse") router.push("/movies");
        }}
        myListCount={0}
      />
    </div>
  );
}

export default function WatchMoviePage(props: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm font-medium">Loading player...</p>
          </div>
        </div>
      }
    >
      <WatchMovieContent {...props} />
    </React.Suspense>
  );
}
