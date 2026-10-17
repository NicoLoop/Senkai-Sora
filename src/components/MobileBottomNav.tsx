"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, BarChart2, Sparkles, Bookmark, User } from "lucide-react";
import { getWatchlist } from "@/utils/cookieStorage";

interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  myListCount?: number;
}

export function MobileBottomNav({
  activeTab = "home",
  onTabChange,
  myListCount,
}: MobileBottomNavProps) {
  const router = useRouter();
  const [badgeCount, setBadgeCount] = useState<number>(myListCount || 0);

  useEffect(() => {
    if (myListCount === undefined) {
      try {
        setBadgeCount(getWatchlist().length);
      } catch {
        // ignore
      }
    } else {
      setBadgeCount(myListCount);
    }
  }, [myListCount]);

  const tabs = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "trending", label: "Trending", icon: BarChart2, path: "/trending" },
    { id: "discover", label: "Discover", icon: Sparkles, path: "/discover" },
    { id: "my-list", label: "My List", icon: Bookmark, path: "/watchlist", badge: badgeCount > 0 ? badgeCount : null },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    if (onTabChange) {
      onTabChange(tab.id);
    }
    router.push(tab.path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0d0c14]/90 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id || (tab.id === "my-list" && activeTab === "watchlist");

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
              isActive ? "text-purple-400 font-semibold" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>

            {tab.badge && (
              <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                {tab.badge}
              </span>
            )}

            {isActive && (
              <span className="w-1 h-1 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,1)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

