import { AnimeItem, SeasonInfo, EpisodeItem } from "@/data/animeData";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.api_base_url ||
  "https://senkaisoraapi.vercel.app"
).replace(/\/$/, "");

export const ABYSS_PROXY_URL =
  process.env.NEXT_PUBLIC_ABYSS_PROXY_URL ||
  process.env.abyss_proxy_url ||
  "https://abyss-proxies-production.up.railway.app/";

export const ABYSS_AUTH_TOKEN =
  process.env.NEXT_PUBLIC_ABYSS_AUTH_TOKEN ||
  process.env.ABYSS_AUTH_TOKEN ||
  "9c86dda4c5a4f2a5a30823e6d4dc7ce0";

export interface ApiSpotlightItem {
  id: string;
  title: string;
  banner?: string;
  image?: string;
  synopsis?: string;
  rating?: string;
  genres?: string[];
  season?: string;
  languages?: string[];
}

export interface ApiFeedCardItem {
  id: string;
  title: string;
  image?: string;
  season?: string;
  episode?: string;
  rating?: string;
}

export interface ApiHomeFeedResponse {
  success: boolean;
  cached?: boolean;
  data: {
    spotlight?: ApiSpotlightItem[];
    franchise?: Array<{ name: string; slug: string; id: string; image?: string }>;
    "newest-drops"?: ApiFeedCardItem[];
    "most-popular"?: ApiFeedCardItem[];
    "airing"?: ApiFeedCardItem[];
    "cartoons"?: ApiFeedCardItem[];
    "most-popular-movies"?: ApiFeedCardItem[];
    "latest-anime-movies"?: ApiFeedCardItem[];
    "latest-cartoon-movies"?: ApiFeedCardItem[];
    [key: string]: any;
  };
}

export interface ApiEpisode {
  episode: number | string;
  title: string;
  id: string;
  image?: string;
  duration?: string;
}

export interface ApiSeason {
  season: number;
  name: string;
  episodesCount?: number;
  episodes: ApiEpisode[];
}

export interface ApiAnimeInfoResponse {
  success: boolean;
  id: string;
  data: {
    id: string;
    title: string;
    originalTitle?: string;
    synopsis?: string;
    image?: string;
    banner?: string;
    rating?: string;
    genres?: string[];
    languages?: string[];
    networks?: string[];
    totalSeasons?: number;
    totalEpisodes?: number;
    seasons?: ApiSeason[];
    related?: any[];
  };
}

/**
 * Fetch categorized homepage feed from /api/v1/animeworldin/home
 */
export async function fetchHomeFeed(): Promise<ApiHomeFeedResponse | null> {
  try {
    const url = `${API_BASE_URL}/api/v1/animeworldin/home`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[API] Failed to fetch home feed: HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.error("[API] Error fetching home feed:", err);
    return null;
  }
}

export interface ApiMovieResponse {
  success: boolean;
  movieId: string;
  data: {
    id: string;
    title: string;
    synopsis?: string;
    image?: string;
    banner?: string;
    rating?: string;
    genres?: string[];
    languages?: string[];
    releaseYear?: string;
    isMovie?: boolean;
    streamInfo?: {
      hasDubPlayer: boolean;
      streamId: string | number | null;
      abyssId?: string | number | null;
      playXID?: string | null;
      dubPlayerSrc: string | null;
      message?: string | null;
      serversEndpoint?: string | null;
    };
    multiAudioPlayers?: Array<{
      language: string;
      sourceUrl: string;
      proxyUrl: string;
    }>;
    players?: Array<{
      name: string;
      embedUrl: string;
      proxyUrl: string;
    }>;
  };
}

export interface ApiEpisodeResponse {
  success: boolean;
  episodeId: string;
  data: {
    episodeId: string;
    title: string;
    runningEpisode?: {
      episode: number;
      season: number;
      title: string;
      id: string;
    };
    nextEpisode?: {
      id: string;
      episode: number;
      season: number;
      title: string;
    } | null;
    prevEpisode?: any;
    streamInfo?: {
      hasDubPlayer: boolean;
      streamId: string | number | null;
      abyssId?: string | number | null;
      playXID?: string | null;
      dubPlayerSrc: string | null;
      message?: string | null;
      serversEndpoint?: string | null;
    };
    anime?: {
      id: string;
      title: string;
      url: string;
      image: string;
    };
    otherPlayers?: Array<{
      name: string;
      embedUrl: string;
      proxyUrl: string;
    }>;
  };
}

export interface ApiStreamServerLanguage {
  language: string;
  code?: string;
  short?: string;
  video_id?: string;
  streamUrl?: string;
  sourceUrl?: string;
  videoSource?: string;
  link?: string;
  hls?: boolean;
  videoImage?: string;
  proxyUrl?: string;
}

export interface ApiStreamServerItem {
  serverName: string;
  server: string;
  streamUrl?: string;
  sourceUrl?: string;
  videoSource?: string;
  videoImage?: string;
  hls?: boolean;
  languages: ApiStreamServerLanguage[];
}

export interface ApiStreamServersResponse {
  success: boolean;
  streamId?: string | number;
  abyssId?: string | number;
  playXID?: string;
  targetUrl?: string;
  elapsedMs?: number;
  data: {
    streamId?: string | number;
    abyssId?: string | number;
    playXID?: string;
    title?: string;
    season?: number;
    episode?: number;
    targetOrigin?: string;
    servers: ApiStreamServerItem[];
    defaultSource?: {
      serverName: string;
      language: string;
      video_id?: string;
      streamUrl?: string;
      sourceUrl?: string;
      proxyUrl?: string;
    };
  };
}

export interface AbyssVideoSource {
  label: string;
  size: number;
  codec: string;
  totalChunks?: number;
  directStreamUrl: string;
  directHlsPlaylist: string;
}

export interface AbyssResolveResponse {
  success: boolean;
  id: string;
  slug?: string;
  availableResolutions: string[];
  streamUrl: string;
  hlsUrl: string;
  playUrl: string;
  sources: AbyssVideoSource[];
  resolvedAt?: string;
  error?: string;
}

/**
 * Fetch movie info from /movie/{id}
 */
export async function fetchMovieInfo(id: string): Promise<ApiMovieResponse | null> {
  try {
    const cleanId = id.replace(/^\/+|\/+$/g, "").replace(/^movies?\//, "");
    const url = `${API_BASE_URL}/movie/${cleanId}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching movie ${id}:`, err);
    return null;
  }
}

/**
 * Fetch detailed anime metadata & all seasons with episodes from /api/v1/animeworldin/animeinfo/{id}
 */
export async function fetchAnimeInfo(id: string): Promise<ApiAnimeInfoResponse | null> {
  try {
    const cleanId = id.replace(/^\/+|\/+$/g, "");
    const url = `${API_BASE_URL}/api/v1/animeworldin/animeinfo/${cleanId}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[API] Failed to fetch animeinfo for ${id}: HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.error(`[API] Error fetching animeinfo for ${id}:`, err);
    return null;
  }
}

/**
 * Fetch episode stream details from /episode/{id}
 */
export async function fetchEpisodeInfo(id: string): Promise<ApiEpisodeResponse | null> {
  try {
    const cleanId = id.replace(/^\/+|\/+$/g, "").replace(/^episode\//, "");
    const url = `${API_BASE_URL}/episode/${cleanId}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[API] Failed to fetch episode ${id}: HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching episode ${id}:`, err);
    return null;
  }
}

export type StreamServersQuery =
  | string
  | number
  | {
      playXID?: string | null;
      abyssId?: string | number | null;
      streamId?: string | number | null;
      serversEndpoint?: string | null;
    };

/**
 * Fetch stream servers and audio language URLs from /stream/servers/?playXID=...&abyssId=...
 */
export async function fetchStreamServers(
  params: StreamServersQuery
): Promise<ApiStreamServersResponse | null> {
  try {
    let url = "";

    if (typeof params === "object" && params !== null) {
      if (params.serversEndpoint) {
        url = params.serversEndpoint.startsWith("http")
          ? params.serversEndpoint
          : `${API_BASE_URL}${params.serversEndpoint.startsWith("/") ? "" : "/"}${params.serversEndpoint}`;
      } else {
        const q = new URLSearchParams();
        if (params.playXID) {
          q.set("playXID", String(params.playXID).trim());
        }
        const abyss = params.abyssId || params.streamId;
        if (abyss) {
          q.set("abyssId", String(abyss).trim());
        }
        url = `${API_BASE_URL}/stream/servers/?${q.toString()}`;
      }
    } else if (typeof params === "string") {
      const trimmed = params.trim();
      if (
        trimmed.includes("playXID=") ||
        trimmed.includes("abyssId=") ||
        trimmed.startsWith("/stream/servers/?")
      ) {
        url = trimmed.startsWith("http")
          ? trimmed
          : `${API_BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
      } else {
        const cleanStreamId = trimmed
          .replace(/^\/+|\/+$/g, "")
          .replace(/^.*\/servers\//, "")
          .replace(/[^0-9a-zA-Z_-]/g, "");
        url = `${API_BASE_URL}/stream/servers/?abyssId=${cleanStreamId}`;
      }
    } else if (typeof params === "number") {
      url = `${API_BASE_URL}/stream/servers/?abyssId=${params}`;
    }

    if (!url) return null;

    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[API] Failed to fetch servers from ${url}: HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[API] Error fetching servers:", err);
    return null;
  }
}

export interface ApiSearchSuggestion {
  id: string;
  title: string;
  type?: string;
  url?: string;
  image?: string;
}

export interface ApiSearchSuggestionsResponse {
  success: boolean;
  term: string;
  totalResults: number;
  suggestions: ApiSearchSuggestion[];
}

export interface ApiSearchResultItem {
  id: string;
  title: string;
  image?: string;
  type?: string;
  rating?: string;
  year?: string;
}

export interface ApiSearchResponse {
  success: boolean;
  query: string;
  currentPage: number;
  nextPage?: number | null;
  totalPages: number;
  hasNextPage: boolean;
  totalResults?: number;
  results: ApiSearchResultItem[];
}

/**
 * Fetch search suggestions for instant autocomplete
 */
export async function fetchSearchSuggestions(term: string): Promise<ApiSearchSuggestion[]> {
  if (!term || !term.trim()) return [];
  try {
    const cleanTerm = encodeURIComponent(term.trim());
    const url = `${API_BASE_URL}/search-suggestion?term=${cleanTerm}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: ApiSearchSuggestionsResponse = await res.json();
    return data.suggestions || [];
  } catch (err) {
    console.error(`[API] Error fetching search suggestions for "${term}":`, err);
    return [];
  }
}

/**
 * Fetch full search results page with pagination
 */
export async function fetchSearchResults(query: string, page = 1): Promise<ApiSearchResponse | null> {
  if (!query || !query.trim()) return null;
  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const url = `${API_BASE_URL}/search?s=${cleanQuery}&page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching search results for "${query}":`, err);
    return null;
  }
}

/**
 * Resolve direct video stream URLs & interactive web player from Abyss Stream Proxy
 * using the configured 32-bit token bypass (from proxy origin protection).
 *
 * Endpoint: {abyss_proxy_url}/resolve/{videoId}?token={32bit_token}
 */
export async function resolveAbyssVideo(
  videoId: string
): Promise<AbyssResolveResponse | null> {
  if (!videoId) return null;

  try {
    const cleanBase = ABYSS_PROXY_URL.replace(/\/+$/, "");
    const cleanVideoId = encodeURIComponent(videoId.trim());
    const token = ABYSS_AUTH_TOKEN;

    const url = `${cleanBase}/resolve/${cleanVideoId}?token=${token}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "x-auth-token": token,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn(
        `[AbyssProxy] Failed to resolve video ${videoId}: HTTP ${res.status}`
      );
      return null;
    }

    const data: AbyssResolveResponse = await res.json();
    return data;
  } catch (err) {
    console.error(`[AbyssProxy] Error resolving video ${videoId}:`, err);
    return null;
  }
}

export interface ApiSubtitleTrack {
  kind?: string;
  label: string;
  language?: string;
  default?: boolean;
  proxyUrl: string;
  originalUrl?: string;
}

export interface ApiPlayXPlayerData {
  success: boolean;
  videoId?: string;
  title?: string;
  hls?: boolean;
  videoSource?: string;
  streamProxyUrl?: string;
  subtitles?: ApiSubtitleTrack[];
  tracks?: ApiSubtitleTrack[];
  intro?: {
    start: number;
    end: number;
    duration?: number;
    enabled?: boolean;
  };
  outro?: {
    start: number;
    end: number;
    duration?: number;
    enabled?: boolean;
  };
  error?: string;
}

/**
 * Fetch PlayX / Sora proxy playable stream using env.abyss_proxy_url
 * Endpoint: {abyss_proxy_url}/player/data/:videoId
 */
export async function fetchPlayXStreamData(videoId: string): Promise<ApiPlayXPlayerData | null> {
  if (!videoId) return null;
  const cleanId = encodeURIComponent(videoId.trim());

  // 1. First priority: Direct call using env.abyss_proxy_url
  try {
    const cleanBase = ABYSS_PROXY_URL.replace(/\/+$/, "");
    const url = `${cleanBase}/player/data/${cleanId}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data: ApiPlayXPlayerData = await res.json();
      if (data && data.success && data.streamProxyUrl) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`[PlayXProxy] Direct fetch via abyss_proxy_url failed for ${videoId}:`, err);
  }

  // 2. Fallback: via local backend server /api/player/data/:id
  try {
    const url = `${API_BASE_URL}/api/player/data/${cleanId}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data: ApiPlayXPlayerData = await res.json();
      if (data && data.success && data.streamProxyUrl) {
        return data;
      }
    }
  } catch (err) {
    console.error(`[PlayXProxy] Fallback fetch failed for ${videoId}:`, err);
  }

  return null;
}


/**
 * Transform an ApiSpotlightItem into an AnimeItem suitable for Hero Banner
 */
export function mapSpotlightToAnimeItem(
  spotlight: ApiSpotlightItem,
  seasonsData?: SeasonInfo[]
): AnimeItem {
  return {
    id: spotlight.id,
    title: spotlight.title,
    fontStyle: "modern",
    originalTitle: spotlight.title,
    image: spotlight.image || spotlight.banner || "",
    backdrop: spotlight.banner || spotlight.image || "",
    badge: undefined,
    genres: spotlight.genres || [],
    rating: spotlight.rating || "",
    year: 0,
    seasonsCountText: spotlight.season || "",
    episodes: 0,
    duration: "24m/ep",
    audio: spotlight.languages || ["Hindi", "Japanese"],
    synopsis: spotlight.synopsis || "",
    seasons: seasonsData,
  };
}

/**
 * Transform an ApiFeedCardItem into an AnimeItem suitable for card shelves
 */
export function mapFeedCardToAnimeItem(
  card: ApiFeedCardItem,
  defaultGenre = "Action"
): AnimeItem {
  return {
    id: card.id,
    title: card.title,
    image: card.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    badge: card.season || "Hindi Dub",
    genres: [defaultGenre],
    rating: card.rating || "8.5",
    year: 2024,
    episodes: 12,
    audio: ["Hindi Dub"],
    synopsis: `${card.title} - ${card.season || ""} ${card.episode || ""}. Watch online in Hindi Dubbed.`,
  };
}

/**
 * Transform ApiSeason[] from backend animeinfo into SeasonInfo[]
 */
export function mapApiSeasonsToSeasonInfo(
  apiSeasons: ApiSeason[],
  fallbackEpisodes?: EpisodeItem[]
): SeasonInfo[] {
  if (!apiSeasons || apiSeasons.length === 0) return [];

  return apiSeasons.map((s, sIdx) => {
    const episodes: EpisodeItem[] = (s.episodes || []).map((ep, epIdx) => {
      return {
        id: ep.id || `ep-${s.season}-${ep.episode}`,
        episodeNumber: typeof ep.episode === "number" ? ep.episode : parseInt(String(ep.episode)) || epIdx + 1,
        title: ep.title.startsWith("Episode") ? ep.title : `Episode ${ep.episode}: ${ep.title}`,
        image: ep.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        duration: ep.duration || "24m",
        progress: 0,
        synopsis: ep.title ? `${ep.title} • Season ${s.season || 1}` : `Episode ${ep.episode} of ${s.name}`,
      };
    });

    return {
      seasonNumber: s.season || sIdx + 1,
      name: s.name || `Season ${s.season || sIdx + 1}`,
      episodes: episodes.length > 0 ? episodes : (fallbackEpisodes || []),
    };
  });
}

export interface ApiCatalogItem {
  id: string;
  title: string;
  image?: string;
  rating?: string;
  year?: string;
  type?: string;
  duration?: string;
  languages?: string[];
  episodesCount?: number;
}

export interface ApiCatalogResponse {
  success: boolean;
  path?: string;
  letter?: string;
  genre?: string;
  query?: string;
  currentPage: number;
  nextPage?: number | null;
  totalPages: number;
  hasNextPage: boolean;
  totalResults?: number;
  results: ApiCatalogItem[];
}

export interface ApiGenreItem {
  name: string;
  slug: string;
  path?: string;
  url?: string;
}

/**
 * Fetch movies catalog from /movies?page={page}
 */
export async function fetchMovies(page = 1): Promise<ApiCatalogResponse | null> {
  try {
    const url = `${API_BASE_URL}/movies?page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching movies page ${page}:`, err);
    return null;
  }
}

/**
 * Fetch list of all 86 genres from /genres
 */
export async function fetchGenresList(): Promise<ApiGenreItem[]> {
  try {
    const url = `${API_BASE_URL}/genres`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.genres || [];
  } catch (err) {
    console.error("[API] Error fetching genres list:", err);
    return [];
  }
}

/**
 * Fetch category/genre listing from /genre/{genre}?page={page}
 */
export async function fetchGenreListing(
  genre: string,
  page = 1
): Promise<ApiCatalogResponse | null> {
  if (!genre) return null;
  try {
    const cleanGenre = encodeURIComponent(
      genre.trim().toLowerCase().replace(/^\/+|\/+$/g, "").replace(/^category\/genre\//, "").replace(/^genre\//, "")
    );
    const url = `${API_BASE_URL}/genre/${cleanGenre}?page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching genre ${genre} page ${page}:`, err);
    return null;
  }
}

/**
 * Fetch A-Z listing from /az-list/{letter}?page={page}
 */
export async function fetchAzListing(
  letter: string,
  page = 1
): Promise<ApiCatalogResponse | null> {
  if (!letter) return null;
  try {
    let cleanLetter = encodeURIComponent(
      letter.trim().toLowerCase().replace(/^\/+|\/+$/g, "").replace(/^az-list\//, "").replace(/^letter\//, "")
    );
    if (cleanLetter === "%23" || cleanLetter === "#" || cleanLetter === "0-9") {
      cleanLetter = "0-9";
    }
    const url = `${API_BASE_URL}/az-list/${cleanLetter}?page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching AZ letter ${letter} page ${page}:`, err);
    return null;
  }
}

/**
 * Fetch category listing (anime, cartoon, or series) from /category/{category}?page={page}
 */
export async function fetchCategory(
  category: "anime" | "cartoon" | "series" | string,
  page = 1
): Promise<ApiCatalogResponse | null> {
  try {
    const cleanCat = category.replace(/^\/+|\/+$/g, "").replace(/^category\//, "");
    const url = `${API_BASE_URL}/category/${cleanCat}?page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching category ${category} page ${page}:`, err);
    return null;
  }
}

/**
 * Universal taxonomy listing fetcher for network, language, franchise, etc.
 */
export async function fetchTaxonomyListing(
  taxonomyPath: string,
  page = 1
): Promise<ApiCatalogResponse | null> {
  try {
    const cleanPath = taxonomyPath.replace(/^\/+|\/+$/g, "");
    const url = `${API_BASE_URL}/${cleanPath}?page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] Error fetching taxonomy ${taxonomyPath} page ${page}:`, err);
    return null;
  }
}


