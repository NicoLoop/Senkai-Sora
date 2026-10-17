"use client";

import React, { useState, useEffect } from "react";
import "@videojs/react/video/compat-skin.css";
import { VideoPlayer, CompatVideoSkin, Video } from "@videojs/react/video";
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { GoogleCast } from "@videojs/react/extensions/google-cast";

export interface VideoJsPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  playsInline?: boolean;
  onEnded?: () => void;
  style?: React.CSSProperties;
}

export function VideoJsPlayer({
  src,
  poster,
  autoPlay = false,
  playsInline = true,
  onEnded,
  style = { width: "100%", aspectRatio: "16 / 9" },
}: VideoJsPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        style={style}
        className="w-full bg-black/90 flex items-center justify-center text-neutral-400"
      >
        <span className="text-xs">Loading Video.js 10 Player...</span>
      </div>
    );
  }

  const isHls =
    src.includes(".m3u8") ||
    src.includes("m3u8") ||
    src.includes("/hls/") ||
    src.includes("/stream/proxy");

  return (
    <VideoPlayer key={src}>
      <CompatVideoSkin style={style}>
        {isHls ? (
          <HlsJsVideo
            src={src}
            poster={poster}
            playsInline={playsInline}
            autoPlay={autoPlay}
            onEnded={onEnded}
          />
        ) : (
          <Video
            src={src}
            poster={poster}
            playsInline={playsInline}
            autoPlay={autoPlay}
            onEnded={onEnded}
          />
        )}
        <GoogleCast />
      </CompatVideoSkin>
    </VideoPlayer>
  );
}
