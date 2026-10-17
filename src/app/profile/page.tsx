"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import {
  getGuestUser,
  setGuestUser,
  get50AvatarChoices,
  getWatchlist,
  getWatchHistory,
  clearWatchHistory,
  clearWatchlist,
  GuestUserProfile,
} from "@/utils/cookieStorage";
import {
  User,
  Check,
  Sparkles,
  Bookmark,
  Clock,
  Shield,
  Trash2,
  RefreshCw,
  ExternalLink,
  Film,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [activeNav, setActiveNav] = useState("profile");
  const [searchQuery, setSearchQuery] = useState("");

  const [profile, setProfile] = useState<GuestUserProfile | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [avatarChoices, setAvatarChoices] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  const [watchlistCount, setWatchlistCount] = useState<number>(0);
  const [historyCount, setHistoryCount] = useState<number>(0);

  useEffect(() => {
    const p = getGuestUser();
    setProfile(p);
    setSelectedAvatar(p.avatarUrl);
    setUsernameInput(p.username);
    setAvatarChoices(get50AvatarChoices());

    setWatchlistCount(getWatchlist().length);
    setHistoryCount(getWatchHistory().length);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedName = usernameInput.trim() || "Guest Otaku";
    const updated = setGuestUser({
      username: updatedName,
      avatarUrl: selectedAvatar,
    });
    setProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleRandomAvatar = () => {
    if (avatarChoices.length === 0) return;
    const rand = avatarChoices[Math.floor(Math.random() * avatarChoices.length)];
    setSelectedAvatar(rand.url);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your entire watch history?")) {
      clearWatchHistory();
      setHistoryCount(0);
    }
  };

  const handleClearWatchlist = () => {
    if (confirm("Are you sure you want to clear your entire watchlist?")) {
      clearWatchlist();
      setWatchlistCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      <SidebarRail activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8 relative">
        <FloatingNavbar
          activeNav={activeNav}
          onNavClick={setActiveNav}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 space-y-8">
          {/* Header Banner */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-900/20 border border-purple-500/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              {/* Profile Avatar Card */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                  <div className="w-full h-full bg-[#0d0c14] rounded-[22px] overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedAvatar || profile?.avatarUrl}
                      alt="Active Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-lg">
                  Guest
                </span>
              </div>

              {/* Title & Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  Cookie Stored • No Database Required
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {profile?.username || "Guest Otaku"}
                </h1>
                <p className="text-sm text-neutral-400 max-w-xl">
                  Customize your nickname and pick any avatar from our 50 high-res anime
                  avatars. Your profile, watchlist, and episode history are saved locally in
                  your browser cookies.
                </p>

                {isSaved && (
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <Check className="w-4 h-4" /> Profile saved successfully!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/watchlist"
              className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 transition group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{watchlistCount}</div>
                  <div className="text-xs text-neutral-400 font-medium">Watchlist Animes</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 transition" />
            </Link>

            <Link
              href="/history"
              className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 transition group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{historyCount}</div>
                  <div className="text-xs text-neutral-400 font-medium">Watched Episodes</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition" />
            </Link>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">50</div>
                  <div className="text-xs text-neutral-400 font-medium">Anime Avatars Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Nickname & Pick Avatar Form */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-[#0f0e17]/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-xl"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Edit Profile & Nickname
                </h2>
                <p className="text-xs text-neutral-400">
                  Select your favorite character icon from the 50 avatars below
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Random Avatar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.4)] transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                maxLength={25}
                placeholder="e.g. Zenitsu, Luffy, Gojo"
                className="w-full max-w-md px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>

            {/* 50 Anime Avatars Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Select Avatar (50 Available from API)
                </label>
                <span className="text-[11px] text-neutral-400">
                  Click any avatar to select
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-[380px] overflow-y-auto p-3 bg-black/40 rounded-2xl border border-white/5 scrollbar-thin scrollbar-thumb-purple-600/40">
                {avatarChoices.map((av) => {
                  const isSelected = selectedAvatar === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`relative group aspect-square rounded-2xl overflow-hidden p-1 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-tr from-purple-500 to-pink-500 ring-2 ring-purple-400 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                          : "bg-white/[0.04] hover:bg-white/[0.1] border border-white/5 hover:border-purple-500/50 hover:scale-105"
                      }`}
                      title={av.name}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-600/30 rounded-xl flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Privacy & Cookie Management Section */}
          <div className="bg-[#0f0e17]/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Data & Cookie Storage Settings
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
              Senkai Sora is fully serverless and database-free. Your watchlist, watch
              progress, and guest profile are stored safely in your device browser cookies.
              You can wipe them anytime below.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearWatchlist}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear Watchlist ({watchlistCount})
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear Watch History ({historyCount})
              </button>
            </div>
          </div>
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav activeTab={activeTab} />
    </div>
  );
}
