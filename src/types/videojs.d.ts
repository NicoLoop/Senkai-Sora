declare module "@videojs/react" {
  export const usePlayerContext: () => any;
  export const useExtensionRegistrar: () => any;
  export const useMedia: () => any;
  export const useContainer: () => any;
  export const usePlayer: (selector?: any) => any;
  export const VideoPlayer: import("react").ComponentType<any>;
  export const Menu: any;
  export const QualityRadioGroup: any;
  export const PlaybackRateRadioGroup: any;
  const content: any;
  export default content;
}

declare module "@videojs/media/media-tracks" {
  export const MediaTracksMixin: (target: any) => any;
  export const VideoRendition: any;
  export const VideoRenditionList: any;
  export const VideoTrack: any;
  export const VideoTrackList: any;
}

declare module "@videojs/media/*" {
  const content: any;
  export default content;
}

declare module "@videojs/react/video" {
  export const VideoPlayer: import("react").ComponentType<any>;
  export const CompatVideoSkin: import("react").ComponentType<any>;
  export const VideoSkin: import("react").ComponentType<any>;
  export const NeutralVideoSkin: import("react").ComponentType<any>;
  export const ScaffoldVideoSkin: import("react").ComponentType<any>;
  export const Video: import("react").ComponentType<any>;
  export const usePlayer: () => any;
  export const videoFeatures: any;
}

declare module "@videojs/react/media/hlsjs-video" {
  export const HlsJsVideo: import("react").ComponentType<any>;
}

declare module "@videojs/react/extensions/google-cast" {
  export const GoogleCast: import("react").ComponentType<any>;
}

declare module "@videojs/react/*" {
  const content: any;
  export default content;
}

