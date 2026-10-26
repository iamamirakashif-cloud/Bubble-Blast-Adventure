import React from 'react';
import { Play, Map, Volume2, VolumeX, Sparkles, Award, HelpCircle } from 'lucide-react';
import { sounds } from '../game/audio.ts';
import { PlayerProgress } from '../game/types.ts';
import { WORLDS } from '../game/levels.ts';

interface TitleScreenProps {
  progress: PlayerProgress;
  isMuted: boolean;
  onStartGame: (levelId?: number) => void;
  onOpenLevelMap: () => void;
  onOpenHelp: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  progress,
  isMuted,
  onStartGame,
  onOpenLevelMap,
  onOpenHelp,
  onToggleMute,
}) => {
  // Total stars collected across all levels
  const totalStars = Object.values(progress.levelStars).reduce((sum, s) => sum + s, 0);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white overflow-hidden select-none">
      {/* Decorative background bubbles floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-cyan-400 blur-xl animate-pulse" />
        <div className="absolute top-1/3 right-8 w-32 h-32 rounded-full bg-pink-500 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-16 w-28 h-28 rounded-full bg-yellow-400 blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-36 h-36 rounded-full bg-purple-500 blur-2xl" />
      </div>

      {/* Top Utility Bar */}
      <div className="relative w-full max-w-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg backdrop-blur-sm">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-amber-300 font-bold text-sm tracking-wide">{totalStars} Stars</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold text-sm">{progress.coins} Coins</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenHelp();
            }}
            aria-label="How to play instructions"
            className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              onToggleMute();
              sounds.playClick();
            }}
            aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
            className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Hero Title Emblem */}
      <div className="relative flex flex-col items-center text-center my-auto z-10 max-w-sm">
        {/* Animated 3D Bubble Mascot Ring */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-300 shadow-[0_0_35px_rgba(56,189,248,0.7)] flex items-center justify-center border-4 border-white/60 animate-bounce duration-1000">
            <Sparkles className="w-12 h-12 text-white animate-spin duration-3000" />
          </div>
          <div className="absolute -top-1 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 border-2 border-white/80 shadow-md" />
          <div className="absolute -bottom-2 -left-2 w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 border-2 border-white/80 shadow-md" />
          <div className="absolute -bottom-1 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 border-2 border-white/80 shadow-md" />
        </div>

        {/* Title text */}
        <div className="inline-block">
          <span className="text-xs uppercase tracking-widest font-extrabold text-cyan-400 drop-shadow-md">
            ULTIMATE ARCADE SHOOTER
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-sky-300 drop-shadow-[0_4px_12px_rgba(14,165,233,0.5)]">
            BUBBLE BLAST
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-wider -mt-1 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
            ADVENTURE
          </h2>
        </div>

        <p className="text-slate-300 text-xs sm:text-sm mt-3 font-medium px-4">
          Journey across 10 magical worlds and 100 exciting puzzle stages!
        </p>

        {/* Current world badge */}
        <div className="mt-4 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-sky-200">
          Current: Level {progress.unlockedLevel} · {WORLDS[Math.floor((progress.unlockedLevel - 1) / 10)]?.name || 'World 1'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative w-full max-w-xs flex flex-col gap-3 z-10 mb-2">
        <button
          data-start="true"
          onClick={() => {
            sounds.playClick();
            onStartGame(progress.unlockedLevel);
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xl tracking-wide uppercase shadow-[0_8px_25px_rgba(16,185,129,0.5)] border-2 border-emerald-200 hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>Play Level {progress.unlockedLevel}</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenLevelMap();
          }}
          className="w-full py-3 px-5 rounded-xl bg-slate-900/90 text-white font-bold text-base border border-slate-700/80 hover:bg-slate-800 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Map className="w-5 h-5 text-amber-400" />
          <span>Adventure Map (100 Levels)</span>
        </button>
      </div>

      {/* Bottom control hint as required by game title craft */}
      <div className="relative text-[11px] text-slate-400 font-medium tracking-wide z-10 text-center">
        Hold & Drag to Aim · Release to Shoot · Bounce off Walls
      </div>
    </div>
  );
};
