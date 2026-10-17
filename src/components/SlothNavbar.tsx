"use client";

import React, { useState } from "react";
import { Search, Bell, X, Sparkles, Film } from "lucide-react";

interface SlothNavbarProps {
  activeNav: string;
  onNavClick: (nav: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedShowId: string;
  onSelectShow: (id: string) => void;
  myListCount: number;
}

export function SlothNavbar({
  activeNav,
  onNavClick,
  searchQuery,
  onSearchChange,
  selectedShowId,
  onSelectShow,
  myListCount,
}: SlothNavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "browse", label: "Browse" },
    { id: "kids", label: "Kids" },
    { id: "support", label: "Support" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <header className="w-full pt-4 pb-2 px-4 sm:px-8 z-30 transition-all select-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Brand & Desktop Links */}
        <div className="flex items-center gap-6 md:gap-8">
          {/* Mobile-only brand logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-400 p-[1.5px] shadow-[0_0_15px_rgba(147,51,234,0.4)]">
              <div className="w-full h-full bg-[#0d0c14] rounded-[calc(1rem-1.5px)] flex items-center justify-center">
                <span className="font-extrabold text-sm text-white">S</span>
              </div>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">slothUI</span>
          </div>

          {/* Top Links matching screenshot: Home, Browse, Kids, Support, FAQ */}
          <nav className="flex items-center gap-5 sm:gap-7 text-[13px] sm:text-[14px]">
            {navLinks.map((link) => {
              const isActive = activeNav === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavClick(link.id)}
                  className={`relative py-1 font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side: Show Switcher Pill, Search, Notifications, Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick Show Switcher Pill (Demonic Slash vs Rise of X) */}
          <div className="hidden lg:flex items-center p-1 rounded-full bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => onSelectShow("demonic-slash")}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                selectedShowId === "demonic-slash"
                  ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Demonic Slash
            </button>
            <button
              onClick={() => onSelectShow("rise-of-x")}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                selectedShowId === "rise-of-x"
                  ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Rise of X
            </button>
          </div>

          {/* Search Button (Circular glass button matching screenshot) */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center bg-[#15141f] border border-white/20 rounded-full pl-3 pr-2 py-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search titles, anime..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-36 sm:w-56 bg-transparent text-white text-xs sm:text-sm focus:outline-none placeholder-neutral-500"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    onSearchChange("");
                  }}
                  className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Notification Button (Circular glass button with badge counter "2" matching screenshot) */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                2
              </span>
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-[#12111b]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-purple-400 font-medium">2 New Updates</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition">
                    <p className="font-semibold text-white">Demonic Slash Season 5</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">Hashira Training Arc now in Hindi Dub!</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition">
                    <p className="font-semibold text-white">Rise of X Premiere</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">#1 Trending sci-fi epic is now live.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar (Circular with green status dot matching screenshot) */}
          <div
            onClick={() => onNavClick("profile")}
            className="relative cursor-pointer group"
            title="Profile"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 p-[1px] bg-gradient-to-tr from-purple-500 to-indigo-500 transition-transform group-hover:scale-105">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#08080c]" />
          </div>
        </div>
      </div>
    </header>
  );
}
