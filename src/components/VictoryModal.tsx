import React from 'react';
import { Star, Play, RotateCcw, Map, Award, Coins } from 'lucide-react';
import { LevelConfig } from '../game/types.ts';
import { sounds } from '../game/audio.ts';

interface VictoryModalProps {
  level: LevelConfig;
  score: number;
  starsEarned: number;
  remainingShots: number;
  bonusShotsScore: number;
  coinsEarned: number;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelMap: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  score,
  starsEarned,
  remainingShots,
  bonusShotsScore,
  coinsEarned,
  isLastLevel,
  onNextLevel,
  onReplay,
  onOpenLevelMap,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.35)] flex flex-col items-center text-center text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow backdrop */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Level Clear Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
          <Award className="w-4 h-4" />
          <span>Stage {level.id} Complete!</span>
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-sm">
          VICTORY!
        </h2>
        <p className="text-xs text-slate-300 mt-0.5">{level.theme.name}</p>

        {/* 3 Star Award Banner */}
        <div className="flex items-center justify-center gap-2 my-5">
          {[1, 2, 3].map((starIdx) => {
            const hasStar = starIdx <= starsEarned;
            const isCenter = starIdx === 2;
            return (
              <div
                key={starIdx}
                className={`relative flex items-center justify-center transition-transform ${
                  isCenter ? '-translate-y-2' : ''
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                    hasStar
                      ? 'bg-amber-400/20 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                      : 'bg-slate-800 border-slate-700 opacity-40'
                  }`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      hasStar
                        ? 'text-amber-300 fill-amber-300 drop-shadow-md animate-bounce'
                        : 'text-slate-600'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Metrics Card */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2 mb-5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Score</span>
            <span className="font-mono font-bold text-base text-white">{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Leftover Shots ({remainingShots})</span>
            <span className="font-mono font-bold text-emerald-400">+{bonusShotsScore.toLocaleString()}</span>
          </div>
          <div className="h-px bg-slate-800 my-0.5" />
          <div className="flex items-center justify-between font-bold">
            <span className="text-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              Coins Earned
            </span>
            <span className="font-mono text-base text-amber-300">+{coinsEarned}</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="w-full flex flex-col gap-2.5">
          {!isLastLevel && (
            <button
              data-start="true"
              onClick={() => {
                sounds.playClick();
                onNextLevel();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-lg tracking-wide uppercase shadow-[0_4px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Next Stage</span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                onReplay();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onOpenLevelMap();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Map className="w-4 h-4 text-amber-400" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
