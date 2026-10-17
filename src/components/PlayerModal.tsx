"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Bookmark,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";
import { AnimeItem, EpisodeItem } from "@/data/animeData";
import { API_BASE_URL } from "@/services/api";

interface PlayerModalProps {
  anime: AnimeItem | null;
  initialEpisode?: EpisodeItem | null;
  initialSeasonNumber?: number;
  onClose: () => void;
  isInMyList: boolean;
  onToggleMyList: (anime: AnimeItem) => void;
}

export function PlayerModal({
  anime,
  initialEpisode,
  initialSeasonNumber = 1,
  onClose,
  isInMyList,
  onToggleMyList,
}: PlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<"Hindi" | "Japanese">("Hindi");
  const [selectedServer, setSelectedServer] = useState<string>("Server 1 (High Speed)");
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p FHD");
  const [currentSeason, setCurrentSeason] = useState<number>(initialSeasonNumber);
  const [currentEpNumber, setCurrentEpNumber] = useState<number>(
    initialEpisode?.episodeNumber || 1
  );

  useEffect(() => {
    if (initialEpisode) {
      setCurrentEpNumber(initialEpisode.episodeNumber);
    }
    if (initialSeasonNumber) {
      setCurrentSeason(initialSeasonNumber);
    }
  }, [initialEpisode, initialSeasonNumber]);

  if (!anime) return null;

  // Active season data if available
  const activeSeasonData =
    anime.seasons?.find((s) => s.seasonNumber === currentSeason) || anime.seasons?.[0];

  const currentEpisodeObj =
    activeSeasonData?.episodes.find((e) => e.episodeNumber === currentEpNumber) ||
    activeSeasonData?.episodes[0];

  // Active thumbnail
  const activeThumbnail =
    currentEpisodeObj?.image || anime.backdrop || anime.image;

  // Mock list fallback if seasons not defined
  const totalEpisodes = anime.episodes || 12;
  const fallbackEpisodesList = Array.from(
    { length: Math.min(totalEpisodes, 24) },
    (_, i) => ({
      episodeNumber: i + 1,
      title: `Episode ${i + 1}`,
      duration: "24m",
      image: anime.image,
    })
  );

  const episodesToRender = activeSeasonData?.episodes || fallbackEpisodesList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0f0e16] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#14131d]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {anime.title}
            </h3>
            <span className="text-xs text-neutral-400 hidden sm:inline-block shrink-0">
              {currentEpisodeObj?.title || `Episode ${currentEpNumber}`}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-600/30 border border-purple-500/40 text-purple-300 hidden md:inline-block shrink-0">
              {selectedAudio} Dub Active
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleMyList(anime)}
              className={`p-2 rounded-full border border-white/10 hover:bg-white/10 transition cursor-pointer ${
                isInMyList ? "text-purple-400" : "text-neutral-400"
              }`}
              title="Bookmark to Watchlist"
            >
              {isInMyList ? (
                <Check className="w-4 h-4 text-purple-400" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group select-none">
          {selectedServer === "Zephyrix Stream (Proxied)" ? (
            <iframe
              src={`${API_BASE_URL}/api/v1/animeworldin/player/proxy/url=https://play.zephyrix.org/video/64c32b8eb5304d80ba093227975ece13`}
              title="Zephyrix Video Player (Proxied)"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full border-0"
            />
          ) : (
            <>
              {/* Background Poster Visual with Cinematic Lighting */}
              <img
                src={activeThumbnail}
                alt={anime.title}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isPlaying ? "brightness-95 scale-100" : "brightness-50 scale-105"
                }`}
              />

              {/* Central Play/Pause button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.7)] transform group-hover:scale-110 active:scale-95 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-1" />
                  )}
                </div>
              </button>
            </>
          )}

          {/* Top Audio / Quality Overlay Pill */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="flex bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/15 text-xs font-semibold text-white">
              <button
                onClick={() => setSelectedAudio("Hindi")}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  selectedAudio === "Hindi"
                    ? "bg-purple-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                🇮🇳 Hindi Dub
              </button>
              <button
                onClick={() => setSelectedAudio("Japanese")}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  selectedAudio === "Japanese"
                    ? "bg-purple-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                🇯🇵 Japanese
              </button>
            </div>
          </div>

          {/* Bottom Player Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/75 to-transparent">
            {/* Progress Scrubber */}
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-3 cursor-pointer group/bar">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-[38%] group-hover/bar:from-purple-400 group-hover/bar:to-indigo-400 transition-all rounded-full relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/bar:opacity-100" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-purple-400 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-purple-400 transition cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-neutral-300 font-mono text-[11px]">08:45 / 24:00</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono border border-white/10">
                  {selectedQuality}
                </span>
                <button
                  onClick={() => {
                    const video = document.querySelector(".aspect-video");
                    if (video) {
                      if (!document.fullscreenElement) {
                        video.requestFullscreen().catch(() => {});
                      } else {
                        document.exitFullscreen().catch(() => {});
                      }
                    }
                  }}
                  className="hover:text-purple-400 transition cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Controls & Episode List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Stream Source Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-neutral-300">Stream Source:</span>
              <div className="flex gap-2 flex-wrap">
                {["Server 1 (High Speed)", "Zephyrix Stream (Proxied)", "Server 3 (Anime World)"].map((srv) => (
                  <button
                    key={srv}
                    onClick={() => setSelectedServer(srv)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      selectedServer === srv
                        ? "bg-purple-600/30 border-purple-500 text-purple-200 font-medium"
                        : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Quality:</span>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="bg-[#1b1a26] border border-white/15 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none"
              >
                <option value="1080p FHD">1080p Full HD</option>
                <option value="720p HD">720p HD</option>
                <option value="480p SD">480p SD</option>
                <option value="Auto (Adaptive)">Auto (Adaptive)</option>
              </select>
            </div>
          </div>

          {/* Season Selector if available */}
          {anime.seasons && anime.seasons.length > 1 && (
            <div className="flex items-center gap-2 py-3 border-b border-white/5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-semibold text-neutral-400 shrink-0">Season:</span>
              {anime.seasons.map((s) => (
                <button
                  key={s.seasonNumber}
                  onClick={() => {
                    setCurrentSeason(s.seasonNumber);
                    setCurrentEpNumber(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    currentSeason === s.seasonNumber
                      ? "bg-purple-600 text-white font-semibold"
                      : "bg-white/5 hover:bg-white/10 text-neutral-300"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Episode Grid with Thumbnails */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Select Episode</span>
                <span className="text-xs font-normal text-purple-400">
                  (Season {currentSeason} • {episodesToRender.length} Episodes)
                </span>
              </h4>
              <span className="text-xs text-neutral-400">All episodes in Hindi Dub</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {episodesToRender.map((ep) => {
                const isCurrent = currentEpNumber === ep.episodeNumber;
                return (
                  <button
                    key={ep.episodeNumber}
                    onClick={() => setCurrentEpNumber(ep.episodeNumber)}
                    className={`group/btn relative rounded-xl border p-2 text-left transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-purple-950/40 border-purple-500 shadow-md shadow-purple-600/20"
                        : "bg-[#14131d] border-white/10 hover:border-white/20 hover:bg-[#1a1926]"
                    }`}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden relative mb-1.5 bg-black/40">
                      <img
                        src={ep.image}
                        alt={ep.title}
                        className="w-full h-full object-cover filter brightness-90 group-hover/btn:brightness-100 transition"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-purple-900/50 flex items-center justify-center">
                          <Play className="w-5 h-5 fill-white text-white" />
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-xs text-white truncate">
                      {ep.title}
                    </div>
                    <div className="text-[10px] text-neutral-400 flex items-center justify-between mt-0.5">
                      <span>{ep.duration}</span>
                      <span className="text-purple-300 font-medium">Hindi Dub</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
