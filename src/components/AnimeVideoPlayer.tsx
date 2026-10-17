"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "@videojs/react/video/compat-skin.css";
import { VideoPlayer, CompatVideoSkin, Video } from "@videojs/react/video";
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { GoogleCast } from "@videojs/react/extensions/google-cast";
import { usePlayerContext } from "@videojs/react";
import { MediaTracksMixin } from "@videojs/media/media-tracks";
import { ABYSS_PROXY_URL } from "@/services/api";
import { savePlayerControls, getPlayerControls } from "@/utils/cookieStorage";
import {
  Play,
  Pause,
  Tv,
  PictureInPicture2,
  Cast,
  Repeat,
  Copy,
  Info,
  X,
  SkipForward,
} from "lucide-react";

// Polyfill HTMLVideoElement with MediaTracksMixin in browser
if (typeof window !== "undefined" && (window as any).HTMLVideoElement) {
  try {
    MediaTracksMixin((window as any).HTMLVideoElement);
  } catch (_) {}
}

export interface ThumbnailCue {
  start: number;
  end: number;
  imgUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function parseVttThumbnails(vttText: string, baseVttUrl: string): ThumbnailCue[] {
  const baseUrl = baseVttUrl.substring(0, baseVttUrl.lastIndexOf("/") + 1);
  const cues: ThumbnailCue[] = [];
  const lines = vttText.split(/\r?\n/);
  let currentStart = 0;
  let currentEnd = 0;

  function parseTimestamp(ts: string): number {
    const parts = ts.trim().split(":");
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->");
      currentStart = parseTimestamp(startStr);
      currentEnd = parseTimestamp(endStr);
    } else if (line.includes("#xywh=")) {
      const [imgPart, coords] = line.split("#xywh=");
      const [x, y, w, h] = coords.split(",").map(Number);
      const fullImgUrl = imgPart.startsWith("http") ? imgPart : baseUrl + imgPart;
      cues.push({ start: currentStart, end: currentEnd, imgUrl: fullImgUrl, x, y, w, h });
    }
  }
  return cues;
}

export interface SoraM3u8AudioTrack {
  id: number;
  name: string;
  language: string;
  groupId?: string;
  uri?: string;
  default?: boolean;
  autoselect?: boolean;
}

export function parseM3u8AudioTracks(m3u8Text: string): SoraM3u8AudioTrack[] {
  const tracks: SoraM3u8AudioTrack[] = [];
  const lines = m3u8Text.split(/\r?\n/);
  let id = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#EXT-X-MEDIA") && trimmed.includes("TYPE=AUDIO")) {
      const nameMatch = trimmed.match(/NAME="([^"]+)"/i);
      const langMatch = trimmed.match(/LANGUAGE="([^"]+)"/i);
      const groupMatch = trimmed.match(/GROUP-ID="([^"]+)"/i);
      const uriMatch = trimmed.match(/URI="([^"]+)"/i);
      const defMatch = trimmed.match(/DEFAULT=(YES|NO)/i);
      const autoMatch = trimmed.match(/AUTOSELECT=(YES|NO)/i);

      const name = nameMatch ? nameMatch[1] : `Audio ${id + 1}`;
      const language = langMatch ? langMatch[1] : "";
      const isDefault = defMatch ? defMatch[1].toUpperCase() === "YES" : false;
      const isAuto = autoMatch ? autoMatch[1].toUpperCase() === "YES" : false;

      if (!tracks.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
        tracks.push({
          id,
          name,
          language,
          groupId: groupMatch ? groupMatch[1] : undefined,
          uri: uriMatch ? uriMatch[1] : undefined,
          default: isDefault,
          autoselect: isAuto,
        });
        id++;
      }
    }
  }

  return tracks;
}

export interface VideoQualityOption {
  label: string; // e.g. "1080p", "720p", "360p"
  url: string;   // Full streaming URL with ?token=...
}

function parseHeightFromLabel(label: string): number {
  const match = label.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  if (label.toLowerCase().includes("default")) return 1080;
  return 720;
}

interface VideoQualityManagerProps {
  qualities: VideoQualityOption[];
  currentQuality: string;
  onQualityChange: (newQuality: string) => void;
}

/**
 * Connects available streaming qualities with Video.js 10's native player store and renditions.
 * Enables the built-in Video.js settings popup to discover and display Quality alongside Speed.
 */
function VideoQualityManager({
  qualities,
  currentQuality,
  onQualityChange,
}: VideoQualityManagerProps) {
  const playerCtx = usePlayerContext();

  useEffect(() => {
    if (!playerCtx?.registerExtension) return;

    const items: Array<{ id: string; label: string; height: number; width: number; selected: boolean; active: boolean }> = [];
    
    if (qualities && qualities.length > 0) {
      qualities.forEach((q) => {
        const height = parseHeightFromLabel(q.label);
        const width = Math.round((height * 16) / 9);
        const isSel = q.label.toLowerCase() === currentQuality.toLowerCase();
        items.push({
          id: q.label,
          label: q.label,
          height,
          width,
          selected: isSel,
          active: isSel,
        });
      });
    }

    // Video.js QualityRadioGroup requires > 1 item to be available.
    // If only 1 quality or less is provided, provide standard quality fallbacks (1080p, 720p, 480p, 360p).
    if (items.length <= 1) {
      const standards = [
        { label: "1080p", height: 1080, width: 1920 },
        { label: "720p", height: 720, width: 1280 },
        { label: "480p", height: 480, width: 854 },
        { label: "360p", height: 360, width: 640 },
      ];
      standards.forEach((std) => {
        if (!items.some((it) => it.label.toLowerCase() === std.label.toLowerCase())) {
          const isSel = std.label.toLowerCase() === currentQuality.toLowerCase();
          items.push({
            id: std.label,
            label: std.label,
            height: std.height,
            width: std.width,
            selected: isSel,
            active: isSel,
          });
        }
      });
    }

    if (!items.some((it) => it.selected) && items.length > 0) {
      items[0].selected = true;
      items[0].active = true;
    }

    class CustomQualityRenditionList extends EventTarget {
      _items: any[];
      onSelect: (label: string) => void;

      constructor(initItems: any[], onSelect: (label: string) => void) {
        super();
        this._items = initItems;
        this.onSelect = onSelect;
        this._items.forEach((item, idx) => {
          Object.defineProperty(this, idx, {
            value: item,
            configurable: true,
            enumerable: true,
            writable: true,
          });
        });
      }

      get length() {
        return this._items.length;
      }

      [Symbol.iterator]() {
        return this._items.values();
      }

      get selectedIndex() {
        return this._items.findIndex((r) => r.selected);
      }

      set selectedIndex(idx: number) {
        this._items.forEach((r, i) => {
          r.selected = i === idx;
          r.active = i === idx;
        });
        this.dispatchEvent(new Event("change"));
        if (this.onSelect) {
          const selected = idx >= 0 ? this._items[idx] : null;
          this.onSelect(selected ? (selected.label || selected.id) : "Auto");
        }
      }

      getRenditionById(id: string) {
        return this._items.find((r) => r.id === id) || null;
      }
    }

    class VideoQualityExtension {
      list: CustomQualityRenditionList;
      constructor() {
        this.list = new CustomQualityRenditionList(items, (newQual) => {
          onQualityChange(newQual);
        });
      }

      get mediaOverride() {
        return {
          videoRenditions: this.list,
        };
      }

      attach({ media }: { media: any }) {
        if (media) {
          try {
            if (!media.videoRenditions) {
              media.videoRenditions = this.list;
            }
          } catch (_) {}
        }
      }
    }

    const unregister = playerCtx.registerExtension(new VideoQualityExtension());
    return () => {
      unregister?.();
    };
  }, [playerCtx, qualities, currentQuality, onQualityChange]);

  return null;
}

export interface AnimeVideoSubtitle {
  kind?: string;
  label?: string;
  language?: string;
  src?: string;
  proxyUrl?: string;
  default?: boolean;
}

export interface AnimeVideoIntro {
  start: number;
  end: number;
  duration?: number;
  enabled?: boolean;
}

export interface AnimeVideoPlayerProps {
  title?: string;
  episodeTitle?: string;
  animeTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  serverName?: string;
  poster?: string;
  qualities: VideoQualityOption[];
  currentQuality: string;
  onQualityChange: (newQuality: string) => void;
  isLoading?: boolean;
  selectedLanguage?: string;
  audioLanguages?: Array<{
    language: string;
    code?: string;
    short?: string;
    videoId?: string;
    directUrl?: string;
  }>;
  onSelectLanguage?: (lang: any) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  subtitles?: AnimeVideoSubtitle[];
  intro?: AnimeVideoIntro;
  outro?: AnimeVideoIntro;
  autoSkipIntro?: boolean;
  thumbnailVttUrl?: string;
  isSubMode?: boolean;
  initialSeekTime?: number;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

export function AnimeVideoPlayer({
  title = "Anime Stream",
  episodeTitle,
  animeTitle,
  seasonNumber,
  episodeNumber,
  serverName = "sora",
  poster,
  qualities,
  currentQuality,
  onQualityChange,
  isLoading = false,
  selectedLanguage,
  audioLanguages = [],
  onSelectLanguage,
  onEnded,
  autoPlay = false,
  subtitles = [],
  intro,
  outro,
  autoSkipIntro = false,
  thumbnailVttUrl,
  isSubMode = false,
  initialSeekTime,
  onProgressUpdate,
}: AnimeVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsAdapterRef = useRef<any>(null);
  const initialSeekDoneRef = useRef<boolean>(false);
  const lastProgressSavedRef = useRef<number>(0);

  // Sora m3u8 audio track state
  const [soraAudioTracks, setSoraAudioTracks] = useState<SoraM3u8AudioTrack[]>([]);
  const [activeSoraAudioTrack, setActiveSoraAudioTrack] = useState<string>("");

  // Active subtitle state
  const [activeSubtitle, setActiveSubtitle] = useState<string>("English");

  useEffect(() => {
    const controls = getPlayerControls();
    const isSubOn = controls.sub !== "off";

    if (subtitles && subtitles.length > 0) {
      if (!isSubOn) {
        setActiveSubtitle("Off");
      } else {
        const def = subtitles.find((s) => s.default) || subtitles[0];
        setActiveSubtitle(def.label || def.language || "English");
      }
    } else {
      setActiveSubtitle("Off");
    }
  }, [subtitles]);


  // Thumbnail preview cues and hover state
  const thumbnailCuesRef = useRef<ThumbnailCue[]>([]);
  const [thumbnailCues, setThumbnailCues] = useState<ThumbnailCue[]>([]);
  const [hoverPreview, setHoverPreview] = useState<{
    visible: boolean;
    x: number;
    time: number;
    cue: ThumbnailCue | null;
  }>({ visible: false, x: 0, time: 0, cue: null });

  // Fetch and parse WebVTT thumbnail sprite sheet
  useEffect(() => {
    if (!thumbnailVttUrl) {
      thumbnailCuesRef.current = [];
      setThumbnailCues([]);
      return;
    }

    let isCurrent = true;
    const cleanVtt = thumbnailVttUrl.trim();
    const proxyUrl = cleanVtt.includes("/player/subtitle/proxy")
      ? cleanVtt
      : `${ABYSS_PROXY_URL.replace(/\/+$/, "")}/player/subtitle/proxy?url=${encodeURIComponent(cleanVtt)}`;

    fetch(proxyUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (isCurrent) {
          const cues = parseVttThumbnails(text, cleanVtt);
          thumbnailCuesRef.current = cues;
          setThumbnailCues(cues);
        }
      })
      .catch((err) => {
        console.warn("[AnimeVideoPlayer] Error loading thumbnail VTT:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [thumbnailVttUrl]);

  // Floating skip intro & outro state
  const [showSkipIntro, setShowSkipIntro] = useState<boolean>(false);
  const [showSkipOutro, setShowSkipOutro] = useState<boolean>(false);

  const handleSkipIntroClick = useCallback(() => {
    const v = containerRef.current?.querySelector("video");
    if (v && intro && intro.end) {
      v.currentTime = Number(intro.end);
      setShowSkipIntro(false);
    }
  }, [intro]);

  const handleSkipOutroClick = useCallback(() => {
    const v = containerRef.current?.querySelector("video");
    if (v && outro && outro.end) {
      v.currentTime = Number(outro.end);
      setShowSkipOutro(false);
    }
  }, [outro]);

  // Synchronized state for right-click menu & stats
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const c = getPlayerControls();
      return typeof c.volumeNumber === "number" ? c.volumeNumber : 1;
    } catch {
      return 1;
    }
  });
  const lastSavedVolumeRef = useRef<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isPipActive, setIsPipActive] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [droppedFrames, setDroppedFrames] = useState<number>(0);

  // Seekbar hover preview mouse listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sliderSelector =
      "media-time-slider, .media-time-slider, .video-controls-slider-row, .vjs-progress-control, .vjs-progress-holder, [part~='time-slider']";

    const handleSliderMove = (e: MouseEvent) => {
      const slider = container.querySelector(sliderSelector) as HTMLElement | null;
      if (!slider) return;

      const rect = slider.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const v = container.querySelector("video");
      const totalDuration = v?.duration || duration || 0;
      if (totalDuration <= 0) return;

      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const hoverTime = percent * totalDuration;

      const cues = thumbnailCuesRef.current;
      const matchedCue = cues.find((c) => c.start <= hoverTime && hoverTime < c.end) || null;
      const mouseX = e.clientX - containerRect.left;

      setHoverPreview({
        visible: true,
        x: mouseX,
        time: hoverTime,
        cue: matchedCue,
      });
    };

    const handleSliderLeave = () => {
      setHoverPreview((prev) => ({ ...prev, visible: false }));
    };

    const bindEvents = () => {
      const sliders = container.querySelectorAll(sliderSelector);
      sliders.forEach((slider) => {
        slider.removeEventListener("mousemove", handleSliderMove as any);
        slider.removeEventListener("mouseleave", handleSliderLeave as any);
        slider.addEventListener("mousemove", handleSliderMove as any);
        slider.addEventListener("mouseleave", handleSliderLeave as any);
      });
    };

    bindEvents();
    const interval = setInterval(bindEvents, 1000);

    return () => {
      clearInterval(interval);
      const sliders = container.querySelectorAll(sliderSelector);
      sliders.forEach((slider) => {
        slider.removeEventListener("mousemove", handleSliderMove as any);
        slider.removeEventListener("mouseleave", handleSliderLeave as any);
      });
    };
  }, [duration, thumbnailCues]);

  // --------------------------------------------------------------------------
  // Progress bar purple line for Intro and Outro segments (matches track height)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderMarkers = () => {
      const track = (container.querySelector(".media-time-slider-track") ||
        container.querySelector("[part~='time-slider-track']")) as HTMLElement | null;
      if (!track) return;

      const v = container.querySelector("video");
      const totalDur = v?.duration || duration;
      if (!totalDur || totalDur <= 0) return;

      // Clear previous markers
      track.querySelectorAll(".custom-timeline-marker").forEach((el) => el.remove());

      // 1. Intro purple marker
      if (intro && Number(intro.start) < Number(intro.end) && intro.enabled !== false) {
        const s = Number(intro.start);
        const e = Math.min(totalDur, Number(intro.end));
        const left = (s / totalDur) * 100;
        const width = ((e - s) / totalDur) * 100;

        const introMarker = document.createElement("div");
        introMarker.className = "custom-timeline-marker custom-timeline-intro";
        introMarker.title = `Intro: ${formatTime(s)} - ${formatTime(e)}`;
        introMarker.style.cssText = `
          position: absolute;
          left: ${left}%;
          width: ${width}%;
          height: 100%;
          top: 0;
          bottom: 0;
          background: #a855f7;
          box-shadow: none;
          z-index: 1;
          pointer-events: none;
          border-radius: 0;
        `;
        track.appendChild(introMarker);
      }

      // 2. Outro purple marker
      if (outro && Number(outro.start) < Number(outro.end) && outro.enabled !== false) {
        const s = Number(outro.start);
        const e = Math.min(totalDur, Number(outro.end));
        const left = (s / totalDur) * 100;
        const width = ((e - s) / totalDur) * 100;

        const outroMarker = document.createElement("div");
        outroMarker.className = "custom-timeline-marker custom-timeline-outro";
        outroMarker.title = `Outro: ${formatTime(s)} - ${formatTime(e)}`;
        outroMarker.style.cssText = `
          position: absolute;
          left: ${left}%;
          width: ${width}%;
          height: 100%;
          top: 0;
          bottom: 0;
          background: #a855f7;
          box-shadow: none;
          z-index: 1;
          pointer-events: none;
          border-radius: 0;
        `;
        track.appendChild(outroMarker);
      }
    };

    renderMarkers();
    const interval = setInterval(renderMarkers, 1000);
    return () => clearInterval(interval);
  }, [duration, intro, outro]);

  // Preserve playback time when switching stream qualities
  const playbackTimeRestoreRef = useRef<number>(0);

  // Right-click custom context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Stats for Nerds HUD overlay
  const [showStatsForNerds, setShowStatsForNerds] = useState<boolean>(false);

  // Copy toast feedback
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Active stream resolution
  const activeQualityObj =
    qualities.find((q) => q.label.toLowerCase() === currentQuality.toLowerCase()) ||
    qualities[0] ||
    null;
  const activeStreamUrl = activeQualityObj ? activeQualityObj.url : "";
  const isHls =
    activeStreamUrl.includes(".m3u8") ||
    activeStreamUrl.includes("m3u8") ||
    activeStreamUrl.includes("/hls/") ||
    activeStreamUrl.includes("/stream/proxy");

  // Synchronize subtitle track state to video element
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const v = container.querySelector("video");
    if (!v || !v.textTracks) return;

    for (let i = 0; i < v.textTracks.length; i++) {
      const track = v.textTracks[i];
      if (activeSubtitle === "Off") {
        track.mode = "disabled";
      } else if (
        track.label?.toLowerCase() === activeSubtitle.toLowerCase() ||
        track.language?.toLowerCase() === activeSubtitle.toLowerCase()
      ) {
        track.mode = "showing";
      } else {
        track.mode = "disabled";
      }
    }
  }, [activeSubtitle, subtitles, activeStreamUrl]);

  // Computed lines for top-left watermark
  const { watermarkLine1, watermarkLine2 } = useMemo(() => {
    const rawAnime = (animeTitle || "Senkai Sora").trim();
    const rawEp = (episodeTitle || title || "").trim();

    // Determine Season & Episode numbers
    let sNum = seasonNumber;
    let epNum = episodeNumber;

    if (!sNum || !epNum) {
      const sxMatch = rawEp.match(/(\d+)x(\d+)/i);
      if (sxMatch) {
        if (!sNum) sNum = parseInt(sxMatch[1], 10);
        if (!epNum) epNum = parseInt(sxMatch[2], 10);
      } else {
        const sMatch = rawEp.match(/season\s*(\d+)/i);
        const eMatch = rawEp.match(/episode\s*(\d+)/i);
        if (sMatch && !sNum) sNum = parseInt(sMatch[1], 10);
        if (eMatch && !epNum) epNum = parseInt(eMatch[1], 10);
      }
    }

    let line1 = rawAnime;
    if (sNum && epNum) {
      line1 = `${rawAnime} • Season ${sNum} Episode ${epNum}`;
    } else if (epNum) {
      line1 = `${rawAnime} • Episode ${epNum}`;
    } else {
      line1 = `${rawAnime} • Movie`;
    }

    // Line 2: The actual episode name (e.g. "The Akatsuki Makes Its Move")
    let line2 = rawEp;
    if (
      !line2 ||
      line2.toLowerCase() === `season ${sNum} episode ${epNum}`.toLowerCase() ||
      line2.toLowerCase() === `${sNum}x${epNum}`.toLowerCase() ||
      line2.toLowerCase() === `episode ${epNum}`.toLowerCase()
    ) {
      line2 = title && title !== rawEp ? title : (epNum ? `Episode ${epNum}` : "Full Video");
    }

    // Remove repeated anime prefix from line2 if any
    if (line2.toLowerCase().startsWith(rawAnime.toLowerCase())) {
      const rest = line2.slice(rawAnime.length).replace(/^[\s•:.-]+/, "").trim();
      if (rest) line2 = rest;
    }

    return { watermarkLine1: line1, watermarkLine2: line2 };
  }, [animeTitle, episodeTitle, title, seasonNumber, episodeNumber]);

  // Fetch and parse audio tracks from Sora's HLS m3u8 playlist
  useEffect(() => {
    if (serverName.toLowerCase() !== "sora" || !activeStreamUrl) {
      setSoraAudioTracks([]);
      return;
    }

    let isCurrent = true;
    fetch(activeStreamUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!isCurrent) return;
        const tracks = parseM3u8AudioTracks(text);
        if (tracks.length > 0) {
          setSoraAudioTracks(tracks);
          // Check saved player controls from cookies or default
          const savedControls = getPlayerControls();
          const targetLang = (savedControls.dub || savedControls.language)?.toLowerCase();
          const isDubMode = savedControls.type !== "sub";

          let matched = null;
          if (isDubMode && targetLang) {
            matched = tracks.find(
              (t) =>
                t.name.toLowerCase().includes(targetLang) ||
                (t.language && t.language.toLowerCase().includes(targetLang))
            );
          } else if (!isDubMode) {
            matched = tracks.find(
              (t) =>
                t.name.toLowerCase().includes("japan") ||
                (t.language && t.language.toLowerCase().includes("ja"))
            );
          }
          const defaultTrack = matched || tracks.find((t) => t.default) || tracks[0];
          if (defaultTrack) {
            setActiveSoraAudioTrack(defaultTrack.name);
          }
        }
      })
      .catch((err) => {
        console.warn("[AnimeVideoPlayer] Error parsing Sora audio tracks from m3u8:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeStreamUrl, serverName]);

  // Sync audio tracks with Hls.js engine if available
  useEffect(() => {
    const engine = hlsAdapterRef.current?.engine;
    if (!engine) return;

    const syncTracks = () => {
      if (engine.audioTracks && engine.audioTracks.length > 0) {
        const hlsTracks: SoraM3u8AudioTrack[] = engine.audioTracks.map((tr: any, idx: number) => ({
          id: idx,
          name: tr.name || tr.lang || `Track ${idx + 1}`,
          language: tr.lang || "",
          default: tr.default || false,
        }));
        setSoraAudioTracks((prev) => (prev.length > 0 ? prev : hlsTracks));

        const currIdx = engine.audioTrack;
        if (currIdx >= 0 && engine.audioTracks[currIdx]) {
          const active = engine.audioTracks[currIdx].name || engine.audioTracks[currIdx].lang;
          if (active) setActiveSoraAudioTrack(active);
        }
      }
    };

    syncTracks();

    try {
      engine.on("hlsAudioTracksUpdated", syncTracks);
      engine.on("hlsAudioTrackSwitched", syncTracks);
    } catch (_) {}

    return () => {
      try {
        engine.off("hlsAudioTracksUpdated", syncTracks);
        engine.off("hlsAudioTrackSwitched", syncTracks);
      } catch (_) {}
    };
  }, [activeStreamUrl, hlsAdapterRef.current?.engine]);

  // Synchronize Hls.js quality level when currentQuality changes
  useEffect(() => {
    const engine = hlsAdapterRef.current?.engine;
    if (!engine || !engine.levels || engine.levels.length === 0) return;

    if (currentQuality.toLowerCase() === "auto") {
      engine.currentLevel = -1;
      return;
    }

    const targetHeight = parseInt(currentQuality.replace(/[^\d]/g, ""), 10);
    if (!isNaN(targetHeight)) {
      const idx = engine.levels.findIndex((lvl: any) => lvl.height === targetHeight);
      if (idx !== -1) {
        engine.currentLevel = idx;
      }
    }
  }, [currentQuality, hlsAdapterRef.current?.engine]);

  // Switch Sora Audio Track without changing servers
  const handleSwitchSoraAudio = useCallback((trackName: string) => {
    setActiveSoraAudioTrack(trackName);
    try {
      const lower = trackName.toLowerCase();
      const isJp = lower.includes("japan") || lower.includes("original");
      savePlayerControls({
        language: trackName,
        dub: isJp ? undefined : trackName,
        type: isJp ? "sub" : "dub",
      });
    } catch (_) {}

    // 1. Switch in Hls.js engine
    const engine = hlsAdapterRef.current?.engine;
    if (engine && engine.audioTracks && engine.audioTracks.length > 0) {
      const idx = engine.audioTracks.findIndex(
        (t: any) =>
          (t.name && t.name.toLowerCase() === trackName.toLowerCase()) ||
          (t.lang && t.lang.toLowerCase() === trackName.toLowerCase())
      );
      if (idx !== -1) {
        engine.audioTrack = idx;
        return;
      }
    }

    // 2. Switch HTMLMediaElement audioTracks
    const v = containerRef.current?.querySelector("video") as any;
    if (v && v.audioTracks && v.audioTracks.length > 0) {
      for (let i = 0; i < v.audioTracks.length; i++) {
        const tr = v.audioTracks[i];
        const match =
          (tr.label && tr.label.toLowerCase() === trackName.toLowerCase()) ||
          (tr.language && tr.language.toLowerCase() === trackName.toLowerCase());
        tr.enabled = match;
      }
    }
  }, []);

  // --------------------------------------------------------------------------
  // Restore playback position seamlessly when active stream URL changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const v = container.querySelector("video");
    if (!v) return;

    const restoreTime = () => {
      // 1. Restore volume from cookies
      try {
        const savedControls = getPlayerControls();
        const initialVol = typeof savedControls.volumeNumber === "number" ? savedControls.volumeNumber : 1;
        v.volume = initialVol;
        setVolume(initialVol);
        lastSavedVolumeRef.current = initialVol;
        if (initialVol === 0) v.muted = true;
      } catch (_) {}

      // 2. Restore playback position
      const targetTime =
        playbackTimeRestoreRef.current > 0
          ? playbackTimeRestoreRef.current
          : !initialSeekDoneRef.current && initialSeekTime && initialSeekTime > 0
          ? initialSeekTime
          : 0;

      if (targetTime > 0) {
        try {
          v.currentTime = targetTime;
          playbackTimeRestoreRef.current = targetTime;
          initialSeekDoneRef.current = true;
        } catch (_) {}
      }
    };

    v.addEventListener("loadedmetadata", restoreTime, { once: true });
    v.addEventListener("canplay", restoreTime, { once: true });

    return () => {
      v.removeEventListener("loadedmetadata", restoreTime);
      v.removeEventListener("canplay", restoreTime);
    };
  }, [activeStreamUrl, initialSeekTime]);

  // --------------------------------------------------------------------------
  // Synchronize state with underlying Video.js HTML5 video element
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncVideo = () => {
      const v = container.querySelector("video");
      if (!v) return;

      // Handle initial seek on first play or ready
      if (!initialSeekDoneRef.current && initialSeekTime && initialSeekTime > 0 && v.duration) {
        initialSeekDoneRef.current = true;
        try {
          v.currentTime = initialSeekTime;
          playbackTimeRestoreRef.current = initialSeekTime;
        } catch (_) {}
      }

      setIsPlaying(!v.paused);
      setCurrentTime(v.currentTime || 0);
      setDuration(v.duration || 0);
      setVolume(v.volume ?? 1);
      setIsMuted(Boolean(v.muted));
      setIsLooping(Boolean(v.loop));
      if (v.playbackRate) setPlaybackSpeed(v.playbackRate);

      if (v.currentTime > 0) {
        playbackTimeRestoreRef.current = v.currentTime;
      }

      // Save watch progress every 5 seconds while playing
      if (!v.paused && v.currentTime > 0) {
        if (Math.abs(v.currentTime - lastProgressSavedRef.current) >= 5) {
          lastProgressSavedRef.current = v.currentTime;
          onProgressUpdate?.(v.currentTime, v.duration || 0);
        }
      }

      if (v.videoWidth && v.videoHeight) {
        setVideoDimensions({ width: v.videoWidth, height: v.videoHeight });
      }

      if (v.buffered && v.buffered.length > 0 && v.duration) {
        const end = v.buffered.end(v.buffered.length - 1);
        setBufferedPercent((end / v.duration) * 100);
      }

      if ((v as any).getVideoPlaybackQuality) {
        const q = (v as any).getVideoPlaybackQuality();
        setDroppedFrames(q.droppedVideoFrames || 0);
      }

      // Check Intro range
      const t = v.currentTime || 0;
      if (intro && Number(intro.start) < Number(intro.end) && intro.enabled !== false) {
        const s = Number(intro.start);
        const e = Number(intro.end);
        if (t >= s && t < e) {
          if (autoSkipIntro) {
            v.currentTime = e;
            setShowSkipIntro(false);
          } else {
            setShowSkipIntro(true);
          }
        } else {
          setShowSkipIntro(false);
        }
      } else {
        setShowSkipIntro(false);
      }

      // Check Outro range
      if (outro && Number(outro.start) < Number(outro.end) && outro.enabled !== false) {
        const s = Number(outro.start);
        const e = Number(outro.end);
        if (t >= s && t < e) {
          setShowSkipOutro(true);
        } else {
          setShowSkipOutro(false);
        }
      } else {
        setShowSkipOutro(false);
      }
    };

    const handleVolumeChange = () => {
      const v = container.querySelector("video");
      if (!v) return;
      const currVol = v.muted ? 0 : (v.volume ?? 1);
      setVolume(currVol);
      setIsMuted(Boolean(v.muted));
      if (Math.abs(currVol - lastSavedVolumeRef.current) > 0.01) {
        lastSavedVolumeRef.current = currVol;
        savePlayerControls({
          vol: `${Math.round(currVol * 100)}%`,
          volumeNumber: currVol,
        });
      }
    };

    const vEl = container.querySelector("video");
    if (vEl) {
      vEl.addEventListener("volumechange", handleVolumeChange);
    }

    const interval = setInterval(syncVideo, 500);

    const handlePipChange = () => {
      setIsPipActive(Boolean(document.pictureInPictureElement));
    };

    document.addEventListener("enterpictureinpicture", handlePipChange);
    document.addEventListener("leavepictureinpicture", handlePipChange);

    return () => {
      clearInterval(interval);
      if (vEl) {
        vEl.removeEventListener("volumechange", handleVolumeChange);
      }
      document.removeEventListener("enterpictureinpicture", handlePipChange);
      document.removeEventListener("leavepictureinpicture", handlePipChange);
    };
  }, [activeStreamUrl, intro, outro, autoSkipIntro]);

  // --------------------------------------------------------------------------
  // Synchronize Quality in Video.js Settings Popup (Gear Icon Menu)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rawOptions: string[] = [];
    if (qualities && qualities.length > 0) {
      qualities.forEach((q) => {
        if (!rawOptions.includes(q.label)) rawOptions.push(q.label);
      });
    }

    const standardQualities = ["1080p", "720p", "480p", "360p"];
    standardQualities.forEach((sq) => {
      if (!rawOptions.some((ro) => ro.toLowerCase() === sq.toLowerCase())) {
        rawOptions.push(sq);
      }
    });

    const activeQuality = currentQuality || rawOptions[0] || "1080p";

    const syncSettingsMenu = () => {
      const popup = container.querySelector(".media-menu-popup") as HTMLElement | null;
      if (!popup) return;

      const menuContent = popup.querySelector(".media-menu-content") as HTMLElement | null;
      if (!menuContent) return;

      // If a submenu is currently open, do not re-render or overwrite
      const isSubmenuOpen = Boolean(menuContent.querySelector(".media-menu-back-item"));
      if (isSubmenuOpen) return;

      // 1. QUALITY ITEM
      const nativeItems = Array.from(menuContent.querySelectorAll(".media-menu-item"));

      // Hide all duplicate native Video.js Audio and Captions triggers
      nativeItems.forEach((el) => {
        if (
          el.classList.contains("custom-vjs-quality-trigger") ||
          el.classList.contains("custom-vjs-audio-trigger") ||
          el.classList.contains("custom-vjs-subtitles-trigger") ||
          el.classList.contains("media-menu-back-item")
        ) {
          return;
        }
        const text = (el.textContent || "").trim().toLowerCase();
        if (text.startsWith("audio") || text.includes("audio")) {
          (el as HTMLElement).style.display = "none";
          el.setAttribute("hidden", "true");
        }
        if (text.startsWith("caption") || text.includes("caption")) {
          (el as HTMLElement).style.display = "none";
          el.setAttribute("hidden", "true");
        }
      });

      const nativeQualityTrigger = nativeItems.find((el) => {
        const text = el.textContent || "";
        return text.includes("Quality") || text.includes("quality");
      }) as HTMLElement | null;

      if (nativeQualityTrigger) {
        if (nativeQualityTrigger.hasAttribute("hidden")) {
          nativeQualityTrigger.removeAttribute("hidden");
        }
        nativeQualityTrigger.style.display = "flex";
        const hintLabel = nativeQualityTrigger.querySelector(".media-menu-hint-label");
        if (hintLabel && hintLabel.textContent !== activeQuality) {
          hintLabel.textContent = activeQuality;
        }
      } else {
        let customTrigger = menuContent.querySelector(".custom-vjs-quality-trigger") as HTMLElement | null;
        if (!customTrigger) {
          customTrigger = document.createElement("div");
          customTrigger.className = "media-menu-item custom-vjs-quality-trigger";
          customTrigger.setAttribute("role", "menuitem");
          customTrigger.setAttribute("tabindex", "0");
          customTrigger.setAttribute("data-has-submenu", "");
          customTrigger.style.cursor = "pointer";

          customTrigger.innerHTML = `
            <svg class="media-menu-trigger-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            <span>Quality</span>
            <span class="media-menu-hint">
              <span class="media-menu-hint-label">${activeQuality}</span>
              <svg class="media-menu-forward-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          `;

          customTrigger.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            renderQualitySubmenu(menuContent);
          };

          menuContent.prepend(customTrigger);
        } else {
          const hintLabel = customTrigger.querySelector(".media-menu-hint-label");
          if (hintLabel && hintLabel.textContent !== activeQuality) {
            hintLabel.textContent = activeQuality;
          }
        }
      }

      // 2. AUDIO TRACK ITEM
      const isSoraServer = serverName.toLowerCase() === "sora";
      const currentAudioLang = isSubMode
        ? "Japanese"
        : isSoraServer
        ? activeSoraAudioTrack || selectedLanguage || "Default"
        : selectedLanguage || (audioLanguages?.[0]?.language) || "Default";
      let audioTrigger = menuContent.querySelector(".custom-vjs-audio-trigger") as HTMLElement | null;
      if (!audioTrigger) {
        audioTrigger = document.createElement("div");
        audioTrigger.className = "media-menu-item custom-vjs-audio-trigger";
        audioTrigger.setAttribute("role", "menuitem");
        audioTrigger.setAttribute("tabindex", "0");
        audioTrigger.setAttribute("data-has-submenu", "");
        audioTrigger.style.cursor = "pointer";

        audioTrigger.innerHTML = `
          <svg class="media-menu-trigger-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
          <span>Audio</span>
          <span class="media-menu-hint">
            <span class="media-menu-hint-label">${currentAudioLang}</span>
            <svg class="media-menu-forward-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        `;

        audioTrigger.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          renderAudioSubmenu(menuContent);
        };

        const qualItem = menuContent.querySelector(".custom-vjs-quality-trigger, .media-menu-item");
        if (qualItem && qualItem.nextSibling) {
          menuContent.insertBefore(audioTrigger, qualItem.nextSibling);
        } else {
          menuContent.appendChild(audioTrigger);
        }
      } else {
        const hintLabel = audioTrigger.querySelector(".media-menu-hint-label");
        if (hintLabel && hintLabel.textContent !== currentAudioLang) {
          hintLabel.textContent = currentAudioLang;
        }
      }

      // 3. SUBTITLES ITEM
      const currentSubTitle = activeSubtitle || (subtitles && subtitles.length > 0 ? (subtitles[0].label || "English") : "Off");
      let subTrigger = menuContent.querySelector(".custom-vjs-subtitles-trigger") as HTMLElement | null;
      if (!subTrigger) {
        subTrigger = document.createElement("div");
        subTrigger.className = "media-menu-item custom-vjs-subtitles-trigger";
        subTrigger.setAttribute("role", "menuitem");
        subTrigger.setAttribute("tabindex", "0");
        subTrigger.setAttribute("data-has-submenu", "");
        subTrigger.style.cursor = "pointer";

        subTrigger.innerHTML = `
          <svg class="media-menu-trigger-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="M7 15h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H7v6Z"></path>
            <path d="M15 15h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2v6Z"></path>
          </svg>
          <span>Subtitles</span>
          <span class="media-menu-hint">
            <span class="media-menu-hint-label">${currentSubTitle}</span>
            <svg class="media-menu-forward-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        `;

        subTrigger.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          renderSubtitlesSubmenu(menuContent);
        };

        if (audioTrigger && audioTrigger.nextSibling) {
          menuContent.insertBefore(subTrigger, audioTrigger.nextSibling);
        } else {
          menuContent.appendChild(subTrigger);
        }
      } else {
        const hintLabel = subTrigger.querySelector(".media-menu-hint-label");
        if (hintLabel && hintLabel.textContent !== currentSubTitle) {
          hintLabel.textContent = currentSubTitle;
        }
      }
    };

    const renderQualitySubmenu = (contentEl: HTMLElement) => {
      const previousChildren = Array.from(contentEl.children);
      previousChildren.forEach((child) => ((child as HTMLElement).style.display = "none"));

      const submenuContainer = document.createElement("div");
      submenuContainer.className = "custom-quality-submenu-wrapper";

      const backBtn = document.createElement("div");
      backBtn.className = "media-menu-item media-menu-back-item";
      backBtn.setAttribute("role", "menuitem");
      backBtn.setAttribute("tabindex", "0");
      backBtn.style.cursor = "pointer";
      backBtn.innerHTML = `
        <svg class="media-menu-back-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Quality</span>
      `;

      const restoreMainMenu = () => {
        submenuContainer.remove();
        previousChildren.forEach((child) => ((child as HTMLElement).style.display = ""));
      };

      backBtn.onclick = (e) => {
        e.stopPropagation();
        restoreMainMenu();
      };

      const separator = document.createElement("div");
      separator.className = "media-menu-separator";
      separator.setAttribute("role", "separator");

      const radioGroup = document.createElement("div");
      radioGroup.className = "media-menu-radio-group";
      radioGroup.setAttribute("role", "radiogroup");

      const allDisplayOptions = ["Auto", ...rawOptions];

      allDisplayOptions.forEach((opt) => {
        const item = document.createElement("div");
        const isChecked =
          opt.toLowerCase() === activeQuality.toLowerCase() ||
          (opt === "Auto" && activeQuality === "Auto");

        item.className = "media-menu-item media-menu-radio-item";
        item.setAttribute("role", "menuitemradio");
        item.setAttribute("aria-checked", isChecked ? "true" : "false");
        item.setAttribute("tabindex", "0");
        item.style.cursor = "pointer";

        const hasHd = opt.includes("1080");

        item.innerHTML = `
          <span>
            ${opt}
            ${hasHd ? '<sup class="media-menu-tier">HD</sup>' : ''}
          </span>
          ${
            isChecked
              ? `
            <span class="media-menu-indicator">
              <svg class="media-menu-radio-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          `
              : ""
          }
        `;

        item.onclick = (e) => {
          e.stopPropagation();
          const v = container.querySelector("video");
          if (v && v.currentTime > 0) {
            playbackTimeRestoreRef.current = v.currentTime;
          }

          onQualityChange(opt);
          restoreMainMenu();
        };

        radioGroup.appendChild(item);
      });

      submenuContainer.appendChild(backBtn);
      submenuContainer.appendChild(separator);
      submenuContainer.appendChild(radioGroup);
      contentEl.appendChild(submenuContainer);
    };

    const renderAudioSubmenu = (contentEl: HTMLElement) => {
      const previousChildren = Array.from(contentEl.children);
      previousChildren.forEach((child) => ((child as HTMLElement).style.display = "none"));

      const submenuContainer = document.createElement("div");
      submenuContainer.className = "custom-audio-submenu-wrapper";

      const backBtn = document.createElement("div");
      backBtn.className = "media-menu-item media-menu-back-item";
      backBtn.setAttribute("role", "menuitem");
      backBtn.setAttribute("tabindex", "0");
      backBtn.style.cursor = "pointer";
      backBtn.innerHTML = `
        <svg class="media-menu-back-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Audio</span>
      `;

      const restoreMainMenu = () => {
        submenuContainer.remove();
        previousChildren.forEach((child) => ((child as HTMLElement).style.display = ""));
      };

      backBtn.onclick = (e) => {
        e.stopPropagation();
        restoreMainMenu();
      };

      const separator = document.createElement("div");
      separator.className = "media-menu-separator";
      separator.setAttribute("role", "separator");

      const radioGroup = document.createElement("div");
      radioGroup.className = "media-menu-radio-group";
      radioGroup.setAttribute("role", "radiogroup");

      const isSoraServer = serverName.toLowerCase() === "sora";
      let availableOptions: Array<{ label: string; rawItem: any; isChecked: boolean }> = [];

      if (isSubMode) {
        availableOptions = [
          {
            label: "Japanese (Original)",
            rawItem: { language: "Japanese (Original)" },
            isChecked: true,
          },
        ];
      } else if (isSoraServer) {
        // Sora Server: audio options from m3u8 playlist tracks
        if (soraAudioTracks && soraAudioTracks.length > 0) {
          availableOptions = soraAudioTracks.map((t) => ({
            label: t.name,
            rawItem: t,
            isChecked:
              activeSoraAudioTrack.toLowerCase() === t.name.toLowerCase() ||
              (Boolean(t.language) && activeSoraAudioTrack.toLowerCase().includes(t.language.toLowerCase())),
          }));
        } else {
          const fallbackTracks = ["Multi", "Japanese", "English", "Hindi"];
          availableOptions = fallbackTracks.map((lang) => ({
            label: lang,
            rawItem: { name: lang, language: lang },
            isChecked: activeSoraAudioTrack.toLowerCase() === lang.toLowerCase(),
          }));
        }
      } else {
        // Abyss Server: audio options from API audioLanguages
        if (audioLanguages && audioLanguages.length > 0) {
          availableOptions = audioLanguages.map((langItem) => ({
            label: langItem.language,
            rawItem: langItem,
            isChecked:
              (selectedLanguage || "").toLowerCase().includes(langItem.language.toLowerCase()) ||
              langItem.language.toLowerCase() === (selectedLanguage || "").toLowerCase(),
          }));
        } else {
          const fallbackTracks = ["Default", "Japanese", "English", "Hindi"];
          availableOptions = fallbackTracks.map((lang) => ({
            label: lang,
            rawItem: { language: lang },
            isChecked: (selectedLanguage || "").toLowerCase() === lang.toLowerCase(),
          }));
        }
      }

      availableOptions.forEach((opt) => {
        const item = document.createElement("div");
        item.className = "media-menu-item media-menu-radio-item";
        item.setAttribute("role", "menuitemradio");
        item.setAttribute("aria-checked", opt.isChecked ? "true" : "false");
        item.setAttribute("tabindex", "0");
        item.style.cursor = "pointer";

        item.innerHTML = `
          <span>${opt.label}</span>
          ${
            opt.isChecked
              ? `
            <span class="media-menu-indicator">
              <svg class="media-menu-radio-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          `
              : ""
          }
        `;

        item.onclick = (e) => {
          e.stopPropagation();
          const v = container.querySelector("video");
          if (v && v.currentTime > 0) {
            playbackTimeRestoreRef.current = v.currentTime;
          }

          if (isSoraServer) {
            // Sora server: switch HLS track directly. NEVER switch servers!
            handleSwitchSoraAudio(opt.label);
          } else {
            // Abyss server: switch audio via API without switching server!
            if (onSelectLanguage) {
              onSelectLanguage(opt.rawItem);
            }
          }
          restoreMainMenu();
        };

        radioGroup.appendChild(item);
      });

      submenuContainer.appendChild(backBtn);
      submenuContainer.appendChild(separator);
      submenuContainer.appendChild(radioGroup);
      contentEl.appendChild(submenuContainer);
    };

    const renderSubtitlesSubmenu = (contentEl: HTMLElement) => {
      const previousChildren = Array.from(contentEl.children);
      previousChildren.forEach((child) => ((child as HTMLElement).style.display = "none"));

      const submenuContainer = document.createElement("div");
      submenuContainer.className = "custom-subtitles-submenu-wrapper";

      const backBtn = document.createElement("div");
      backBtn.className = "media-menu-item media-menu-back-item";
      backBtn.setAttribute("role", "menuitem");
      backBtn.setAttribute("tabindex", "0");
      backBtn.style.cursor = "pointer";
      backBtn.innerHTML = `
        <svg class="media-menu-back-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Subtitles</span>
      `;

      const restoreMainMenu = () => {
        submenuContainer.remove();
        previousChildren.forEach((child) => ((child as HTMLElement).style.display = ""));
      };

      backBtn.onclick = (e) => {
        e.stopPropagation();
        restoreMainMenu();
      };

      const separator = document.createElement("div");
      separator.className = "media-menu-separator";
      separator.setAttribute("role", "separator");

      const radioGroup = document.createElement("div");
      radioGroup.className = "media-menu-radio-group";
      radioGroup.setAttribute("role", "radiogroup");

      const options = ["Off", ...(subtitles || []).map((s) => s.label || s.language || "English")];

      options.forEach((opt) => {
        const item = document.createElement("div");
        const isChecked =
          activeSubtitle.toLowerCase() === opt.toLowerCase() ||
          (opt === "Off" && activeSubtitle === "Off");

        item.className = "media-menu-item media-menu-radio-item";
        item.setAttribute("role", "menuitemradio");
        item.setAttribute("aria-checked", isChecked ? "true" : "false");
        item.setAttribute("tabindex", "0");
        item.style.cursor = "pointer";

        item.innerHTML = `
          <span>${opt}</span>
          ${
            isChecked
              ? `
            <span class="media-menu-indicator">
              <svg class="media-menu-radio-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          `
              : ""
          }
        `;

        item.onclick = (e) => {
          e.stopPropagation();
          setActiveSubtitle(opt);
          try {
            savePlayerControls({ sub: opt === "Off" ? "off" : "on" });
          } catch (_) {}
          const v = container.querySelector("video");
          if (v && v.textTracks) {
            for (let i = 0; i < v.textTracks.length; i++) {
              const track = v.textTracks[i];
              if (opt === "Off") {
                track.mode = "disabled";
              } else if (
                track.label.toLowerCase() === opt.toLowerCase() ||
                track.language.toLowerCase() === opt.toLowerCase()
              ) {
                track.mode = "showing";
              } else {
                track.mode = "disabled";
              }
            }
          }
          restoreMainMenu();
        };

        radioGroup.appendChild(item);
      });

      submenuContainer.appendChild(backBtn);
      submenuContainer.appendChild(separator);
      submenuContainer.appendChild(radioGroup);
      contentEl.appendChild(submenuContainer);
    };

    const interval = setInterval(syncSettingsMenu, 250);
    return () => clearInterval(interval);
  }, [
    qualities,
    currentQuality,
    onQualityChange,
    serverName,
    soraAudioTracks,
    activeSoraAudioTrack,
    handleSwitchSoraAudio,
    audioLanguages,
    selectedLanguage,
    onSelectLanguage,
    subtitles,
    activeSubtitle,
    isSubMode,
  ]);


  // --------------------------------------------------------------------------
  // Actions for Context Menu: Play, PIP, Cast, Loop, Copy
  // --------------------------------------------------------------------------
  const togglePlay = useCallback(() => {
    const v = containerRef.current?.querySelector("video");
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTogglePip = useCallback(async () => {
    try {
      const v = containerRef.current?.querySelector("video");
      if (!v) return;

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.warn("PIP Error:", err);
    }
  }, []);

  const handleCast = useCallback(() => {
    const v = containerRef.current?.querySelector("video");
    if (v && (v as any).remote?.prompt) {
      (v as any).remote.prompt().catch(() => {});
    } else if ((window as any).chrome?.cast && (window as any).cast?.framework) {
      (window as any).cast.framework.CastContext.getInstance().requestSession();
    } else {
      // Trigger default Video.js Cast button
      const defaultCastBtn = containerRef.current?.querySelector(".media-cast-button button, .media-cast-button") as HTMLElement | null;
      if (defaultCastBtn) {
        defaultCastBtn.click();
      } else {
        alert("Video.js Google Cast is scanning for available devices on your network.");
      }
    }
  }, []);

  const handleToggleLoop = () => {
    const v = containerRef.current?.querySelector("video");
    if (v) {
      v.loop = !v.loop;
      setIsLooping(v.loop);
    }
  };

  const handleCopyUrl = () => {
    if (activeStreamUrl) {
      navigator.clipboard.writeText(activeStreamUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // --------------------------------------------------------------------------
  // Right-Click Custom Context Menu
  // --------------------------------------------------------------------------
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 310;
    const x = Math.max(8, Math.min(rect.width - menuWidth - 8, e.clientX - rect.left));
    const y = Math.max(8, Math.min(rect.height - menuHeight - 8, e.clientY - rect.top));

    setContextMenu({ visible: true, x, y });
  };

  // Dismiss context menu on outside click or Escape
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "Escape") {
        setContextMenu((prev) => ({ ...prev, visible: false }));
        setShowStatsForNerds(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu.visible]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black select-none shadow-[0_12px_45px_rgba(0,0,0,0.85)] border border-white/15 group"
    >
      {/* ====================================================================== */}
      {/* 1. DEFAULT VIDEO.JS 10 PLAYER (With built-in Cast, PiP, Settings, etc.) */}
      {/* ====================================================================== */}
      <div className="w-full h-full relative flex items-center justify-center bg-black">
        {activeStreamUrl ? (
          <VideoPlayer key={activeStreamUrl}>
            <VideoQualityManager
              qualities={qualities}
              currentQuality={currentQuality}
              onQualityChange={onQualityChange}
            />
            <CompatVideoSkin style={{ width: "100%", height: "100%", aspectRatio: "16 / 9" }}>
              {isHls ? (
                <HlsJsVideo
                  mediaRef={hlsAdapterRef}
                  src={activeStreamUrl}
                  poster={poster}
                  playsInline
                  autoPlay={autoPlay}
                  onEnded={onEnded}
                  crossOrigin="anonymous"
                >
                  {subtitles &&
                    subtitles.map((sub, idx) => (
                      <track
                        key={sub.proxyUrl || sub.src || idx}
                        kind={(sub.kind as any) || "captions"}
                        label={sub.label || "English"}
                        srcLang={sub.language || "en"}
                        src={sub.proxyUrl || sub.src}
                        default={sub.default}
                      />
                    ))}
                </HlsJsVideo>
              ) : (
                <Video
                  src={activeStreamUrl}
                  poster={poster}
                  playsInline
                  autoPlay={autoPlay}
                  onEnded={onEnded}
                  crossOrigin="anonymous"
                >
                  {subtitles &&
                    subtitles.map((sub, idx) => (
                      <track
                        key={sub.proxyUrl || sub.src || idx}
                        kind={(sub.kind as any) || "captions"}
                        label={sub.label || "English"}
                        srcLang={sub.language || "en"}
                        src={sub.proxyUrl || sub.src}
                        default={sub.default}
                      />
                    ))}
                </Video>
              )}
              <GoogleCast />
            </CompatVideoSkin>
          </VideoPlayer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 space-y-3 bg-[#08080d]">
            <Tv className="w-12 h-12 text-purple-400 animate-pulse" />
            <p className="text-sm font-semibold tracking-wide text-neutral-200">
              {isLoading ? "Resolving Stream with API Key..." : "Preparing Video.js 10 Player..."}
            </p>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* 2. TOP-LEFT CORNER: SORA ICON + NOW PLAYING + TITLE                    */}
      {/* ====================================================================== */}
      <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-20 flex items-center gap-2.5 pointer-events-none select-none max-w-[80%] sm:max-w-md">
        {/* Senkai Sora S Logo (Matching Sidebar) */}
        <div
          title="Senkai Sora"
          className="w-8 h-8 rounded-xl bg-gradient-to-b from-purple-500/50 via-purple-700/60 to-indigo-900/80 p-[1.5px] border-t border-l border-white/40 border-r border-b border-black/50 shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center shrink-0"
        >
          <div className="w-full h-full bg-[#0d0c14] rounded-[calc(0.75rem-1.5px)] flex items-center justify-center shadow-inner">
            <span className="text-sm font-black bg-gradient-to-br from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tighter">
              S
            </span>
          </div>
        </div>

        {/* Watermark short text:
            Line 1: Naruto Shippuden • Season 1 Episode 2
            Line 2: The Akatsuki Makes Its Move
        */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-bold text-neutral-300 tracking-wide truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {watermarkLine1}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            {watermarkLine2}
          </span>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 2.5 FLOATING SKIP INTRO & SKIP OUTRO BUTTONS                           */}
      {/* ====================================================================== */}
      {showSkipIntro && (
        <button
          onClick={handleSkipIntroClick}
          className="absolute bottom-16 right-4 sm:right-6 z-30 px-4 py-2 rounded-xl bg-purple-600/95 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(147,51,234,0.7)] backdrop-blur-md border border-purple-400/40 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in"
        >
          <span>Skip Intro</span>
          <SkipForward className="w-4 h-4 fill-white" />
        </button>
      )}

      {showSkipOutro && (
        <button
          onClick={handleSkipOutroClick}
          className="absolute bottom-16 right-4 sm:right-6 z-30 px-4 py-2 rounded-xl bg-purple-600/95 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(147,51,234,0.7)] backdrop-blur-md border border-purple-400/40 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in"
        >
          <span>Skip Outro</span>
          <SkipForward className="w-4 h-4 fill-white" />
        </button>
      )}

      {/* ====================================================================== */}
      {/* 2.6 PROGRESS BAR HOVER PREVIEW THUMBNAIL (From Sora WebVTT Sprite)   */}
      {/* ====================================================================== */}
      {hoverPreview.visible && (
        <div
          style={{
            left: `${Math.max(
              (hoverPreview.cue ? hoverPreview.cue.w : 140) / 2 + 10,
              Math.min(
                (containerRef.current?.clientWidth || 800) - ((hoverPreview.cue ? hoverPreview.cue.w : 140) / 2 + 10),
                hoverPreview.x
              )
            )}px`,
            bottom: "52px",
            width: `${hoverPreview.cue ? hoverPreview.cue.w : 140}px`,
          }}
          className="absolute z-40 -translate-x-1/2 pointer-events-none flex flex-col items-center select-none shadow-[0_8px_30px_rgba(0,0,0,0.95)] animate-in fade-in duration-100"
        >
          {/* Frame image from sprite */}
          {hoverPreview.cue && (
            <div
              style={{
                width: `${hoverPreview.cue.w}px`,
                height: `${hoverPreview.cue.h}px`,
                backgroundImage: `url(${hoverPreview.cue.imgUrl})`,
                backgroundPosition: `-${hoverPreview.cue.x}px -${hoverPreview.cue.y}px`,
                backgroundRepeat: "no-repeat",
              }}
              className="rounded-t border-t border-l border-r border-neutral-700 bg-black overflow-hidden shadow-sm"
            />
          )}
          {/* Time stamp pill directly beneath image */}
          <div className="w-full bg-white text-black font-extrabold text-[11px] py-0.5 px-2 text-center leading-tight shadow-md tracking-wider">
            {formatTime(hoverPreview.time)}
          </div>
          {/* Downward triangle pointer pointing at the seekbar */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white -mt-[0.5px]" />
        </div>
      )}

      {/* Strict CSS overrides: Ensure progress bar markers match exact track height and hide native text preview */}
      <style jsx global>{`
        .media-time-slider-preview {
          display: none !important;
        }
        .media-time-slider-track {
          overflow: hidden !important;
        }
        .custom-timeline-marker {
          position: absolute !important;
          top: 0 !important;
          bottom: 0 !important;
          height: 100% !important;
          max-height: 100% !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          z-index: 1 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* ====================================================================== */}
      {/* 3. CUSTOM RIGHT-CLICK CONTEXT MENU (MINIMAL BLACK & WHITE)            */}
      {/* ====================================================================== */}
      {contextMenu.visible && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="absolute z-50 w-56 rounded-2xl bg-[#0c0c0e]/95 border border-white/10 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] overflow-hidden text-xs py-1.5 select-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-3.5 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 font-semibold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Senkai Sora Player
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">Video.js 10</span>
          </div>

          <div className="p-1 space-y-0.5">
            {/* Play / Pause */}
            <button
              onClick={() => {
                togglePlay();
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-neutral-400" /> : <Play className="w-3.5 h-3.5 text-neutral-400" />}
                {isPlaying ? "Pause" : "Play"}
              </span>
              <kbd className="text-[10px] text-neutral-400 bg-white/5 px-1.5 py-0.2 rounded font-mono">Space</kbd>
            </button>

            {/* Picture in Picture */}
            <button
              onClick={() => {
                handleTogglePip();
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <PictureInPicture2 className="w-3.5 h-3.5 text-neutral-400" />
                Picture in Picture
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">{isPipActive ? "Active" : "PiP"}</span>
            </button>

            {/* Cast Screen */}
            <button
              onClick={() => {
                handleCast();
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Cast className="w-3.5 h-3.5 text-neutral-400" />
                Cast to Display
              </span>
            </button>

            {/* Loop Video */}
            <button
              onClick={() => {
                handleToggleLoop();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Repeat className="w-3.5 h-3.5 text-neutral-400" />
                Loop Video
              </span>
              <span className={`text-[10px] font-mono ${isLooping ? "text-white font-bold" : "text-neutral-500"}`}>
                {isLooping ? "On" : "Off"}
              </span>
            </button>

            <div className="border-t border-white/10 my-1" />

            {/* Copy Video Stream URL */}
            <button
              onClick={handleCopyUrl}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                {copyFeedback ? "Copied!" : "Copy Stream URL"}
              </span>
            </button>

            {/* Stats for Nerds Toggle */}
            <button
              onClick={() => {
                setShowStatsForNerds((prev) => !prev);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                {showStatsForNerds ? "Hide Stats for Nerds" : "Stats for Nerds"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 4. STATS FOR NERDS HUD OVERLAY (MINIMAL BLACK & WHITE)                  */}
      {/* ====================================================================== */}
      {showStatsForNerds && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 left-4 z-40 bg-[#0c0c0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 font-mono text-[11px] text-neutral-300 space-y-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-w-sm select-none"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="font-bold text-white flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-neutral-400" /> Stats for Nerds
            </span>
            <button
              onClick={() => setShowStatsForNerds(false)}
              className="text-neutral-400 hover:text-white transition cursor-pointer p-0.5 rounded hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">Player Engine:</span>
              <span className="text-white font-medium">Video.js 10.1 (CompatSkin)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Format:</span>
              <span className="text-white font-medium">{isHls ? "HLS (.m3u8)" : "MP4 / Direct"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Selected Quality:</span>
              <span className="text-white font-medium">{currentQuality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Dimensions:</span>
              <span className="text-white font-medium">
                {videoDimensions.width ? `${videoDimensions.width}x${videoDimensions.height}` : "Loading"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Time / Duration:</span>
              <span className="text-white font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Buffer Progress:</span>
              <span className="text-white font-medium">{bufferedPercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Playback Speed:</span>
              <span className="text-white font-medium">{playbackSpeed}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Volume:</span>
              <span className="text-white font-medium">
                {Math.round(volume * 100)}% {isMuted ? "(Muted)" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Audio Track:</span>
              <span className="text-white font-medium">{selectedLanguage || "Default"}</span>
            </div>
            {droppedFrames > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-400">Dropped Frames:</span>
                <span className="text-white font-medium">{droppedFrames}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
