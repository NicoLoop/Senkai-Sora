"use client";

export interface AnimeWatchlistItem {
  id: string;
  title: string;
  image?: string;
  rating?: string;
  year?: string;
  type?: string;
  addedAt: number;
}

export interface WatchHistoryItem {
  id: string;
  episodeId: string;
  animeTitle: string;
  episodeTitle: string;
  season?: number;
  episode?: number;
  image?: string;
  currentTime?: number;
  progress?: number;
  duration?: string | number;
  watchedAt: number;
}

export interface GuestUserProfile {
  username: string;
  avatarUrl: string;
  joinedAt: number;
}

// -------------------------------------------------------------
// Low-level Cookie Utilities (Safe for Browser & SSR)
// Default expiration: 3650 days (10 years) - never expires unless cleared by user
// -------------------------------------------------------------
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export function setCookie(name: string, value: string, days = 3650) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// -------------------------------------------------------------
// Watchlist in Cookies
// -------------------------------------------------------------
const WATCHLIST_COOKIE = "senkai_watchlist";

export function getWatchlist(): AnimeWatchlistItem[] {
  try {
    const raw = getCookie(WATCHLIST_COOKIE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToWatchlist(item: AnimeWatchlistItem) {
  const current = getWatchlist().filter((i) => i.id !== item.id);
  const updated = [item, ...current].slice(0, 50); // limit to last 50 for cookie size
  setCookie(WATCHLIST_COOKIE, JSON.stringify(updated), 3650);
}

export function removeFromWatchlist(id: string) {
  const current = getWatchlist().filter((i) => i.id !== id);
  setCookie(WATCHLIST_COOKIE, JSON.stringify(current), 3650);
}

export function clearWatchlist() {
  deleteCookie(WATCHLIST_COOKIE);
}

export function isItemInWatchlist(id: string): boolean {
  return getWatchlist().some((i) => i.id === id);
}

// -------------------------------------------------------------
// Watch History in Cookies
// -------------------------------------------------------------
const HISTORY_COOKIE = "senkai_watch_history";

export function getAnimeRootId(idOrEpisodeId: string): string {
  let clean = idOrEpisodeId
    .replace(/^\/+|\/+$/g, "")
    .replace(/^episode\//, "")
    .replace(/^watch\//, "")
    .replace(/^movies\//, "")
    .replace(/^movie\//, "");
  // Strip season and episode markers like -1x2, -2x14, etc.
  clean = clean.replace(/-\d+x\d+.*$/, "");
  return clean;
}

export function getWatchHistory(): WatchHistoryItem[] {
  try {
    const raw = getCookie(HISTORY_COOKIE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToWatchHistory(item: Partial<WatchHistoryItem> & { episodeId: string; animeTitle: string }) {
  const animeId = item.id || getAnimeRootId(item.episodeId);
  const current = getWatchHistory();

  // Deduplicate: If user changes episode of the same anime, remove previous episode entry
  const filtered = current.filter((h) => {
    const hAnimeId = h.id || getAnimeRootId(h.episodeId);
    return hAnimeId !== animeId && h.episodeId !== item.episodeId;
  });

  const durationSec = typeof item.duration === "number" ? item.duration : 0;
  const currentSec = typeof item.currentTime === "number" ? item.currentTime : 0;
  const progressPercent =
    item.progress !== undefined
      ? item.progress
      : durationSec > 0
      ? Math.min(100, Math.round((currentSec / durationSec) * 100))
      : 0;

  const newItem: WatchHistoryItem = {
    id: animeId,
    episodeId: item.episodeId,
    animeTitle: item.animeTitle,
    episodeTitle: item.episodeTitle || "",
    season: item.season,
    episode: item.episode,
    image: item.image,
    currentTime: Math.round(currentSec * 100) / 100,
    duration: durationSec,
    progress: progressPercent,
    watchedAt: Date.now(),
  };

  const updated = [newItem, ...filtered].slice(0, 50);
  setCookie(HISTORY_COOKIE, JSON.stringify(updated), 3650);
  return newItem;
}

export function saveWatchProgress(item: {
  id?: string;
  episodeId: string;
  animeTitle: string;
  episodeTitle?: string;
  season?: number;
  episode?: number;
  image?: string;
  currentTime: number;
  duration: number;
}) {
  return addToWatchHistory(item);
}

export function getSavedProgressForEpisode(episodeId: string): number | null {
  if (!episodeId) return null;
  const current = getWatchHistory();
  const cleanEpId = episodeId.replace(/^\/+|\/+$/g, "");
  const found = current.find(
    (h) => h.episodeId.replace(/^\/+|\/+$/g, "") === cleanEpId
  );
  if (
    found &&
    typeof found.currentTime === "number" &&
    found.currentTime > 5 &&
    (!found.duration || found.currentTime < Number(found.duration) - 15)
  ) {
    return found.currentTime;
  }
  return null;
}

export function clearWatchHistory() {
  deleteCookie(HISTORY_COOKIE);
}

// -------------------------------------------------------------
// Player Controls Settings in Cookies
// -------------------------------------------------------------
export interface PlayerControlsSettings {
  server: "sora" | "abyss";
  type: "sub" | "dub";
  expand: boolean;
  light: boolean;
  autoplay: boolean;
  autoNext: boolean;
  autoSkip: boolean;
  language: string;
}

export const DEFAULT_PLAYER_CONTROLS: PlayerControlsSettings = {
  server: "sora",
  type: "dub",
  expand: false,
  light: true,
  autoplay: true,
  autoNext: true,
  autoSkip: true,
  language: "hindi",
};

const PLAYER_CONTROLS_COOKIE = "senkai_player_controls";

export function getPlayerControls(): PlayerControlsSettings {
  try {
    const raw = getCookie(PLAYER_CONTROLS_COOKIE);
    if (!raw) return DEFAULT_PLAYER_CONTROLS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PLAYER_CONTROLS, ...parsed };
  } catch {
    return DEFAULT_PLAYER_CONTROLS;
  }
}

export function savePlayerControls(settings: Partial<PlayerControlsSettings>): PlayerControlsSettings {
  const current = getPlayerControls();
  const updated: PlayerControlsSettings = { ...current, ...settings };
  setCookie(PLAYER_CONTROLS_COOKIE, JSON.stringify(updated), 3650);
  return updated;
}

// -------------------------------------------------------------
// Guest User Profile in Cookies
// -------------------------------------------------------------
const GUEST_COOKIE = "senkai_guest_user";

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden";

export function getGuestUser(): GuestUserProfile {
  try {
    const raw = getCookie(GUEST_COOKIE);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    username: "Guest Ninja",
    avatarUrl: DEFAULT_AVATAR,
    joinedAt: Date.now(),
  };
}

export function setGuestUser(user: Partial<GuestUserProfile>): GuestUserProfile {
  const current = getGuestUser();
  const updated: GuestUserProfile = {
    username: user.username?.trim() || current.username,
    avatarUrl: user.avatarUrl || current.avatarUrl,
    joinedAt: current.joinedAt || Date.now(),
  };
  setCookie(GUEST_COOKIE, JSON.stringify(updated), 3650);
  return updated;
}

// -------------------------------------------------------------
// 50 Anime Profile Picture Avatars Generator from Dicebear API
// -------------------------------------------------------------
export function get50AvatarChoices(): Array<{ id: string; url: string; name: string }> {
  const seeds = [
    "Aiden", "Akira", "Ren", "Yuki", "Haruto", "Sora", "Kai", "Ryu", "Shin", "Kenji",
    "Kaito", "Kazuto", "Takeru", "Goku", "Luffy", "Naruto", "Zoro", "Levi", "Gojo", "Sukuna",
    "Tanjiro", "Nezuko", "Zenitsu", "Inosuke", "Itadori", "Megumi", "Nobara", "Killua", "Gon", "Kurapika",
    "Hina", "Sakura", "Aoi", "Rin", "Mio", "Asuka", "Rei", "Mikasa", "Hinata", "Nami",
    "Robin", "Boa", "Yamato", "Mitsuri", "Shinobu", "Kanao", "Kaguya", "Chika", "Rem", "Emilia"
  ];

  return seeds.map((seed, idx) => ({
    id: `pfp-${idx + 1}`,
    name: seed,
    url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`,
  }));
}
