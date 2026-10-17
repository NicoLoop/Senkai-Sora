"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Sparkles, User, Shield } from "lucide-react";
import {
  getGuestUser,
  setGuestUser,
  get50AvatarChoices,
  GuestUserProfile,
} from "@/utils/cookieStorage";

interface GuestLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (user: GuestUserProfile) => void;
}

export function GuestLoginModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: GuestLoginModalProps) {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [avatars, setAvatars] = useState<Array<{ id: string; url: string; name: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      const user = getGuestUser();
      setUsername(user.username || "Guest Ninja");
      setSelectedAvatar(user.avatarUrl);
      setAvatars(get50AvatarChoices());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = username.trim() || "Guest Ninja";
    const profile: GuestUserProfile = {
      username: trimmed,
      avatarUrl: selectedAvatar,
      joinedAt: Date.now(),
    };
    setGuestUser(profile);
    onProfileUpdated?.(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#100f1a] border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex flex-col shadow-[0_16px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Guest Account & Avatar
              </h2>
              <p className="text-xs text-neutral-400">
                Pick from 50 anime avatars and choose your guest nickname. Saved in cookies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-5 space-y-6">
          {/* Active Profile Preview Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#171526] border border-purple-500/20 shadow-inner">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-purple-950/60 border-2 border-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <img
                src={selectedAvatar}
                alt="Selected avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Guest Nickname
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                placeholder="Enter guest name..."
                className="w-full bg-[#0d0c14] border border-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 rounded-xl px-3.5 py-2 text-sm text-white font-bold placeholder-neutral-500 outline-none transition"
              />
            </div>
          </div>

          {/* 50 Anime Avatars Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Choose from 50 Anime PFPs</span>
              </label>
              <span className="text-[11px] text-purple-300 font-medium">
                {avatars.length} Available
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5 max-h-[300px] overflow-y-auto p-1.5 no-scrollbar bg-[#0b0a12] rounded-2xl border border-white/5">
              {avatars.map((av) => {
                const isSelected = selectedAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`group relative aspect-square rounded-xl overflow-hidden p-0.5 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-tr from-purple-500 to-indigo-500 scale-105 shadow-[0_0_12px_rgba(168,85,247,0.8)] ring-2 ring-purple-400"
                        : "bg-white/5 hover:bg-white/10 hover:scale-105 border border-white/10"
                    }`}
                    title={av.name}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-950/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Stored in your browser cookies</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.5)] transition cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
