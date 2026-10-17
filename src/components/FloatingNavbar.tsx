"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { fetchSearchSuggestions, ApiSearchSuggestion } from "@/services/api";

interface FloatingNavbarProps {
  activeNav: string;
  onNavClick: (nav: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProfile?: () => void;
}

export function FloatingNavbar({
  activeNav,
  onNavClick,
  searchQuery,
  onSearchChange,
  onSelectProfile,
}: FloatingNavbarProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ApiSearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "animes", label: "Animes" },
    { id: "cartoon", label: "Cartoon" },
    { id: "genres", label: "Genres" },
  ];

  // Auto-focus input when search expands
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Live Autocomplete Suggestions from API
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      const res = await fetchSearchSuggestions(searchQuery.trim());
      setSuggestions(res);
      setShowSuggestionsDropdown(res.length > 0);
      setIsLoadingSuggestions(false);
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to collapse search if empty
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestionsDropdown(false);
        if (!searchQuery.trim()) {
          setIsSearchOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestionsDropdown(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="fixed top-3.5 left-0 md:left-[72px] lg:left-[76px] right-0 z-40 pointer-events-none select-none px-4 sm:px-8">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Floating Menu Island + Separate Floating Search Bar Island */}
        <div className="flex items-center gap-3 pointer-events-auto flex-wrap">
          {/* Floating Menu Island: Home, Animes, Cartoon, Genres */}
          <nav
            aria-label="Main Floating Menu"
            className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#100f18]/90 backdrop-blur-2xl border-t border-l border-white/20 border-r border-b border-black/40 shadow-[0_10px_30px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)]"
          >
            {navLinks.map((link) => {
              const isActive = activeNav === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavClick(link.id);
                    if (link.id === "home") router.push("/");
                    else if (link.id === "animes") router.push("/animes");
                    else if (link.id === "cartoon") router.push("/cartoon");
                    else if (link.id === "genres") router.push("/genres");
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-b from-purple-500/40 via-purple-600/35 to-purple-800/50 border-t border-l border-purple-300/80 border-r border-b border-purple-900/60 text-white shadow-[0_0_16px_rgba(168,85,247,0.65),inset_0_1px_2px_rgba(255,255,255,0.45)] scale-[1.02]"
                      : "bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300 hover:text-white border-t border-l border-white/10 border-r border-b border-transparent shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 active:translate-y-[1px]"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Floating Search Bar Island with Autocomplete Dropdown */}
          <div ref={searchContainerRef} className="relative">
            <form
              onSubmit={handleSearchSubmit}
              onClick={() => {
                if (!isSearchOpen) {
                  setIsSearchOpen(true);
                }
              }}
              className={`relative flex items-center transition-all duration-300 ease-out rounded-full bg-[#100f18]/90 backdrop-blur-2xl border-t border-l border-r border-b shadow-[0_10px_30px_rgba(0,0,0,0.7)] ${
                isSearchOpen
                  ? "w-72 sm:w-88 md:w-[420px] lg:w-[480px] px-4 py-1.5 border-purple-500/70 border-b-purple-900/40 shadow-[0_0_24px_rgba(147,51,234,0.45),inset_0_1px_2px_rgba(255,255,255,0.2)]"
                  : "w-10 h-10 sm:w-auto sm:px-3.5 sm:py-1.5 justify-center sm:justify-start gap-2 border-white/20 border-b-black/40 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer active:scale-95 active:translate-y-[1px]"
              }`}
            >
              <button
                type={isSearchOpen ? "submit" : "button"}
                className="cursor-pointer"
                title="Search"
              >
                <Search
                  className={`transition-colors shrink-0 ${
                    isSearchOpen
                      ? "w-4 h-4 text-purple-400 mr-2 hover:text-purple-300"
                      : "w-4 h-4 text-neutral-400 group-hover:text-white"
                  }`}
                />
              </button>

              {/* Collapsed Search Prompt */}
              {!isSearchOpen && (
                <span className="hidden sm:inline text-xs font-semibold text-neutral-400 tracking-wide select-none">
                  Search...
                </span>
              )}

              {/* Expanded Big Search Area */}
              {isSearchOpen && (
                <div className="flex-1 flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search anime titles, series, movies... (Press Enter)"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-neutral-500 focus:outline-none"
                  />
                  {isLoadingSuggestions && (
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin mr-1" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange("");
                      setSuggestions([]);
                      setShowSuggestionsDropdown(false);
                      setIsSearchOpen(false);
                    }}
                    className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition ml-1 cursor-pointer"
                    title="Close search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && showSuggestionsDropdown && suggestions.length > 0 && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-full left-0 right-0 mt-2.5 rounded-2xl bg-[#12111b]/98 border border-white/10 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] overflow-hidden z-50 pointer-events-auto"
              >
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-400">
                    Search Suggestions
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {suggestions.length} found
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto no-scrollbar py-1">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const clean = item.id.replace(/^\/+|\/+$/g, "");
                        setShowSuggestionsDropdown(false);
                        setIsSearchOpen(false);
                        router.push(`/${clean}`);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-purple-950/40 border-b border-white/[0.03] last:border-0 transition cursor-pointer group"
                    >
                      <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-400 shrink-0" />
                      <span className="text-xs text-neutral-200 group-hover:text-white font-medium flex-1 truncate">
                        {item.title}
                      </span>
                      {item.type && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-900/30 border border-purple-500/30 text-purple-300 shrink-0">
                          {item.type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearchSubmit();
                  }}
                  className="p-2.5 bg-purple-950/40 hover:bg-purple-900/50 border-t border-white/5 text-center text-xs font-semibold text-purple-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View all results for &quot;{searchQuery}&quot;</span>
                  <span>&rarr;</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
