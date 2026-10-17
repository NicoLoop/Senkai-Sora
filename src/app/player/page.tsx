"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  FastForward,
  Copy,
  Check,
  Code2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sliders,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Film
} from "lucide-react";
import "@videojs/react/video/compat-skin.css";
import { VideoPlayer, CompatVideoSkin, Video } from "@videojs/react/video";
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { GoogleCast } from "@videojs/react/extensions/google-cast";

interface ExtractedData {
  success: boolean;
  videoId: string;
  title: string;
  fields: {
    intro?: string;
    outro?: string;
  };
  intro: {
    start: number;
    end: number;
    duration: number;
    enabled: boolean;
  };
  outro: {
    start: number;
    end: number;
    duration: number;
    enabled: boolean;
  };
  hls: boolean;
  videoSource: string | null;
  streamProxyUrl: string | null;
  videoImage: string | null;
  tracks: Array<{
    kind: string;
    label?: string;
    language?: string;
    default?: boolean;
    originalUrl: string;
    proxyUrl?: string;
  }>;
  subtitles: Array<{
    kind: string;
    label: string;
    language: string;
    default: boolean;
    originalUrl: string;
    proxyUrl: string;
  }>;
  cryptoKey?: {
    base64Key: string;
    hexKey: string | null;
  } | null;
  rawVideoData?: any;
  rawVideoSettings?: any;
}

export default function PlayerPage() {
  const [videoId, setVideoId] = useState("b51a15f382ac914391a58850ab343b00");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"json" | "arch">("json");
  
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoSkipIntro, setAutoSkipIntro] = useState(false);
  const [autoSkipOutro, setAutoSkipOutro] = useState(false);
  const [rememberPos, setRememberPos] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "https://senkaisoraapi.vercel.app").replace(/\/$/, "");
  const PROXY_BASE = (process.env.NEXT_PUBLIC_ABYSS_PROXY_URL || "https://abyss-proxies-production.up.railway.app").replace(/\/$/, "");

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === null) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const fetchPlayerData = async (idToFetch: string, retryCount = 0) => {
    if (!idToFetch) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Direct call to proxy server (preferred for IP token binding and speed)
      let res = await fetch(`${PROXY_BASE}/player/data/${encodeURIComponent(idToFetch.trim())}`);

      // If server is busy (HTTP 503), auto-retry after 2 seconds
      if (res.status === 503 && retryCount < 3) {
        setError("Proxy stream server is buffering high queue traffic. Retrying in 2 seconds...");
        setTimeout(() => {
          fetchPlayerData(idToFetch, retryCount + 1);
        }, 2000);
        return;
      }

      // If proxy direct call had a non-503 HTTP error, fallback to API backend
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/player/data/${encodeURIComponent(idToFetch.trim())}`);
      }

      if (!res.ok) {
        throw new Error(`Stream extraction failed (HTTP ${res.status})`);
      }

      const json: ExtractedData = await res.json();
      if (!json.success) {
        throw new Error("Failed to extract video stream information");
      }
      setData(json);

      // Restore saved playback position
      if (rememberPos) {
        const saved = localStorage.getItem(`vjs_pos_${json.videoId}`);
        if (saved && Number(saved) > 3) {
          setTimeout(() => {
            if (videoElementRef.current) {
              videoElementRef.current.currentTime = Number(saved);
            }
          }, 600);
        }
      }
    } catch (err: any) {
      setError(err.message || "Extraction error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData(videoId);
  }, []);

  // Hook into video element for currentTime tracking and skip buttons
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const video = container.querySelector("video") as HTMLVideoElement | null;
      if (video && video !== videoElementRef.current) {
        videoElementRef.current = video;

        video.ontimeupdate = () => {
          const cur = video.currentTime;
          setCurrentTime(cur);
          if (video.duration) setDuration(video.duration);

          if (rememberPos && data?.videoId) {
            localStorage.setItem(`vjs_pos_${data.videoId}`, String(cur));
          }

          // Auto-Skip Intro
          if (autoSkipIntro && data?.intro?.enabled) {
            if (cur >= data.intro.start && cur < data.intro.end) {
              video.currentTime = data.intro.end;
            }
          }

          // Auto-Skip Outro
          if (autoSkipOutro && data?.outro?.enabled) {
            if (cur >= data.outro.start && cur < data.outro.end) {
              video.currentTime = data.outro.end;
            }
          }
        };
      }
    }, 400);

    return () => clearInterval(interval);
  }, [data, autoSkipIntro, autoSkipOutro, rememberPos]);

  const handleSkipIntro = () => {
    if (videoElementRef.current && data?.intro?.enabled) {
      videoElementRef.current.currentTime = data.intro.end;
    }
  };

  const handleSkipOutro = () => {
    if (videoElementRef.current && data?.outro?.enabled) {
      videoElementRef.current.currentTime = data.outro.end;
    }
  };

  const copyJsonToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showIntroButton =
    data?.intro?.enabled &&
    !autoSkipIntro &&
    currentTime >= data.intro.start &&
    currentTime < data.intro.end;

  const showOutroButton =
    data?.outro?.enabled &&
    !autoSkipOutro &&
    currentTime >= data.outro.start &&
    currentTime < data.outro.end;

  // Stream source pointing to proxy server (abyss_proxy_url)
  const finalStreamUrl = data?.streamProxyUrl
    ? (data.streamProxyUrl.startsWith("http") ? data.streamProxyUrl : `${API_BASE}${data.streamProxyUrl}`)
    : data?.videoSource || "";

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <header className="border-b border-white/5 bg-[#0b0c10]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-2">
              Video.js Player Clone
              <span className="text-[11px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                JW Replacement
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Ravok HLS stream decoder, WebVTT subtitle injector & intro/outro skip engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06]"
          >
            ← Back to Home
          </Link>
          <a
            href={`${PROXY_BASE}/player`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 flex items-center gap-1.5"
          >
            <span>Express Dev Player</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Input Card */}
        <div className="bg-[#111218] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="Enter Ravok Video ID or URL (e.g. b51a15f382ac914391a58850ab343b00)"
                className="w-full bg-[#09090d] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition"
              />
            </div>
            <button
              onClick={() => fetchPlayerData(videoId)}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Stream...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract & Play</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Buttons & Toggles */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-500">Presets:</span>
              <button
                onClick={() => {
                  setVideoId("b51a15f382ac914391a58850ab343b00");
                  fetchPlayerData("b51a15f382ac914391a58850ab343b00");
                }}
                className="text-xs font-mono bg-white/[0.04] hover:bg-cyan-500/10 hover:border-cyan-500/30 text-zinc-300 hover:text-cyan-300 border border-white/10 px-2.5 py-1 rounded-lg transition"
              >
                Demon Slayer Ep 1 (Target ID)
              </button>
              <button
                onClick={() => {
                  const url = "https://ravok.buzz/video/b51a15f382ac914391a58850ab343b00";
                  setVideoId(url);
                  fetchPlayerData(url);
                }}
                className="text-xs font-mono bg-white/[0.04] hover:bg-cyan-500/10 hover:border-cyan-500/30 text-zinc-300 hover:text-cyan-300 border border-white/10 px-2.5 py-1 rounded-lg transition"
              >
                Full Ravok URL
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 transition">
                <input
                  type="checkbox"
                  checked={autoSkipIntro}
                  onChange={(e) => setAutoSkipIntro(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer"
                />
                <span>Auto-Skip Intro</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 transition">
                <input
                  type="checkbox"
                  checked={autoSkipOutro}
                  onChange={(e) => setAutoSkipOutro(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer"
                />
                <span>Auto-Skip Outro</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 transition">
                <input
                  type="checkbox"
                  checked={rememberPos}
                  onChange={(e) => setRememberPos(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer"
                />
                <span>Save Position</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* 2-Column Section: Video Player Left, Analysis & JSON Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player & Meta */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div
              ref={containerRef}
              className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center"
            >
              {finalStreamUrl ? (
                <div className="w-full h-full relative">
                  <VideoPlayer key={finalStreamUrl}>
                    <CompatVideoSkin style={{ width: "100%", height: "100%" }}>
                      <HlsJsVideo
                        src={finalStreamUrl}
                        poster={data?.videoImage || undefined}
                        playsInline
                        autoPlay={false}
                      />
                      <GoogleCast />
                    </CompatVideoSkin>
                  </VideoPlayer>

                  {/* Skip Intro Overlay Button */}
                  {showIntroButton && (
                    <button
                      onClick={handleSkipIntro}
                      className="absolute bottom-16 right-5 z-40 bg-[#121319]/90 hover:bg-cyan-500 hover:text-black text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-cyan-500/40 shadow-xl backdrop-blur-md transition flex items-center gap-2 animate-bounce"
                    >
                      <FastForward className="w-4 h-4" />
                      <span>Skip Intro ({formatTime(data?.intro.start || 0)} - {formatTime(data?.intro.end || 0)})</span>
                    </button>
                  )}

                  {/* Skip Outro Overlay Button */}
                  {showOutroButton && (
                    <button
                      onClick={handleSkipOutro}
                      className="absolute bottom-16 right-5 z-40 bg-[#121319]/90 hover:bg-cyan-500 hover:text-black text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-cyan-500/40 shadow-xl backdrop-blur-md transition flex items-center gap-2 animate-bounce"
                    >
                      <FastForward className="w-4 h-4" />
                      <span>Skip Outro ({formatTime(data?.outro.start || 0)} - {formatTime(data?.outro.end || 0)})</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-zinc-500 text-xs font-mono">
                  {loading ? "Extracting HLS stream..." : "Enter Video ID and press Extract & Play to load Video.js player"}
                </div>
              )}
            </div>

            {/* Information Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Title:</span>
                <span className="font-semibold text-zinc-200">{data?.title || "Demon Slayer Episode 1"}</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Intro:</span>
                <span className="font-mono text-cyan-400">
                  {data?.intro.enabled ? `${formatTime(data.intro.start)} - ${formatTime(data.intro.end)}` : "None"}
                </span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Outro:</span>
                <span className="font-mono text-cyan-400">
                  {data?.outro.enabled ? `${formatTime(data.outro.start)} - ${formatTime(data.outro.end)}` : "None"}
                </span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Stream:</span>
                <span className="text-emerald-400 font-mono">HLS (m3u8 Proxied)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Data & Analysis */}
          <div className="lg:col-span-5 bg-[#111218] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("json")}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeTab === "json"
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>JSON Payload</span>
                </button>
                <button
                  onClick={() => setActiveTab("arch")}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeTab === "arch"
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Analysis & Logic</span>
                </button>
              </div>

              {activeTab === "json" && data && (
                <button
                  onClick={copyJsonToClipboard}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </button>
              )}
            </div>

            {/* Tab 1: Extracted JSON */}
            {activeTab === "json" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <pre className="flex-1 bg-[#09090d] border border-white/5 rounded-xl p-4 text-[11px] font-mono text-zinc-300 overflow-y-auto max-h-[500px] leading-relaxed selection:bg-cyan-500/30">
                  {data
                    ? JSON.stringify(data, null, 2)
                    : "// Press 'Extract & Play' to load stream and inspect extracted JSON data..."}
                </pre>
              </div>
            )}

            {/* Tab 2: Architecture & Reverse Engineering Analysis */}
            {activeTab === "arch" && (
              <div className="flex-1 overflow-y-auto max-h-[500px] text-xs text-zinc-300 space-y-4 pr-1 leading-relaxed font-sans">
                <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    1. HTML & Dean Edwards Packer Unpacking
                  </h4>
                  <p className="text-zinc-400">
                    When requesting <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">https://ravok.buzz/video/[videoId]</code>,
                    the response contains an obfuscated Dean Edwards script: <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">eval(function(p,a,c,k,e,d)...)</code>.
                    Our decoder extracts the payload, radix base, count, and dictionary keywords, reconstructing the clean <code className="text-zinc-200 font-mono">vload()</code> invocation.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    2. videoSettings & Intro/Outro Skip Timestamps
                  </h4>
                  <p className="text-zinc-400">
                    The unpacked script exposes the <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">videoSettings</code> object:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400 font-mono text-[11px]">
                    <li><strong className="text-zinc-200">fields.intro</strong>: e.g. &quot;0-0&quot; or start-end seconds</li>
                    <li><strong className="text-zinc-200">fields.outro</strong>: e.g. &quot;1272-1420&quot; seconds</li>
                    <li><strong className="text-zinc-200">tracks</strong>: Subtitle &amp; preview storyboard WebVTT tracks</li>
                    <li><strong className="text-zinc-200">ck</strong>: AES decryption key for non-HLS streams</li>
                  </ul>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    3. Stream Resolution & CORS Bypass
                  </h4>
                  <p className="text-zinc-400">
                    The player sends an AJAX POST to <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">/player/index.php?data=[videoId]&amp;do=getVideo</code>.
                    Because ravok.buzz omits CORS headers on its HLS manifests, direct browser requests fail.
                    Our proxy endpoint <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">/api/player/stream/proxy</code> relays the master playlist,
                    rewriting relative audio and video chunks to enable smooth cross-origin streaming in Video.js.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    4. Disguised Subtitle Conversion
                  </h4>
                  <p className="text-zinc-400">
                    The subtitle URLs end in <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">.jpg</code> to bypass ad-blockers and scrapers, but actually contain standard SRT text.
                    Our converter endpoint <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">/api/player/subtitle/proxy</code> formats the timestamps and prepends the standard <code className="text-zinc-200 font-mono">WEBVTT</code> header for Video.js caption rendering.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
