/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Airdrop } from "../types";
import { Clock, HelpCircle, ArrowUpRight, Heart, Share2 } from "lucide-react";
import React, { useState, useEffect } from "react";

interface AirdropCardProps {
  airdrop: Airdrop;
  onViewDetails: (airdrop: Airdrop) => void;
  onJoin: (airdrop: Airdrop) => void;
  isFavorite: boolean;
  onToggleFavorite: (airdropId: string) => void;
  isJoined: boolean;
}

export default function AirdropCard({
  airdrop,
  onViewDetails,
  onJoin,
  isFavorite,
  onToggleFavorite,
  isJoined,
}: AirdropCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?airdrop=${airdrop.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const difficultyColors = {
    Easy: "text-brand-accent border-brand-accent/20 bg-brand-accent/5",
    Medium: "text-brand-secondary border-brand-secondary/20 bg-brand-secondary/5",
    Hard: "text-red-400 border-red-400/20 bg-red-400/5",
  };

  return (
    <div
      id={`airdrop-card-${airdrop.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl glass-panel glass-panel-hover p-6 h-full border border-white/5 transition-all duration-300"
    >
      {/* Background glow on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div>
        {/* Header line */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center text-3xl w-14 h-14 rounded-xl bg-brand-bg border border-white/5 shadow-inner">
              {airdrop.logo}
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-white group-hover:text-brand-secondary transition-colors duration-200">
                {airdrop.name}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-medium font-mono text-brand-secondary border border-brand-secondary/30 bg-brand-secondary/5 rounded-full">
                  {airdrop.blockchain}
                </span>
                {airdrop.featured && (
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold font-mono text-black bg-brand-accent rounded-full uppercase shadow-neon-green">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 z-10">
            <button
              id={`fav-btn-${airdrop.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(airdrop.id);
              }}
              className={`p-2 rounded-lg border transition-colors duration-200 cursor-pointer ${
                isFavorite
                  ? "border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "border-white/5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title="Add to Favorites"
            >
              <Heart className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              id={`share-btn-${airdrop.id}`}
              onClick={handleShare}
              className="p-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
              title="Copy share link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {copied && (
          <div className="absolute top-16 right-4 z-20 px-2 py-1 text-[10px] text-brand-accent bg-black/90 rounded border border-brand-accent/20">
            Link Copied!
          </div>
        )}

        {/* Short description */}
        <p className="text-gray-400 text-sm leading-relaxed mb-5 min-h-[3.75rem] line-clamp-3">
          {airdrop.description}
        </p>
      </div>

      <div>
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-black/25 rounded-xl border border-white/5 p-2 text-center">
            <span className="block text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-0.5">Reward</span>
            <span className="text-xs font-bold text-brand-accent">{airdrop.reward}</span>
          </div>
          <div className="bg-black/25 rounded-xl border border-white/5 p-2 text-center">
            <span className="block text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-0.5">Difficulty</span>
            <span className={`text-[10px] font-semibold border rounded-full px-1.5 py-0.2 inline-block ${difficultyColors[airdrop.difficulty]}`}>
              {airdrop.difficulty}
            </span>
          </div>
          <div className="bg-black/25 rounded-xl border border-white/5 p-2 text-center">
            <span className="block text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-0.5">Timeline</span>
            <span className="text-xs font-bold text-yellow-400/90 flex items-center justify-center gap-0.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{airdrop.timeRemaining.split(" ")[0]}d</span>
            </span>
          </div>
        </div>

        {/* Join CTA Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            id={`details-btn-${airdrop.id}`}
            onClick={() => onViewDetails(airdrop)}
            className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-gray-300 text-xs font-semibold hover:text-white hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer text-center"
          >
            Details
          </button>
          <button
            id={`join-btn-${airdrop.id}`}
            onClick={() => onJoin(airdrop)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
              isJoined
                ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25 hover:bg-brand-accent/25 shadow-inner"
                : "bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:shadow-neon hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <span>{isJoined ? "Joined ✓" : "Join Now"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
