"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Flame,
  Calendar,
  Compass,
  Bookmark,
  Clock,
} from "lucide-react";
import { getGuestUser, GuestUserProfile } from "@/utils/cookieStorage";
import { GuestLoginModal } from "@/components/GuestLoginModal";

interface SidebarRailProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenSettings?: () => void;
}

export function SidebarRail({
  activeTab = "home",
  onTabChange,
  onOpenSettings,
}: SidebarRailProps) {
  const router = useRouter();
  const [guestUser, setGuestUser] = useState<GuestUserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setGuestUser(getGuestUser());
  }, []);

  const mainNavItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "trending", label: "Trending", icon: Flame, path: "/trending" },
    { id: "schedule", label: "Schedule", icon: Calendar, path: "/schedule" },
    { id: "discover", label: "Discover", icon: Compass, path: "/discover" },
    { id: "watchlist", label: "Watchlist", icon: Bookmark, path: "/watchlist" },
    { id: "history", label: "History", icon: Clock, path: "/history" },
  ];

  const handleNavClick = (item: (typeof mainNavItems)[0]) => {
    onTabChange?.(item.id);
    router.push(item.path);
  };

  return (
    <>
      <aside
        aria-label="Sidebar Navigation"
        className="hidden md:flex flex-col items-center justify-between w-[72px] lg:w-[76px] h-screen sticky top-0 left-0 bg-[#09090e]/95 backdrop-blur-2xl border-r border-white/5 py-5 z-40 shrink-0 select-none"
      >
        {/* Top: 3D Glossy Senkai Sora S Logo */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/"
            className="group relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
            title="Senkai Sora"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-purple-500/50 via-purple-700/60 to-indigo-900/80 p-[1.5px] border-t border-l border-white/40 border-r border-b border-black/50 shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_24px_rgba(168,85,247,0.5)] flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0c14] rounded-[calc(1rem-1.5px)] flex items-center justify-center shadow-inner">
                <span className="text-base font-black bg-gradient-to-br from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tighter">
                  S
                </span>
              </div>
            </div>
          </Link>

          {/* 3D Glowy Button Stack */}
          <nav className="flex flex-col items-center gap-3">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={item.label}
                  className={`group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-b from-purple-500/35 via-purple-700/40 to-indigo-950/60 border-t border-l border-purple-300/70 border-r border-b border-purple-950/50 text-white shadow-[0_0_18px_rgba(168,85,247,0.5),inset_0_1px_2px_rgba(255,255,255,0.35)] scale-[1.04]"
                      : "bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border-t border-l border-white/10 border-r border-b border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_12px_rgba(168,85,247,0.25)] active:scale-95 active:translate-y-[1px]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "scale-105 text-white" : "group-hover:scale-110"
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.75}
                  />

                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-purple-400 rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Profile Avatar */}
        <div className="flex flex-col items-center gap-4">
          {/* User profile avatar with online indicator - navigates directly to /profile */}
          <div
            onClick={() => router.push("/profile")}
            className="relative group cursor-pointer"
            title={`${guestUser?.username || "Guest"} Profile`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-t border-l border-white/30 border-r border-b border-purple-500/40 p-[1.5px] bg-gradient-to-tr from-purple-500 to-indigo-500 transition-transform duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <img
                src={guestUser?.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden"}
                alt="User Avatar"
                className="w-full h-full rounded-full object-cover bg-neutral-900"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#09090e] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
      </aside>

      {/* Guest Login Modal with 50 anime avatars */}
      <GuestLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onProfileUpdated={(updated) => setGuestUser(updated)}
      />
    </>
  );
}
