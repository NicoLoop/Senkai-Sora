"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Bell, Menu, X, ExternalLink, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/services/api";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeNav: string;
  onNavClick: (nav: string) => void;
  myListCount: number;
}

export function Navbar({
  searchQuery,
  onSearchChange,
  activeNav,
  onNavClick,
  myListCount,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navLinks = [
    { name: "Home", id: "home" },
    { name: "My List", id: "my-list", badge: myListCount > 0 ? myListCount : null },
    { name: "Movie", id: "movie" },
    { name: "New Season", id: "new-season" },
    { name: "Language", id: "language" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Custom Circular Anime Portal Logo */}
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-300 p-[2px] transition-transform duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-[#0e0e12] rounded-full flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/90 border-t-transparent animate-[spin_4s_linear_infinite]" />
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white hidden md:inline-block">
              ANIME<span className="text-purple-400">STREAM</span>
              <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-semibold tracking-wider uppercase">
                Hindi
              </span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[14px]">
            {navLinks.map((link) => {
              const isActive = activeNav === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavClick(link.id)}
                  className={`relative py-1 font-medium transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {link.name}
                  {link.badge && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Search, Dev Link, Bell, Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Dev Extractor Quick Link */}
          <a
            href={`${API_BASE_URL}/dev/iframe`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Iframe Proxy Player Tester"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-all hover:scale-105"
          >
            <span>▶ Iframe Proxy</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <a
            href={`${API_BASE_URL}/dev/extract`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Scraper Extractor Dev Page"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Dev Extractor</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* Search Bar matching screenshot */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search here ..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-40 sm:w-60 md:w-72 bg-[#1e1e24]/80 text-white placeholder-neutral-400 text-sm rounded-full pl-4 pr-10 py-2 border border-white/10 focus:outline-none focus:border-white/30 focus:bg-[#25252e] transition-all"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0a0a0d]" />
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#16161d] border border-white/10 rounded-2xl p-3 shadow-2xl z-50 text-xs">
                <div className="font-semibold text-white mb-2 px-1 pb-1 border-b border-white/10 flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-[10px] text-purple-400 font-normal">2 New</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                    <p className="font-medium text-white">Jujutsu Kaisen: Culling Game</p>
                    <p className="text-neutral-400 text-[11px]">Episode 3 Hindi Dub is now streaming!</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                    <p className="font-medium text-white">Dev Extractor Connected</p>
                    <p className="text-neutral-400 text-[11px]">API scraper listening on port 5000</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-400/50 ring-2 ring-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.3)] bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="User Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to stylized letter avatar
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-xs font-bold text-white">HI</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0e0e13]/95 border-b border-white/10 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavClick(link.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              {link.name}
            </button>
          ))}
          <a
            href={`${API_BASE_URL}/dev/extract`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 text-sm font-medium"
          >
            Open Dev Extractor Tool ↗
          </a>
        </div>
      )}
    </header>
  );
}
